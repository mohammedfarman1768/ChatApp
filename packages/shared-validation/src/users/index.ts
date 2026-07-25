import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    bio: z.string().max(500).optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    customStatus: z.string().max(100).optional().nullable(),
  })
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>['body'];

export const UpdatePrivacySchema = z.object({
  body: z.object({
    profileVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
    statusVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
  })
});
export type UpdatePrivacyInput = z.infer<typeof UpdatePrivacySchema>['body'];

export const SendFriendRequestSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid(),
  })
});
export type SendFriendRequestInput = z.infer<typeof SendFriendRequestSchema>['body'];

export const AddContactSchema = z.object({
  body: z.object({
    contactUserId: z.string().uuid(),
    alias: z.string().max(50).optional().nullable(),
  })
});
export type AddContactInput = z.infer<typeof AddContactSchema>['body'];

export const BlockUserSchema = z.object({
  body: z.object({
    blockedId: z.string().uuid(),
  })
});
export type BlockUserInput = z.infer<typeof BlockUserSchema>['body'];

export const PaginationSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  })
});

export const SearchUsersSchema = z.object({
  query: z.object({
    query: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  })
});
