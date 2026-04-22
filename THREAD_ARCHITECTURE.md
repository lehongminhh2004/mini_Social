# MiniSocial Thread - New Architecture & Roadmap

## 1. Concept Overview

**MiniSocial Thread** = Twitter-like social platform focused on:
- 📝 **Threads** - Tweet-like posts with rich interactions
- 🔁 **Follow System** - Users follow each other (no friend requests)
- 💬 **Direct Messages** - 1-to-1 chat between mutual followers (2-way follow)
- 😊 **Reactions** - Like, Love, Haha, Sad, Angry emojis
- 🗣️ **Comments/Replies** - Reply to threads
- 📤 **Share/Retweet** - Share threads
- 🔔 **Notifications** - Real-time activity alerts

---

## 2. Key Differences from Facebook Design

| Feature | Facebook-like | Thread-like (NEW) |
|---------|---------------|------------------|
| Post Type | Long-form posts | Short tweets/threads |
| Social Model | Friend requests | Direct follow |
| Messaging | Group chats | 1-to-1 DMs (mutual followers) |
| Discovery | Friends only | Explore all users |
| Timeline | Friends feed | Following feed |
| Interactions | Like, Comment, Share | React, Reply, Retweet, DM |

---

## 3. Updated Database Schema

### Users Table (Same)
```sql
id, email, password, name, avatar, bio, createdAt, updatedAt
```

### Threads Table (NEW - replaces Posts)
```sql
- id (UUID) - PRIMARY KEY
- content (TEXT) - Max 280 chars
- authorId (UUID) - FOREIGN KEY -> Users
- image (STRING, NULLABLE)
- replyToId (UUID, NULLABLE) - FOREIGN KEY -> Threads (for thread replies)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Follows Table (NEW)
```sql
- id (UUID) - PRIMARY KEY
- followerId (UUID) - FOREIGN KEY -> Users
- followingId (UUID) - FOREIGN KEY -> Users
- createdAt (TIMESTAMP)
- UNIQUE (followerId, followingId)
```

### Reactions Table (UPDATED)
```sql
- id (UUID) - PRIMARY KEY
- type (ENUM: LIKE, LOVE, HAHA, SAD, ANGRY) - NEW: Haha, Sad, Angry
- threadId (UUID) - FOREIGN KEY -> Threads (changed from postId)
- userId (UUID) - FOREIGN KEY -> Users
- createdAt (TIMESTAMP)
```

### DirectMessages Table (NEW)
```sql
- id (UUID) - PRIMARY KEY
- conversationId (UUID) - FOREIGN KEY -> Conversations
- senderId (UUID) - FOREIGN KEY -> Users
- content (TEXT)
- image (STRING, NULLABLE)
- createdAt (TIMESTAMP)
```

### Conversations Table (NEW)
```sql
- id (UUID) - PRIMARY KEY
- user1Id (UUID) - FOREIGN KEY -> Users
- user2Id (UUID) - FOREIGN KEY -> Users
- lastMessageAt (TIMESTAMP)
- createdAt (TIMESTAMP)
- UNIQUE (user1Id, user2Id)  -- Ensure one conversation per pair
```

### Notifications Table (NEW - optional for real-time)
```sql
- id (UUID) - PRIMARY KEY
- userId (UUID) - FOREIGN KEY -> Users
- type (ENUM: FOLLOW, LIKE, REPLY, MENTION, DM)
- referenceId (UUID) - ID of thread/message/user
- read (BOOLEAN, DEFAULT: false)
- createdAt (TIMESTAMP)
```

### Retweets Table (NEW)
```sql
- id (UUID) - PRIMARY KEY
- threadId (UUID) - FOREIGN KEY -> Threads
- userId (UUID) - FOREIGN KEY -> Users
- createdAt (TIMESTAMP)
- UNIQUE (threadId, userId)
```

---

## 4. Updated API Endpoints

### Threads API
```
GET    /api/threads              - Get timeline (threads from following)
GET    /api/threads/explore      - Explore all threads
GET    /api/threads/:id          - Get single thread + replies
POST   /api/threads              - Create thread (Auth)
DELETE /api/threads/:id          - Delete thread (Auth)
POST   /api/threads/:id/reply    - Reply to thread (Auth)
```

### Follow API (NEW)
```
POST   /api/users/:id/follow     - Follow user (Auth)
DELETE /api/users/:id/unfollow   - Unfollow user (Auth)
GET    /api/users/:id/followers  - List followers
GET    /api/users/:id/following  - List following
GET    /api/users/:id/mutual     - Check if mutual follow
```

### Reactions API (UPDATED)
```
POST   /api/threads/:id/react    - React to thread (Auth) - with type
DELETE /api/threads/:id/react    - Remove reaction (Auth)
GET    /api/threads/:id/reactions - Get reactions
```

### Retweet API (NEW)
```
POST   /api/threads/:id/retweet  - Retweet thread (Auth)
DELETE /api/threads/:id/retweet  - Remove retweet (Auth)
```

### Direct Messages API (NEW)
```
GET    /api/messages/conversations   - Get all conversations (Auth)
GET    /api/messages/conversations/:id - Get conversation messages (Auth)
POST   /api/messages                  - Send message (Auth)
DELETE /api/messages/:id              - Delete message (Auth)
PUT    /api/messages/:id              - Edit message (Auth)
```

### Notifications API (NEW)
```
GET    /api/notifications       - Get notifications (Auth)
POST   /api/notifications/:id/read - Mark as read (Auth)
```

### Users API (UPDATED)
```
GET    /api/users/:id           - Get user profile
GET    /api/users/:id/threads   - Get user's threads
PUT    /api/users/:id           - Update profile (Auth)
```

---

## 5. Frontend Pages Structure

```
app/
├── page.tsx                     (Timeline - Home)
├── explore/page.tsx             (Explore threads)
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
├── thread/
│   └── [id]/page.tsx            (Thread detail + replies)
├── messages/
│   ├── page.tsx                 (Conversations list)
│   └── [conversationId]/page.tsx (Chat with one person)
├── profile/
│   └── [username]/page.tsx      (User profile)
├── notifications/page.tsx       (Notifications)
└── components/
    ├── Sidebar.tsx
    ├── ComposeThread.tsx
    ├── ThreadCard.tsx
    ├── ReactionButton.tsx
    ├── FollowButton.tsx
    └── ChatWindow.tsx
