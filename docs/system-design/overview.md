# System Design Overview

## Capacity Assumptions
- Target Concurrent Users: TBD
- Messages/sec: TBD

## Consistency Notes
- Within a module: Strong consistency (transactional)
- Across modules: Eventual consistency (EventEmitter)

## Module Boundaries

### Auth Module
- **Responsibility:** Identity, Authentication, OAuth, Sessions, Password resets
- **Models:** `User`, `Session`, `OAuthAccount`, `VerificationToken`
- **Data Access:** Restricted to Auth Repository

### Users Module (Phase 3)
- **Responsibility:** User profiles, Privacy settings, Friendships, Contacts, Blocking
- **Models:** `UserProfile`, `PrivacySettings`, `FriendRequest`, `Friendship`, `Contact`, `Block`
- **Data Access:** Restricted to Users Repository. Consumes `USER_REGISTERED` from Auth Module.

### Chat Module (Phase 4)
- **Responsibility:** 1-to-1 Direct Messaging, read receipts, reactions, typing indicators
- **Models:** `Conversation`, `ConversationParticipant`, `Message`, `MessageStatus`, `MessageReaction`
- **Data Access:** Restricted to Chat Repository.

### Groups Module (Phase 5)
- **Responsibility:** Group creation, membership, roles, invites, join requests, moderation, group settings
- **Models:** `Group`, `GroupMember`, `GroupInvite`, `GroupJoinRequest`, `GroupBan`, `GroupSettings`, `GroupAuditLog`
- **Data Access:** Restricted to Groups Repository.

### Group Messaging Module (Phase 6)
- **Responsibility:** Messaging inside groups, pinned messages, announcements, reactions, read receipts
- **Models:** `GroupConversation`, `GroupConversationParticipant`, `GroupMessage`, `GroupMessageHidden`, `GroupMessageReaction`, `GroupMessageReadReceipt`, `GroupPinnedMessage`, `GroupAnnouncement`
- **Data Access:** Restricted to Group Messaging Repository. Consumes membership from Groups Module.
