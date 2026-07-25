export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: number;
  source: string;
  correlationId: string;
}

export type EventType = 
  | 'USER_REGISTERED'
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT'
  | 'MESSAGE_CREATED'
  | 'USER_ONLINE'
  | 'USER_UPDATED'
  | 'FRIEND_REQUEST_CREATED'
  | 'FRIEND_REQUEST_ACCEPTED'
  | 'FRIEND_REQUEST_REJECTED'
  | 'FRIEND_REQUEST_CANCELLED'
  | 'FRIENDSHIP_REMOVED'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_EDITED'
  | 'MESSAGE_DELETED'
  | 'MESSAGE_READ'
  | 'MESSAGE_REACTION_ADDED'
  | 'MESSAGE_REACTION_REMOVED'
  | 'USER_TYPING_STARTED'
  | 'USER_TYPING_STOPPED'
  | 'GROUP_CREATED'
  | 'GROUP_UPDATED'
  | 'GROUP_DELETED'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'MEMBER_KICKED'
  | 'MEMBER_BANNED'
  | 'MEMBER_UNBANNED'
  | 'MEMBER_PROMOTED'
  | 'MEMBER_DEMOTED'
  | 'INVITE_CREATED'
  | 'INVITE_REVOKED'
  | 'JOIN_REQUEST_SUBMITTED'
  | 'JOIN_REQUEST_APPROVED'
  | 'JOIN_REQUEST_REJECTED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'GROUP_MESSAGE_SENT'
  | 'GROUP_MESSAGE_EDITED'
  | 'GROUP_MESSAGE_DELETED'
  | 'GROUP_MESSAGE_READ'
  | 'GROUP_MESSAGE_REACTION_ADDED'
  | 'GROUP_MESSAGE_REACTION_REMOVED'
  | 'GROUP_MESSAGE_PINNED'
  | 'GROUP_MESSAGE_UNPINNED'
  | 'GROUP_ANNOUNCEMENT_CREATED'
  | 'FILE_UPLOAD_REQUESTED'
  | 'FILE_UPLOADED'
  | 'FILE_UPLOAD_FAILED'
  | 'FILE_DELETED'
  | 'FILE_METADATA_UPDATED'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_DELETED'
  | 'NOTIFICATION_DELIVERED'
  | 'NOTIFICATION_FAILED'
  | 'NOTIFICATION_PREFERENCE_UPDATED'
  | 'CALL_STARTED'
  | 'CALL_RINGING'
  | 'CALL_ACCEPTED'
  | 'CALL_REJECTED'
  | 'CALL_ENDED'
  | 'CALL_MISSED'
  | 'CALL_CANCELLED'
  | 'CALL_FAILED'
  | 'CALL_SIGNAL_SENT'
  | 'GROUP_CALL_STARTED'
  | 'GROUP_CALL_RINGING'
  | 'GROUP_CALL_JOINED'
  | 'GROUP_CALL_LEFT'
  | 'GROUP_CALL_ENDED'
  | 'GROUP_CALL_MISSED'
  | 'GROUP_CALL_CANCELLED'
  | 'GROUP_CALL_FAILED'
  | 'GROUP_CALL_SIGNAL_SENT'
  | 'SEARCH_INDEX_CREATED'
  | 'SEARCH_INDEX_UPDATED'
  | 'SEARCH_INDEX_REMOVED'
  | 'SEARCH_COMPLETED'
  | 'SEARCH_HISTORY_CLEARED'
  | 'SEARCH_REINDEX_REQUESTED'
  | 'SEARCH_REINDEX_COMPLETED'
  | 'AI_SUMMARY_REQUESTED'
  | 'AI_SUMMARY_CREATED'
  | 'AI_SMART_REPLY_CREATED'
  | 'AI_REWRITE_CREATED'
  | 'AI_TRANSLATION_CREATED'
  | 'AI_GRAMMAR_FIXED'
  | 'AI_MODERATION_COMPLETED'
  | 'AI_GROUP_DESCRIPTION_CREATED'
  | 'AI_GROUP_RULES_CREATED'
  | 'AI_REQUEST_FAILED';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface UserLoggedInPayload {
  userId: string;
  deviceId?: string;
  ipAddress?: string;
}

