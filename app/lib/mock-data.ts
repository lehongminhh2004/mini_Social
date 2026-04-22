import type { Conversation, DirectMessage, NotificationItem, ThreadItem, UserProfile } from '@/app/types/thread';

export const mockUsers: UserProfile[] = [
  { id: 'u1', name: 'Nguyễn Văn A', username: 'nva', bio: 'Frontend dev', followers: 123, following: 99 },
  { id: 'u2', name: 'Trần Thị B', username: 'ttb', bio: 'Design lover', followers: 89, following: 64 },
  { id: 'u3', name: 'Phạm Minh C', username: 'pmc', bio: 'Build in public', followers: 230, following: 145 },
];

export const mockThreads: ThreadItem[] = [
  {
    id: 't1',
    content: 'Hôm nay deploy thành công production 🎉',
    createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    author: mockUsers[0],
    repliesCount: 4,
    retweets: 2,
    reactions: { LIKE: 11, LOVE: 4, HAHA: 0, SAD: 0, ANGRY: 0 },
  },
  {
    id: 't2',
    content: 'Ai có tips tối ưu Next.js app router không?',
    createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    author: mockUsers[1],
    repliesCount: 8,
    retweets: 1,
    reactions: { LIKE: 9, LOVE: 1, HAHA: 1, SAD: 0, ANGRY: 0 },
  },
  {
    id: 't3',
    content: 'Vừa viết xong API notifications, cảm giác thật đã 😄',
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    author: mockUsers[2],
    repliesCount: 3,
    retweets: 5,
    reactions: { LIKE: 24, LOVE: 6, HAHA: 2, SAD: 0, ANGRY: 0 },
  },
];

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', type: 'FOLLOW', message: 'Trần Thị B đã theo dõi bạn.', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false },
  { id: 'n2', type: 'LIKE', message: 'Phạm Minh C đã thích thread của bạn.', createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(), read: true },
  { id: 'n3', type: 'DM', message: 'Bạn có tin nhắn mới từ Nguyễn Văn A.', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), read: false },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    participant: mockUsers[0],
    lastMessage: 'Mai mình review PR nhé',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: 'c2',
    participant: mockUsers[1],
    lastMessage: 'Ok bạn, mình update xong rồi',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

export const mockMessages: DirectMessage[] = [
  { id: 'm1', conversationId: 'c1', senderId: 'u1', content: 'Bạn rảnh không?', createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
  { id: 'm2', conversationId: 'c1', senderId: 'me', content: 'Có nè, sao thế?', createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString() },
  { id: 'm3', conversationId: 'c1', senderId: 'u1', content: 'Mai mình review PR nhé', createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
  { id: 'm4', conversationId: 'c2', senderId: 'u2', content: 'Ok bạn, mình update xong rồi', createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
];
