// ============================================================
// User
// ============================================================
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
}

// ============================================================
// Reactions
// ============================================================
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'SAD' | 'ANGRY';

export type ReactionSummary = Record<ReactionType, number>;

// ============================================================
// Post (maps to BE PostResponseDTO)
// ============================================================
export interface Post {
  id: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  mediaUrl?: string | null;
  createdAt: string;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  reactionBreakdown: ReactionSummary;
  isLiked: boolean;
  isShared: boolean;  

}

// ============================================================
// Comment
// ============================================================
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
}

// ============================================================
// Notification
// ============================================================
export type NotificationType = 'REACTION' | 'COMMENT' | 'SHARE' | 'FOLLOW';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  isRead: boolean;
  sender?: Pick<User, 'username' | 'fullName' | 'avatarUrl'>;
}

// ============================================================
// Chat / Messages
// ============================================================
export interface ChatMessage {
  id: string;
  senderUsername: string;
  receiverUsername: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  partnerUsername: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
}

// ============================================================
// Pagination
// ============================================================
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