export interface UserLoggedOutPayload {
  userId: string;
  sessionId?: string;
}

// Media Module Payload Interfaces
export interface FileUploadRequestedPayload {
  sessionId: string;
  ownerId: string;
  originalName: string;
  sizeBytes: number;
}

export interface FileUploadedPayload {
  fileId: string;
  ownerId: string;
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
  fileType: string;
}

export interface FileUploadFailedPayload {
  sessionId: string;
  ownerId: string;
  reason: string;
}

export interface FileDeletedPayload {
  fileId: string;
  ownerId: string;
  storageKey: string;
}

export interface FileMetadataUpdatedPayload {
  fileId: string;
  ownerId: string;
}

// Notifications Module Payload Interfaces
export interface NotificationCreatedPayload {
  notificationId: string;
  userId: string;
  category: string;
  type: string;
}

export interface NotificationReadPayload {
  notificationId: string;
  userId: string;
}

export interface NotificationDeletedPayload {
  notificationId: string;
  userId: string;
}

export interface NotificationDeliveredPayload {
  notificationId: string;
  channel: string;
}

export interface NotificationFailedPayload {
  notificationId: string;
  channel: string;
  error: string;
}

export interface NotificationPreferenceUpdatedPayload {
  userId: string;
  category: string;
  channel: string;
  isEnabled: boolean;
}

// Calls Module Payload Interfaces
export interface CallStartedPayload {
  callSessionId: string;
  callerId: string;
  calleeId: string;
  hasVideo: boolean;
}

export interface CallRingingPayload {
  callSessionId: string;
  calleeId: string;
}

export interface CallAcceptedPayload {
  callSessionId: string;
  calleeId: string;
}

export interface CallRejectedPayload {
  callSessionId: string;
  calleeId: string;
}

export interface CallEndedPayload {
  callSessionId: string;
  endedById: string;
  durationSeconds: number;
}

export interface CallMissedPayload {
  callSessionId: string;
  callerId: string;
  calleeId: string;
}

export interface CallCancelledPayload {
  callSessionId: string;
  callerId: string;
}

export interface CallFailedPayload {
  callSessionId: string;
  reason: string;
}

export interface CallSignalSentPayload {
  callSessionId: string;
  senderId: string;
  type: string;
}