```

---

## 6. Development Phases

### ✅ Phase 1: Complete (Auth)
- [x] Authentication (Login, Register, JWT)
- [x] User management

### 📋 Phase 2: Core Threads Feature (NEXT)
- [ ] Thread CRUD operations
- [ ] Timeline (showing threads from following users)
- [ ] Explore page (discover all threads)
- [ ] Thread replies/comments
- [ ] Updated Reactions (5 types)
- [ ] Retweet functionality

### 📋 Phase 3: Follow System
- [ ] Follow/Unfollow users
- [ ] Followers/Following lists
- [ ] Mutual follow detection

### 📋 Phase 4: Direct Messaging
- [ ] DM list page
- [ ] 1-to-1 chat
- [ ] Send/receive messages
- [ ] Only allow between mutual followers

### 📋 Phase 5: Notifications
- [ ] Real-time notifications
- [ ] Activity feed
- [ ] Mark as read

### 📋 Phase 6: Polish & Deploy
- [ ] Performance optimization
- [ ] Testing
- [ ] Deployment

---

## 7. UI/UX Changes

### Current (Facebook-style)
- 3-column layout
- Wide posts
- Large friend lists

### New (Twitter-style)
- 2-column layout: Sidebar (nav) | Feed | Right sidebar
- Narrow threads (280-500 chars)
- Compose thread box at top
- Smaller profile cards
- Thread detail view with replies nested

---

## 8. Implementation Priority

### Must-Have (MVP)
1. ✅ Authentication (already done)
2. Thread creation & display
3. Follow/Unfollow
4. Thread replies
5. Reactions (5 types)
6. Timeline (show threads from following)

### Nice-to-Have
1. Retweet
2. DM system
3. Notifications
4. Explore page
5. Search

---

## 9. Database Migration Steps

```bash
# 1. Backup current DB
# 2. Drop posts, comments tables (or migrate data)

# 3. Update Prisma schema with new tables:
#    - Threads (replaces Posts)
#    - Follows (new)
#    - DirectMessages (new)
#    - Conversations (new)
#    - Retweets (new)
#    - Notifications (new)

# 4. Run migration
npx prisma migrate dev --name add_thread_follow_dm

# 5. Seed test data (optional)
npx prisma db seed
```

---

## 10. Tech Stack (Same)
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: MySQL
- Auth: JWT
- Real-time (Optional): WebSocket/Socket.io for notifications & live messages

---

## 11. Comparison: Previous vs New

### Previous (Facebook-Clone)
```
Users can:
- Create long posts
- Send friend requests
- Comment on posts
- React (Like, Love) on posts
- See only friends' posts
```

### New (Twitter-Clone Thread)
```
Users can:
- Create short threads/tweets
- Follow users directly
- Reply to threads
- React with 5 emotions (Like, Love, Haha, Sad, Angry)
- Retweet threads
- Send DMs to mutual followers
- See threads from following users
- Explore all public threads
- Get notifications
```

---

## 12. Key Design Decisions

1. **No Friend Requests**: Direct follow only (simpler, faster)
2. **Mutual Follow = Friends**: DM only available after mutual follow
3. **Short Threads**: 280 char default (enforced in backend)
4. **Threaded Replies**: Replies shown as indented under original thread
5. **Timeline**: Reverse chronological order, only from following users
6. **Public Explore**: All threads visible, can follow from there
7. **Reactions**: 5 emoji types (match Twitter/X approach)

---

## 13. Success Criteria ✅

- [ ] Users can create & view threads
- [ ] Users can follow/unfollow
- [ ] Thread replies work
- [ ] All 5 reactions work
- [ ] Retweet counts
- [ ] DM works between mutual followers
- [ ] Timeline shows only following threads
- [ ] Notifications working
- [ ] Mobile responsive
- [ ] Deployment successful

---

**Status:** Planning complete ✅
**Next:** Start Phase 2 - Core Threads Feature
**Estimated Time:** 2 weeks

