# Full-Stack Real-Time Communication Platform

A production-quality, full-stack, real-time communication platform built as a modular monolith.

## Setup Instructions
1. Run `docker-compose up -d` in `/infrastructure/docker` to start Postgres and Redis.
2. Run `npm install` in the root directory.
3. Copy `.env.example` to `.env` and fill in any required values.
4. Run `npm run dev` to start the frontend and backend in development mode.

## Phase Log
- **Phase 1**: Infrastructure & Project Setup (Completed)
- **Phase 2**: Auth Module (Completed)
- **Phase 3**: Users & Contacts Module (Completed)
- **Phase 4-9**: Messaging, Groups, 1-to-1 Calls (Completed)
- **Phase 10**: Group Voice & Video Calls (Completed)

## Group Calls Features (Phase 10)
- **Ring Timeout**: Group calls in `RINGING` state automatically expire to `MISSED` after 60 seconds if unanswered.
- **Participant Limit**: Strictly enforced limit of 25 participants per active group call.
- **Concurrency Limit**: Exactly one active call permitted per group at any given time.
- **Role Restrictions**: Only the group owner, admins, moderators, or the call creator can forcibly end or cancel a group call.
- **Signal Persistence**: WebRTC signals (e.g. offers/answers) can optionally be persisted via REST, but default signaling uses ephemeral Socket.IO events to prevent database bloat.
- **Known Limitations**:
  - *Concurrent Creation Race*: Extreme concurrent creation attempts within the same millisecond could bypass the 1-active-call limit (to be solved with DB constraints or distributed locks in Phase 12).
  - *Event Delivery*: Events are emitted post-commit without an outbox pattern; server crashes precisely between commit and emit may lose events (to be solved with outbox pattern in Phase 12).
  - *No Distributed Locking*: Scaling to multi-instance requires Redis and distributed locks (deferred to Phase 12+).
