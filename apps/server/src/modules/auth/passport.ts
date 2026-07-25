import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../shared/config/index.js';
import { prisma } from '../../prisma/client.js';
import { eventEmitter } from '../../events/emitter.js';
import crypto from 'crypto';

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Define OAuth account-linking behavior:
          // 1. Must have a verified email
          const emailObj = profile.emails?.find(e => e.verified);
          if (!emailObj) {
            return done(new Error('No verified email from Google'));
          }

          const email = emailObj.value;

          // Transaction to ensure atomicity
          const { user, isNewUser } = await prisma.$transaction(async (tx) => {
            // Find existing OAuth account
            const existingOAuth = await tx.oAuthAccount.findUnique({
              where: {
                provider_providerUserId: {
                  provider: 'GOOGLE',
                  providerUserId: profile.id
                }
              },
              include: { user: true }
            });

            if (existingOAuth) {
              return { user: existingOAuth.user, isNewUser: false };
            }

            // Find existing user by email
            let existingUser = await tx.user.findUnique({ where: { email } });

            let newUserFlag = false;
            if (!existingUser) {
              // Create new user
              newUserFlag = true;
              existingUser = await tx.user.create({
                data: {
                  email,
                  name: profile.displayName,
                  avatarUrl: profile.photos?.[0]?.value,
                  isEmailVerified: true,
                }
              });
            }

            // Link account
            await tx.oAuthAccount.create({
              data: {
                userId: existingUser.id,
                provider: 'GOOGLE',
                providerUserId: profile.id,
              }
            });

            return { user: existingUser, isNewUser: newUserFlag };
          });

          if (isNewUser) {
            eventEmitter.emitEvent('USER_REGISTERED', {
              eventId: crypto.randomUUID(),
              eventType: 'USER_REGISTERED',
              timestamp: new Date().toISOString(),
              version: 1,
              source: 'auth-module',
              correlationId: crypto.randomUUID(),
              payload: { userId: user.id, email: user.email, name: profile.displayName, avatarUrl: profile.photos?.[0]?.value }
            });
          }

          return done(null, { userId: user.id, email: user.email });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export default passport;
