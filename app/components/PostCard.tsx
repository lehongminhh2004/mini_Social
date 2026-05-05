'use client';

import { Avatar } from './ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, Edit2, Trash2, Flag } from 'lucide-react';
import { Post } from '@/app/lib/types';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/lib/auth-context'; 

// 🔥 Đã xóa CommentModal, dùng chung PostComposer siêu cấp
import { PostComposer } from './PostComposer';
import { ShareToMessageModal } from './ShareToMessageModal';
import { EditPostModal } from './EditPostModal'; 

interface PostCardProps {
  post: Post;
  hasReplies?: boolean;
  isReply?: boolean;
}

export function PostCard({ post, hasReplies = false, isReply = false }: PostCardProps) {
  const router = useRouter(); 
  const { user } = useAuth(); 
  const queryClient = useQueryClient();
  
  const [showHoverCard, setShowHoverCard] = useState(false);
  
  // 🔥 Sử dụng isReplying thay cho isCommentModalOpen
  const [isReplying, setIsReplying] = useState(false); 
  const [isShareMessageModalOpen, setIsShareMessageModalOpen] = useState(false); 
  
  // States cho Menu và Modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [isLiked, setIsLiked] = useState(post.isLiked || false); 
  const [likesCount, setLikesCount] = useState(post.totalReactions);
  const [isShared, setIsShared] = useState(post.isShared || false); 
  const [sharesCount, setSharesCount] = useState(post.totalShares || 0);
  const [commentsCount, setCommentsCount] = useState(post.totalComments || 0);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false); 

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.totalReactions);
    setIsShared(post.isShared || false);
    setSharesCount(post.totalShares || 0);
    setCommentsCount(post.totalComments || 0);
  }, [post.isLiked, post.totalReactions, post.isShared, post.totalShares, post.totalComments]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); 
    if (!user) { alert("Bạn cần đăng nhập!"); router.push('/auth/login'); return; }
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked); setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    try { await api.post(`/reactions/post/${post.id}?type=LIKE`); queryClient.invalidateQueries({ queryKey: ['feed'] }); } 
    catch { setIsLiked(!newIsLiked); setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1)); }
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); 
    if (!user) { alert("Bạn cần đăng nhập!"); router.push('/auth/login'); return; }
    const newIsShared = !isShared;
    setIsShared(newIsShared); setSharesCount((prev) => (newIsShared ? prev + 1 : prev - 1));
    try { await api.post(`/shares/post/${post.id}`); queryClient.invalidateQueries({ queryKey: ['feed'] }); } 
    catch { setIsShared(!newIsShared); setSharesCount((prev) => (!newIsShared ? prev + 1 : prev - 1)); }
  };

  // 🔥 Mở Form PostComposer để bình luận
  const handleCommentClick = (e: React.MouseEvent) => { 
      e.preventDefault(); e.stopPropagation(); 
      if (!user) { alert("Bạn cần đăng nhập!"); router.push('/auth/login'); return; } 
      setIsReplying(true); 
  };
  
  const handleSendMessageClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!user) { alert("Bạn cần đăng nhập!"); router.push('/auth/login'); return; } setIsShareMessageModalOpen(true); };
  const handleFollowClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!user) { alert("Bạn cần đăng nhập!"); router.push('/auth/login'); return; } router.push(`/profile/${post.authorUsername}`); };

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) return;
    
    try {
      await api.delete(`/posts/${post.id}`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: ['user-threads', user.username] });
      }
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasDragged.current) { hasDragged.current = false; return; }
    if ((e.target as HTMLElement).closest('button, a, textarea')) return;
    router.push(`/thread/${post.id}`);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true; hasDragged.current = false;
    if (!sliderRef.current) return;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };
  const onMouseLeaveOrUp = () => {
    isDragging.current = false;
    setTimeout(() => { hasDragged.current = false; }, 50);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault(); hasDragged.current = true; 
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; 
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const renderImageCarousel = (images: string[] | undefined) => {
    if (!images || images.length === 0) return null;
    if (images.length === 1) {
      return (
        <div className="mt-3 relative rounded-xl overflow-hidden border border-border">
          <img src={images[0]} alt="Post media" className="w-full h-auto object-cover max-h-[500px]" />
        </div>
      );
    }
    return (
      <div 
        ref={sliderRef} onMouseDown={onMouseDown} onMouseLeave={onMouseLeaveOrUp} onMouseUp={onMouseLeaveOrUp} onMouseMove={onMouseMove}
        onClickCapture={(e) => { if (hasDragged.current) e.stopPropagation(); }}
        className="mt-3 flex gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x cursor-grab active:cursor-grabbing"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="relative flex-shrink-0 rounded-xl overflow-hidden border border-border snap-center w-[240px] sm:w-[260px] h-[300px] sm:h-[350px]">
            <img src={img} alt={`Post media ${idx}`} className="w-full h-full object-cover pointer-events-none" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div onClick={handleCardClick} className="block relative cursor-pointer group/card">
      <article className="flex gap-3 p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex flex-col items-center">
          <Avatar src={post.authorAvatarUrl} alt={post.authorName ?? post.authorUsername} size="md" className="z-10 bg-background" />
          {hasReplies && <div className="w-[2px] bg-border flex-grow my-2 min-h-[30px]" />}
        </div>

        <div className="flex-1 pb-2 min-w-0">
          <div className="flex justify-between items-start">
            <div className="relative flex items-center gap-1" onMouseEnter={() => setShowHoverCard(true)} onMouseLeave={() => setShowHoverCard(false)}>
              <Link href={`/profile/${post.authorUsername}`} className="font-semibold text-foreground hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                {post.authorName ?? post.authorUsername}
              </Link>
              <span className="text-muted text-sm truncate">@{post.authorUsername}</span>

              {showHoverCard && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-background rounded-2xl shadow-[0_5px_20px_rgba(0,0,0,0.15)] border border-border p-4 z-50 cursor-default" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{post.authorName ?? post.authorUsername}</h3>
                      <p className="text-muted text-sm">@{post.authorUsername}</p>
                    </div>
                    <Avatar src={post.authorAvatarUrl} alt="avatar" size="md" />
                  </div>
                  <div className="text-sm text-foreground/80 mb-4">
                    <span className="font-semibold text-foreground">{post.authorFollowerCount || 0}</span> người theo dõi
                  </div>
                  <button onClick={handleFollowClick} className="w-full bg-foreground text-background font-bold py-2 rounded-xl hover:bg-foreground/80 transition-colors">
                    Xem hồ sơ
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted text-sm">
              <span>{timeAgo(post.createdAt)}</span>
              <div className="relative" ref={menuRef}>
                <button 
                  className="p-1 rounded-full hover:bg-secondary/80 text-muted hover:text-foreground transition-colors" 
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                >
                  <MoreHorizontal size={18} />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 top-8 w-40 bg-background border border-border rounded-xl shadow-lg z-[100] overflow-hidden py-1">
                    {user?.username === post.authorUsername ? (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); setIsMenuOpen(false); }} 
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary text-sm font-medium transition-colors"
                        >
                          <Edit2 size={16} /> Chỉnh sửa
                        </button>
                        <button 
                          onClick={handleDeletePost} 
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary text-red-500 text-sm font-medium transition-colors"
                        >
                          <Trash2 size={16} /> Xóa bài
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); alert("Chức năng đang phát triển!"); }} 
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary text-sm font-medium transition-colors"
                      >
                        <Flag size={16} /> Báo cáo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-1 text-foreground/90 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {post.content}
          </div>

          {renderImageCarousel(post.mediaUrls)}

          <div className="flex items-center gap-4 mt-3 text-foreground">
            <button onClick={handleLike} className={`flex items-center gap-1.5 group transition-colors z-10 relative ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}><motion.div whileTap={{ scale: 0.8 }}><Heart size={20} className={isLiked ? 'fill-current' : ''} /></motion.div></button>
            <button onClick={handleCommentClick} className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors z-10 relative"><MessageCircle size={20} /></button>
            <button onClick={handleShare} className={`flex items-center gap-1.5 group transition-colors z-10 relative ${isShared ? 'text-green-500' : 'hover:text-green-500'}`}><motion.div whileTap={{ scale: 0.8 }}><Repeat2 size={20} className={isShared ? 'stroke-current' : ''} /></motion.div></button>
            <button onClick={handleSendMessageClick} className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors z-10 relative"><Send size={20} /></button>
          </div>

          {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
            <div className="flex items-center gap-2 mt-3 text-muted text-[15px]">
              {commentsCount > 0 && <span>{commentsCount} replies</span>}
              {commentsCount > 0 && (likesCount > 0 || sharesCount > 0) && <span>·</span>}
              {likesCount > 0 && <span>{likesCount} likes</span>}
              {likesCount > 0 && sharesCount > 0 && <span>·</span>}
              {sharesCount > 0 && <span>{sharesCount} reposts</span>}
            </div>
          )}
        </div>
      </article>
      
      {!isReply && <div className="h-[1px] w-full bg-border" />}

      {/* 🔥 ĐÃ GẮN POST COMPOSER VÀO ĐÂY ĐỂ BÌNH LUẬN */}
      <PostComposer 
        isOpen={isReplying} 
        onClose={() => setIsReplying(false)} 
        replyToId={post.id}
        onSuccess={() => {
          setCommentsCount(prev => prev + 1);
          queryClient.invalidateQueries({ queryKey: ['feed'] });
        }} 
      />

      <ShareToMessageModal post={post} isOpen={isShareMessageModalOpen} onClose={() => setIsShareMessageModalOpen(false)} />
      
      <EditPostModal post={post} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
}