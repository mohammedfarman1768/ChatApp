import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client.js';

export const authRepository = {
  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async createSession(data: Prisma.SessionUncheckedCreateInput) {
    return prisma.session.create({ data });
  },

  async findSessionById(id: string) {
    return prisma.session.findUnique({ where: { id } });
  },

  async findSessionByTokenHash(refreshTokenHash: string) {
    return prisma.session.findUnique({ where: { refreshTokenHash } });
  },

  async deleteSession(id: string) {
    return prisma.session.delete({ where: { id } });
  },

  async deleteAllSessions(userId: string) {
    return prisma.session.deleteMany({ where: { userId } });
  },
  
  async getUserSessions(userId: string) {
    return prisma.session.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  },

  async createVerificationToken(data: Prisma.VerificationTokenUncheckedCreateInput) {
    return prisma.verificationToken.create({ data });
  },

  async findVerificationToken(tokenHash: string) {
    return prisma.verificationToken.findUnique({ where: { tokenHash } });
  },

  async markTokenUsed(id: string) {
    return prisma.verificationToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  },

  async verifyUserEmail(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true }
    });
  },

  async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }
};
