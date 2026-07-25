# Architecture Overview

This project is a Modular Monolith.
It is a single Express application internally divided into domain modules that act as bounded contexts.

## Module Map & Data Ownership
| Module | Responsibilities | Prisma Data Models Owned |
|--------|------------------|--------------------------|
| Auth   | Login, tokens    | User, Session            |
| Users  | Profiles, Friends| UserProfile, Friendship  |
| Chat   | Messaging        | Conversation, Message    |
| Groups | Group Mgmt       | Group, GroupMember       |
| Media  | File uploads     | File, Upload             |
| Search | Full-Text Search | SearchIndex, History     |

*(Models will be populated incrementally in later phases)*
