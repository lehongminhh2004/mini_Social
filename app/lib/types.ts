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
  mediaUrls?: string[];  
  createdAt: string;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  reactionBreakdown: ReactionSummary;
  isLiked: boolean;
  isShared: boolean;  
  authorFollowerCount?: number;
}

// ============================================================
// Comment
// ============================================================
export interface Comment {
  id: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  author: User;
  totalReactions?: number;
  totalReplies?: number;
  totalShares?: number;
  isLiked?: boolean;
  isShared?: boolean;
  parentCommentId?: string | null;
  replyingToUsername?: string;
  postId: string; // ID của bài viết gốc chứa bình luận này
}

// ============================================================
// Share (Repost)
// ============================================================
export interface ShareItem {
  shareId: string;
  type: 'POST' | 'COMMENT';
  post?: Post;
  comment?: Comment;
  sharedAt: string;
}

// ============================================================
// Notification
// ============================================================
export type NotificationType = 'REACTION' | 'COMMENT' | 'SHARE' | 'FOLLOW';

export interface NotificationItem {
  id: string;
  message: string;
  type: string;
  targetId: string; 
  isRead: boolean;
  createdAt: string;
  senderUsername?: string;
  senderFullName?: string;
  senderAvatarUrl?: string;
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