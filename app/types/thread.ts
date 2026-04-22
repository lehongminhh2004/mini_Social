export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'SAD' | 'ANGRY';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
}

export interface ThreadReactionSummary {
  LIKE: number;
  LOVE: number;
  HAHA: number;
  SAD: number;
  ANGRY: number;
}

export interface ThreadItem {
  id: string;
  content: string;
  createdAt: string;
  image?: string;
  author: UserProfile;
  repliesCount: number;
  retweets: number;
  reactions: ThreadReactionSummary;
}

export interface NotificationItem {
  id: string;
  type: 'FOLLOW' | 'LIKE' | 'REPLY' | 'MENTION' | 'DM';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: UserProfile;
  lastMessage: string;
  lastMessageAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}