export interface EventPayloadMap {
  USER_REGISTERED: UserRegisteredPayload;
  USER_LOGGED_IN: UserLoggedInPayload;
  USER_LOGGED_OUT: UserLoggedOutPayload;
  MESSAGE_CREATED: { messageId: string; senderId: string };
  USER_ONLINE: { userId: string };
  USER_UPDATED: { userId: string };
  FRIEND_REQUEST_CREATED: { requestId: string; senderId: string; receiverId: string };
  FRIEND_REQUEST_ACCEPTED: { requestId: string; senderId: string; receiverId: string };
  FRIEND_REQUEST_REJECTED: { requestId: string; senderId: string; receiverId: string };
  FRIEND_REQUEST_CANCELLED: { requestId: string; senderId: string; receiverId: string };
  FRIENDSHIP_REMOVED: { userId: string; friendId: string };
  USER_BLOCKED: { blockerId: string; blockedId: string };
  USER_UNBLOCKED: { blockerId: string; blockedId: string };
  MESSAGE_SENT: { messageId: string; conversationId: string; senderId: string; content: string; messageType: string };
  MESSAGE_EDITED: { messageId: string; conversationId: string; content: string };
  MESSAGE_DELETED: { messageId: string; conversationId: string; deletedForEveryone: boolean };
  MESSAGE_READ: { messageId: string; conversationId: string; userId: string };
  MESSAGE_REACTION_ADDED: { messageId: string; conversationId: string; userId: string; emoji: string };
  MESSAGE_REACTION_REMOVED: { messageId: string; conversationId: string; userId: string; emoji: string };
  USER_TYPING_STARTED: { conversationId: string; userId: string };
  USER_TYPING_STOPPED: { conversationId: string; userId: string };
  GROUP_CREATED: { groupId: string; creatorId: string };
  GROUP_UPDATED: { groupId: string; updatedBy: string };
  GROUP_DELETED: { groupId: string; deletedBy: string };
  MEMBER_JOINED: { groupId: string; userId: string; role: string; inviteCode?: string };
  MEMBER_LEFT: { groupId: string; userId: string };
  MEMBER_KICKED: { groupId: string; userId: string; kickedBy: string };
  MEMBER_BANNED: { groupId: string; userId: string; bannedBy: string; reason?: string };
  MEMBER_UNBANNED: { groupId: string; userId: string; unbannedBy: string };
  MEMBER_PROMOTED: { groupId: string; userId: string; role: string; promotedBy: string };
  MEMBER_DEMOTED: { groupId: string; userId: string; role: string; demotedBy: string };
  INVITE_CREATED: { groupId: string; inviteCode: string; creatorId: string };
  INVITE_REVOKED: { groupId: string; inviteCode: string; revokedBy: string };
  JOIN_REQUEST_SUBMITTED: { groupId: string; userId: string; requestId: string };
  JOIN_REQUEST_APPROVED: { groupId: string; userId: string; requestId: string; approvedBy: string };
  JOIN_REQUEST_REJECTED: { groupId: string; userId: string; requestId: string; rejectedBy: string };
  OWNERSHIP_TRANSFERRED: { groupId: string; previousOwnerId: string; newOwnerId: string };
  GROUP_MESSAGE_SENT: { messageId: string; conversationId: string; groupId: string; senderId: string; content: string; messageType: string };
  GROUP_MESSAGE_EDITED: { messageId: string; conversationId: string; groupId: string; content: string };
  GROUP_MESSAGE_DELETED: { messageId: string; conversationId: string; groupId: string; deletedForEveryone: boolean };
  GROUP_MESSAGE_READ: { messageId: string; conversationId: string; groupId: string; userId: string };
  GROUP_MESSAGE_REACTION_ADDED: { messageId: string; conversationId: string; groupId: string; userId: string; emoji: string };
  GROUP_MESSAGE_REACTION_REMOVED: { messageId: string; conversationId: string; groupId: string; userId: string; emoji: string };
  GROUP_MESSAGE_PINNED: { messageId: string; groupId: string; pinnedBy: string };
  GROUP_MESSAGE_UNPINNED: { messageId: string; groupId: string; unpinnedBy: string };
  GROUP_ANNOUNCEMENT_CREATED: { messageId: string; groupId: string; createdBy: string };
  FILE_UPLOAD_REQUESTED: FileUploadRequestedPayload;
  FILE_UPLOADED: FileUploadedPayload;
  FILE_UPLOAD_FAILED: FileUploadFailedPayload;
  FILE_DELETED: FileDeletedPayload;
  FILE_METADATA_UPDATED: FileMetadataUpdatedPayload;
  NOTIFICATION_CREATED: NotificationCreatedPayload;
  NOTIFICATION_READ: NotificationReadPayload;
  NOTIFICATION_DELETED: NotificationDeletedPayload;
  NOTIFICATION_DELIVERED: NotificationDeliveredPayload;
  NOTIFICATION_FAILED: NotificationFailedPayload;
  NOTIFICATION_PREFERENCE_UPDATED: NotificationPreferenceUpdatedPayload;
  CALL_STARTED: CallStartedPayload;
  CALL_RINGING: CallRingingPayload;
  CALL_ACCEPTED: CallAcceptedPayload;
  CALL_REJECTED: CallRejectedPayload;
  CALL_ENDED: CallEndedPayload;
  CALL_MISSED: CallMissedPayload;
  CALL_CANCELLED: CallCancelledPayload;
  CALL_FAILED: CallFailedPayload;
  CALL_SIGNAL_SENT: CallSignalSentPayload;
  GROUP_CALL_STARTED: GroupCallStartedPayload;
  GROUP_CALL_RINGING: GroupCallRingingPayload;
  GROUP_CALL_JOINED: GroupCallJoinedPayload;
  GROUP_CALL_LEFT: GroupCallLeftPayload;
  GROUP_CALL_ENDED: GroupCallEndedPayload;
  GROUP_CALL_MISSED: GroupCallMissedPayload;
  GROUP_CALL_CANCELLED: GroupCallCancelledPayload;
  GROUP_CALL_FAILED: GroupCallFailedPayload;
  GROUP_CALL_SIGNAL_SENT: GroupCallSignalSentPayload;
  SEARCH_INDEX_CREATED: SearchIndexCreatedPayload;
  SEARCH_INDEX_UPDATED: SearchIndexUpdatedPayload;
  SEARCH_INDEX_REMOVED: SearchIndexRemovedPayload;
  SEARCH_COMPLETED: SearchCompletedPayload;
  SEARCH_HISTORY_CLEARED: SearchHistoryClearedPayload;
  SEARCH_REINDEX_REQUESTED: SearchReindexRequestedPayload;
  SEARCH_REINDEX_COMPLETED: SearchReindexCompletedPayload;
}

