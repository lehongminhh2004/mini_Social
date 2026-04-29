'use client';

import { Avatar } from './ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { Heart, MessageCircle, Repeat2, Send } from 'lucide-react';
import { Post } from '@/app/lib/types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface PostCardProps {
  post: Post;
  hasReplies?: boolean;
  isReply?: boolean;
}

export function PostCard({ post, hasReplies = false, isReply = false }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.totalReactions);
  const queryClient = useQueryClient();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newIsLiked = !isLiked;
    // Optimistic update
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      // BE dùng toggle: gọi cùng endpoint để like/unlike
      await api.post(`/reactions/post/${post.id}?type=LIKE`);
      // Invalidate feed để đồng bộ số liệu thật
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <Link href={`/thread/${post.id}`} className="block relative">
      <article className="flex gap-3 p-4 hover:bg-white/[0.02] transition-colors">
        {/* Left Column */}
        <div className="flex flex-col items-center">
          <Avatar
            src={post.authorAvatarUrl}
            alt={post.authorName ?? post.authorUsername}
            size="md"
            className="z-10 bg-background"
          />
          {hasReplies && (
            <div className="w-[2px] bg-border flex-grow my-2 min-h-[30px]" />
          )}
        </div>

        {/* Right Column */}
        <div className="flex-1 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground hover:underline">
                {post.authorName ?? post.authorUsername}
              </span>
              <span className="text-muted text-sm">@{post.authorUsername}</span>
            </div>
            <div className="flex items-center gap-2 text-muted text-sm">
              <span>{timeAgo(post.createdAt)}</span>
              <button className="hover:text-foreground">⋯</button>
            </div>
          </div>

          <div className="mt-1 text-foreground/90 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {post.content}
          </div>

          {post.mediaUrl && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-border">
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-foreground">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 group transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <motion.div whileTap={{ scale: 0.8 }}>
                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
              </motion.div>
            </button>
            <button className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <MessageCircle size={20} />
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await api.post(`/shares/post/${post.id}`);
                  queryClient.invalidateQueries({ queryKey: ['feed'] });
                } catch {}
              }}
              className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors"
            >
              <Repeat2 size={20} />
            </button>
            <button className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <Send size={20} />
            </button>
          </div>

          {(likesCount > 0 || post.totalComments > 0) && (
            <div className="flex items-center gap-2 mt-3 text-muted text-[15px]">
              {post.totalComments > 0 && <span>{post.totalComments} replies</span>}
              {post.totalComments > 0 && likesCount > 0 && <span>·</span>}
              {likesCount > 0 && <span>{likesCount} likes</span>}
            </div>
          )}
        </div>
      </article>
      {!isReply && <div className="h-[1px] w-full bg-border" />}
    </Link>
  );
}
