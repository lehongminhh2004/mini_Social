'use client';

import { Avatar } from './ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { Heart, MessageCircle, Repeat2, Send, Mail } from 'lucide-react';
import { Post } from '@/app/lib/types';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface PostCardProps {
  post: Post;
  hasReplies?: boolean;
  isReply?: boolean;
}

export function PostCard({ post, hasReplies = false, isReply = false }: PostCardProps) {
  // ĐÃ SỬA: Đưa State showHoverCard lên đúng vị trí (không được để trong function khác)
  const [showHoverCard, setShowHoverCard] = useState(false);
  
  const [isLiked, setIsLiked] = useState(post.isLiked || false); 
  const [likesCount, setLikesCount] = useState(post.totalReactions);
  const [isShared, setIsShared] = useState(post.isShared || false); 
  const [sharesCount, setSharesCount] = useState(post.totalShares || 0);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.totalReactions);
    setIsShared(post.isShared || false);
    setSharesCount(post.totalShares || 0);
  }, [post.isLiked, post.totalReactions, post.isShared, post.totalShares]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      await api.post(`/reactions/post/${post.id}?type=LIKE`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    } catch {
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1));
    }
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newIsShared = !isShared;
    setIsShared(newIsShared);
    setSharesCount((prev) => (newIsShared ? prev + 1 : prev - 1));

    try {
      await api.post(`/shares/post/${post.id}`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    } catch (error) {
      setIsShared(!newIsShared);
      setSharesCount((prev) => (!newIsShared ? prev + 1 : prev - 1));
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
            
            {/* ĐÃ SỬA: Cụm Tên và Username có Hover Card */}
            <div 
              className="relative flex items-center gap-1"
              onMouseEnter={() => setShowHoverCard(true)}
              onMouseLeave={() => setShowHoverCard(false)}
            >
              <Link href={`/profile/${post.authorUsername}`} className="font-semibold text-foreground hover:underline">
                {post.authorName ?? post.authorUsername}
              </Link>
              <span className="text-muted text-sm">@{post.authorUsername}</span>

              {/* HOVER CARD: Chỉ hiện ra khi showHoverCard = true */}
              {showHoverCard && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-background rounded-2xl shadow-[0_5px_20px_rgba(0,0,0,0.15)] border border-border p-4 z-50 cursor-default" onClick={(e) => e.preventDefault()}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{post.authorName ?? post.authorUsername}</h3>
                      <p className="text-muted text-sm">@{post.authorUsername}</p>
                    </div>
                    <Avatar src={post.authorAvatarUrl} alt="avatar" size="md" />
                  </div>
                  <div className="text-sm text-foreground/80 mb-4">
                    <span className="font-semibold text-foreground">23</span> người theo dõi
                  </div>
                  <button className="w-full bg-foreground text-background font-bold py-2 rounded-xl hover:bg-foreground/80 transition-colors">
                    Theo dõi
                  </button>
                </div>
              )}
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
              onClick={handleShare}
              className={`flex items-center gap-1.5 group transition-colors ${
                isShared ? 'text-green-500' : 'hover:text-green-500'
              }`}
            >
              <motion.div whileTap={{ scale: 0.8 }}>
                <Repeat2 size={20} className={isShared ? 'stroke-current' : ''} />
              </motion.div>
            </button>

            <button className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <Send size={20} />
            </button>
          </div>

          {(likesCount > 0 || post.totalComments > 0 || sharesCount > 0) && (
            <div className="flex items-center gap-2 mt-3 text-muted text-[15px]">
              {post.totalComments > 0 && <span>{post.totalComments} replies</span>}
              {post.totalComments > 0 && (likesCount > 0 || sharesCount > 0) && <span>·</span>}
              {likesCount > 0 && <span>{likesCount} likes</span>}
              {likesCount > 0 && sharesCount > 0 && <span>·</span>}
              {sharesCount > 0 && <span>{sharesCount} reposts</span>}
            </div>
          )}
        </div>
      </article>
      {!isReply && <div className="h-[1px] w-full bg-border" />}
    </Link>
  );
}