// Future phases will add specific event payloads here
export type AppEvent = BaseEvent & { payload: unknown };

// Group Calls Module Payload Interfaces
export interface GroupCallStartedPayload {
  groupCallSessionId: string;
  groupId: string;
  startedBy: string;
}

export interface GroupCallRingingPayload {
  groupCallSessionId: string;
  groupId: string;
}

export interface GroupCallJoinedPayload {
  groupCallSessionId: string;
  groupId: string;
  userId: string;
}

export interface GroupCallLeftPayload {
  groupCallSessionId: string;
  groupId: string;
  userId: string;
}

export interface GroupCallEndedPayload {
  groupCallSessionId: string;
  groupId: string;
  endedById: string;
  durationSeconds: number;
}

export interface GroupCallMissedPayload {
  groupCallSessionId: string;
  groupId: string;
}

export interface GroupCallCancelledPayload {
  groupCallSessionId: string;
  groupId: string;
  cancelledById: string;
}

export interface GroupCallFailedPayload {
  groupCallSessionId: string;
  groupId: string;
  error: string;
}

export interface GroupCallSignalSentPayload {
  groupCallSessionId: string;
  groupId: string;
  senderId: string;
  type: string;
}

// Search Module Payload Interfaces
export interface SearchIndexCreatedPayload {
  entityType: string;
  entityId: string;
  ownerId?: string;
}

export interface SearchIndexUpdatedPayload {
  entityType: string;
  entityId: string;
}

export interface SearchIndexRemovedPayload {
  entityType: string;
  entityId: string;
}

export interface SearchCompletedPayload {
  userId: string;
  query: string;
  category: string;
}

// --- AI Event Payloads ---

export interface AISummaryRequestedPayload {
  userId: string;
  targetId: string;
  targetType: 'GROUP' | 'CONVERSATION';
}

export interface AISummaryCreatedPayload {
  userId: string;
  targetId: string;
  targetType: 'GROUP' | 'CONVERSATION';
  summary: any;
}

export interface AISmartReplyCreatedPayload {
  userId: string;
  targetId: string;
  targetType: 'GROUP' | 'CONVERSATION';
  replies: string[];
}

export interface AIRewriteCreatedPayload {
  userId: string;
  originalText: string;
  rewrittenText: string;
  tone: string;
}

export interface AITranslationCreatedPayload {
  userId: string;
  originalText: string;
  translatedText: string;
  targetLanguage: string;
}

export interface AIGrammarFixedPayload {
  userId: string;
  originalText: string;
  correctedText: string;
}

export interface AIModerationCompletedPayload {
  userId: string;
  targetText: string;
  safe: boolean;
  categories: any;
  confidence: number;
  reason?: string;
}

export interface AIGroupDescriptionCreatedPayload {
  userId: string;
  groupName: string;
  purpose: string;
  description: string;
}

export interface AIGroupRulesCreatedPayload {
  userId: string;
  groupName: string;
  rules: string[];
}

export interface AIRequestFailedPayload {
  userId: string;
  feature: string;
  errorMessage: string;
}

export interface SearchHistoryClearedPayload {
  userId: string;
}

export interface SearchReindexRequestedPayload {
  requestedBy: string;
  entityType?: string;
}

export interface SearchReindexCompletedPayload {
  entityType?: string;
  recordsProcessed: number;
}

