import { prisma } from '../../prisma/client.js';
import { GroupMessageType } from '@prisma/client';
import { ISendGroupMessageData, IGroupMessagePagination } from './types.js';

export const groupMessageRepository = {
  async getOrCreateConversation(groupId: string, tx: any = prisma) {
    let conversation = await tx.groupConversation.findUnique({
      where: { groupId },
    });

    if (!conversation) {
      conversation = await tx.groupConversation.create({
        data: { groupId },
      });
    }

    return conversation;
  },

  async getParticipant(conversationId: string, userId: string, tx: any = prisma) {
    let participant = await tx.groupConversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      participant = await tx.groupConversationParticipant.create({
        data: {
          conversationId,
          userId,
        },
      });
    }

    return participant;
  },

  async createMessage(data: ISendGroupMessageData, tx: any = prisma) {
    const conversation = await this.getOrCreateConversation(data.groupId, tx);
    
    // Ensure sender is a participant
    await this.getParticipant(conversation.id, data.senderId, tx);

    const message = await tx.groupMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || GroupMessageType.TEXT,
        replyToMessageId: data.replyToMessageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
          }
        }
      }
    });

    await tx.groupConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
      },
    });

    return message;
  },

  async getMessageById(messageId: string, tx: any = prisma) {
    return tx.groupMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
      }
    });
  },

  async editMessage(messageId: string, content: string, tx: any = prisma) {
    return tx.groupMessage.update({
      where: { id: messageId },
      data: {
        content,
        edited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });
  },

  async deleteMessageForEveryone(messageId: string, tx: any = prisma) {
    return tx.groupMessage.update({
      where: { id: messageId },
      data: {
        deletedForEveryone: true,
        deletedAt: new Date(),
        content: '', // scrub content
      },
    });
  },

  async hideMessageForUser(messageId: string, userId: string, tx: any = prisma) {
    return tx.groupMessageHidden.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        }
      },
      update: {},
      create: {
        messageId,
        userId,
      }
    });
  },

  async getMessages(groupId: string, userId: string, pagination: IGroupMessagePagination) {
    const conversation = await prisma.groupConversation.findUnique({
      where: { groupId },
    });

    if (!conversation) {
      return { messages: [], nextCursor: null };
    }

    const messages = await prisma.groupMessage.findMany({
      where: {
        conversationId: conversation.id,
        hiddenBy: {
          none: {
            userId: userId,
          }
        }
      },
      take: pagination.limit + 1,
      cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
          }
        },
      }
    });

    let nextCursor: string | null = null;
    if (messages.length > pagination.limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id || null;
    }

    // Mask content if deletedForEveryone
    const maskedMessages = messages.map(msg => {
      if (msg.deletedForEveryone) {
        msg.content = 'This message was deleted.';
      }
      return msg;
    });

    return {
      messages: maskedMessages,
      nextCursor,
    };
  },

  async addReaction(messageId: string, userId: string, emoji: string, tx: any = prisma) {
    return tx.groupMessageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      }
    });
  },

  async removeReaction(messageId: string, userId: string, emoji: string, tx: any = prisma) {
    return tx.groupMessageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      }
    });
  },

  async markAsRead(messageId: string, userId: string, tx: any = prisma) {
    return tx.groupMessageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        }
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
      }
    });
  },
  
  async getPinnedMessages(groupId: string) {
    return prisma.groupPinnedMessage.findMany({
      where: { groupId },
      include: {
        message: {
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        }
      },
      orderBy: {
        pinnedAt: 'desc'
      }
    });
  },

  async pinMessage(groupId: string, messageId: string, pinnedBy: string, tx: any = prisma) {
    // Upsert to handle if it's already pinned
    return tx.groupPinnedMessage.upsert({
      where: { messageId },
      update: {},
      create: {
        groupId,
        messageId,
        pinnedBy,
      }
    });
  },

  async unpinMessage(messageId: string, tx: any = prisma) {
    return tx.groupPinnedMessage.deleteMany({
      where: { messageId }
    });
  },

  async getAnnouncements(groupId: string, pagination: IGroupMessagePagination) {
    const announcements = await prisma.groupAnnouncement.findMany({
      where: { groupId },
      take: pagination.limit + 1,
      cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        message: {
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true }
            }
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (announcements.length > pagination.limit) {
      const nextItem = announcements.pop();
      nextCursor = nextItem?.id || null;
    }

    return {
      announcements,
      nextCursor,
    };
  },

  async createAnnouncement(groupId: string, messageId: string, createdBy: string, tx: any = prisma) {
    return tx.groupAnnouncement.create({
      data: {
        groupId,
        messageId,
        createdBy,
      }
    });
  }
};
