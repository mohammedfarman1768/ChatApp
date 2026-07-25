import nodemailer from 'nodemailer';
import { env } from '../config/index.js';
import { logger } from '../logger/index.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailService = {
  async sendVerificationEmail(to: string, token: string) {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
            <h2 style="color: #111827; font-size: 24px; margin-bottom: 8px;">Verify your email</h2>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">Click the button below to verify your email address. This link expires in 24 hours.</p>
            <a href="${url}" style="display: inline-block; padding: 14px 28px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Verify Email</a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Or copy this link: <a href="${url}" style="color: #2563EB;">${url}</a></p>
          </div>
        `,
      });
      logger.info({ messageId: info.messageId, to }, 'Verification email sent successfully');
    } catch (error) {
      logger.error({ error, to }, 'Failed to send verification email');
      throw error;
    }
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: 'Reset your password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
            <h2 style="color: #111827; font-size: 24px; margin-bottom: 8px;">Reset your password</h2>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${url}" style="display: inline-block; padding: 14px 28px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Or copy this link: <a href="${url}" style="color: #2563EB;">${url}</a></p>
          </div>
        `,
      });
      logger.info({ messageId: info.messageId, to }, 'Password reset email sent successfully');
    } catch (error) {
      logger.error({ error, to }, 'Failed to send password reset email');
      throw error;
    }
  },
};
