import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../shared/config/index.js';
import { authRepository } from './repository.js';
import { BadRequestError, UnauthorizedError } from '../../shared/errors/index.js';
import { RegisterInput, LoginInput, ResetPasswordInput } from '@repo/shared-validation';
import { AuthPayload } from './types.js';
import { emailService } from '../../shared/utils/email.js';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const authService = {
  async register(data: RegisterInput) {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new BadRequestError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    const user = await authRepository.createUser({
      email: data.email,
      passwordHash,
      name: data.name,
    });

    await this.generateAndSendVerificationToken(user.id, user.email);

    return user;
  },

  async login(data: LoginInput, deviceInfo?: { userAgent?: string; ipAddress?: string }) {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.createTokensAndSession(user.id, user.email, deviceInfo);
  },

  async createTokensAndSession(userId: string, email: string, deviceInfo?: { userAgent?: string; ipAddress?: string }) {
    const payload: AuthPayload = { userId, email };
    
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    
    // Generate secure random refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await authRepository.createSession({
      userId,
      refreshTokenHash,
      expiresAt,
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ipAddress,
    });

    return { accessToken, refreshToken, expiresAt };
  },

  async refreshTokens(oldRefreshToken: string, deviceInfo?: { userAgent?: string; ipAddress?: string }) {
    const oldTokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    const session = await authRepository.findSessionByTokenHash(oldTokenHash);

    if (!session) {
      // Possible reuse detection or just invalid token.
      // If we want advanced reuse detection, we'd need to store the family of tokens.
      // For now, if the session is not found, it could mean it was already revoked.
      // A more advanced approach checks if the token belongs to a known family and revokes all if reused.
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await authRepository.deleteSession(session.id);
      throw new UnauthorizedError('Refresh token expired');
    }

    // Valid session found. Invalidate old session (rotation) and create new one
    await authRepository.deleteSession(session.id);
    
    const user = await authRepository.findUserById(session.userId);
    if (!user) throw new UnauthorizedError('User not found');

    return this.createTokensAndSession(user.id, user.email, deviceInfo);
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await authRepository.findSessionByTokenHash(tokenHash);
    if (session) {
      await authRepository.deleteSession(session.id);
    }
  },

  async logoutAll(userId: string) {
    await authRepository.deleteAllSessions(userId);
  },

  async getUserSessions(userId: string) {
    return authRepository.getUserSessions(userId);
  },

  async revokeSession(userId: string, sessionId: string) {
    // Only delete if it belongs to the user
    const session = await authRepository.findSessionById(sessionId);
    if (session && session.userId === userId) {
      await authRepository.deleteSession(session.id);
    }
  },

  async generateAndSendVerificationToken(userId: string, userEmail: string) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    await authRepository.createVerificationToken({
      userId,
      tokenHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt
    });

    await emailService.sendVerificationEmail(userEmail, rawToken);
  },

  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verificationRecord = await authRepository.findVerificationToken(tokenHash);
    
    if (!verificationRecord || verificationRecord.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestError('Invalid token');
    }
    
    if (verificationRecord.usedAt || verificationRecord.expiresAt < new Date()) {
      throw new BadRequestError('Token expired or already used');
    }

    await authRepository.verifyUserEmail(verificationRecord.userId);
    await authRepository.markTokenUsed(verificationRecord.id);
  },

  async requestPasswordReset(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) return; // Do not reveal if user exists

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await authRepository.createVerificationToken({
      userId: user.id,
      tokenHash,
      type: 'PASSWORD_RESET',
      expiresAt
    });

    await emailService.sendPasswordResetEmail(user.email, rawToken);
  },

  async resetPassword(data: ResetPasswordInput) {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
    const resetRecord = await authRepository.findVerificationToken(tokenHash);

    if (!resetRecord || resetRecord.type !== 'PASSWORD_RESET') {
      throw new BadRequestError('Invalid token');
    }

    if (resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestError('Token expired or already used');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    await authRepository.updatePassword(resetRecord.userId, passwordHash);
    await authRepository.markTokenUsed(resetRecord.id);
    
    // Invalidate all active sessions for security
    await authRepository.deleteAllSessions(resetRecord.userId);
  }
};
