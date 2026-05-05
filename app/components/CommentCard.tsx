'use client';

import { Avatar } from './ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, Edit2, Trash2, Flag } from 'lucide-react';
import { Comment } from '@/app/lib/types';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/lib/auth-context'; 

import { PostComposer } from './PostComposer';
import { EditCommentModal } from './EditCommentModal'; 
import { ImageViewerModal } from './ImageViewerModal'; 

interface CommentCardProps {
  comment: Comment;
  postId: string;
  replies?: Comment[];
}

export function CommentCard({ comment, postId, replies }: CommentCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const router = useRouter(); 
  const { user } = useAuth(); 
  const queryClient = useQueryClient();
  
  const [isReplying, setIsReplying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  
  const [isLiked, setIsLiked] = useState(comment.isLiked || false); 
  const [likesCount, setLikesCount] = useState(comment.totalReactions || 0);
  const [isShared, setIsShared] = useState(comment.isShared || false); 
  const [sharesCount, setSharesCount] = useState(comment.totalShares || 0);
  const [repliesCount, setRepliesCount] = useState(comment.totalReplies || 0);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false); 

  useEffect(() => {
    setIsLiked(comment.isLiked || false);
    setIsShared(comment.isShared || false);
    setLikesCount(comment.totalReactions || 0);  
    setSharesCount(comment.totalShares || 0);    
    setRepliesCount(comment.totalReplies || 0);  
  }, [comment]); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Đăng nhập để thả tim!"); router.push('/auth/login'); return; }
    const newIsLiked = !isLiked; setIsLiked(newIsLiked); setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    try {
      await api.post(`/reactions/comment/${comment.id}?type=LIKE`);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch { setIsLiked(!newIsLiked); setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1)); }
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Đăng nhập để đăng lại!"); router.push('/auth/login'); return; }
    const newIsShared = !isShared; setIsShared(newIsShared); setSharesCount((prev) => (newIsShared ? prev + 1 : prev - 1));
    try {
      await api.post(`/shares/comment/${comment.id}`);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch { setIsShared(!newIsShared); setSharesCount((prev) => (!newIsShared ? prev + 1 : prev - 1)); }
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Đăng nhập để trả lời!"); router.push('/auth/login'); return; }
    setIsReplying(true);
  };

  const handleDeleteComment = async (e: React.MouseEvent) => {
    e.stopPropagation(); setIsMenuOpen(false);
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await api.delete(`/comments/${comment.id}`);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) { alert("Xóa thất bại!"); }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true; hasDragged.current = false;
    if (!sliderRef.current) return;
    startX.current = e.pageX - sliderRef.current.offsetLeft; scrollLeft.current = sliderRef.current.scrollLeft;
  };
  const onMouseLeaveOrUp = () => { isDragging.current = false; setTimeout(() => { hasDragged.current = false; }, 50); };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault(); hasDragged.current = true; 
    const x = e.pageX - sliderRef.current.offsetLeft; const walk = (x - startX.current) * 1.5; 
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const renderImageCarousel = (images: string[] | undefined) => {
    if (!images || images.length === 0) return null;
    if (images.length === 1) {
      return (
        <div onClick={(e) => { e.stopPropagation(); setViewerIndex(0); setViewerOpen(true); }} className="mt-3 relative rounded-xl overflow-hidden border border-border max-w-[80%] cursor-pointer">
          <img src={images[0]} alt="Comment media" className="w-full h-auto object-cover max-h-[350px]" />
        </div>
      );
    }
    return (
      <div 
        ref={sliderRef} onMouseDown={onMouseDown} onMouseLeave={onMouseLeaveOrUp} onMouseUp={onMouseLeaveOrUp} onMouseMove={onMouseMove}
        onClickCapture={(e) => { if (hasDragged.current) e.stopPropagation(); }}
        className="mt-3 flex gap-2 overflow-x-auto pb-2 hide-scrollbar snap-x cursor-grab active:cursor-grabbing max-w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((img, idx) => (
          <div key={idx} onClick={(e) => { e.stopPropagation(); setViewerIndex(idx); setViewerOpen(true); }} className="relative flex-shrink-0 rounded-xl overflow-hidden border border-border snap-center w-[200px] h-[250px] cursor-pointer">
            <img src={img} alt={`Comment media ${idx}`} className="w-full h-full object-cover pointer-events-none" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-border/50">
        <div className="flex flex-col items-center">
          <Avatar src={comment.author.avatarUrl} alt={comment.author.username} size="sm" />
          {showReplies && replies && replies.length > 0 && <div className="w-[2px] bg-border/50 flex-grow my-2 min-h-[30px]" />}
        </div>

        <div className="flex-1 pb-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <Link href={`/profile/${comment.author.username}`} className="font-semibold text-[15px] text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
                {comment.author.fullName || comment.author.username}
              </Link>
            </div>
            
            <div className="flex items-center gap-2 text-muted text-[13px]">
              <span>{timeAgo(comment.createdAt)}</span>
              <div className="relative" ref={menuRef}>
                <button className="p-1 rounded-full hover:bg-secondary/80 text-muted hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}>
                  <MoreHorizontal size={16} />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-6 w-36 bg-background border border-border rounded-xl shadow-lg z-[100] overflow-hidden py-1">
                    {user?.username === comment.author.username ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-[14px] font-medium transition-colors"><Edit2 size={15} /> Chỉnh sửa</button>
                        <button onClick={handleDeleteComment} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-red-500 text-[14px] font-medium transition-colors"><Trash2 size={15} /> Xóa</button>
                      </>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); alert("Đang phát triển!"); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-[14px] font-medium transition-colors"><Flag size={15} /> Báo cáo</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {comment.replyingToUsername && (
            <div className="text-muted text-[14px] mt-[2px] mb-1">
              Đang trả lời <Link href={`/profile/${comment.replyingToUsername}`} className="text-[#0095F6] hover:underline" onClick={(e) => e.stopPropagation()}>@{comment.replyingToUsername}</Link>
            </div>
          )}
          
          <div className="mt-1 text-foreground/90 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {comment.content}
          </div>

          {renderImageCarousel(comment.mediaUrls)}

          {/* 🔥 GIAO DIỆN NÚT TƯƠNG TÁC MỚI */}
          <div className="flex items-center gap-6 mt-2 text-muted">
            <button onClick={handleLike} className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
              <motion.div whileTap={{ scale: 0.8 }}><Heart size={18} className={isLiked ? 'fill-current' : ''} /></motion.div>
              {likesCount > 0 && <span className="text-[13px]">{likesCount}</span>}
            </button>
            <button onClick={handleReplyClick} className="flex items-center gap-1.5 hover:text-foreground/80 group transition-colors">
              <MessageCircle size={18} />
              {repliesCount > 0 && <span className="text-[13px]">{repliesCount}</span>}
            </button>
            <button onClick={handleShare} className={`flex items-center gap-1.5 group transition-colors ${isShared ? 'text-green-500' : 'hover:text-green-500'}`}>
              <motion.div whileTap={{ scale: 0.8 }}><Repeat2 size={18} className={isShared ? 'stroke-current' : ''} /></motion.div>
              {sharesCount > 0 && <span className="text-[13px]">{sharesCount}</span>}
            </button>
            <button className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <Send size={18} />
            </button>
          </div>
          
          {replies && replies.length > 0 && (
            <div className="mt-2">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowReplies(!showReplies); }} className="flex items-center gap-3 text-[14px] font-semibold text-muted hover:text-foreground transition-colors">
                <div className="w-8 h-[1px] bg-border"></div>
                {showReplies ? 'Ẩn câu trả lời' : `Xem ${replies.length} câu trả lời`}
              </button>
            </div>
          )}

          {showReplies && replies && replies.length > 0 && (
            <div className="mt-4 border-l-2 border-border/50 ml-2 pl-2">
              {replies.map(reply => (
                <div key={reply.id} className="pt-2"><CommentCard comment={reply} postId={postId} /></div>
              ))}
            </div>
          )}
        </div>
      </div>
        
      <PostComposer isOpen={isReplying} onClose={() => setIsReplying(false)} replyToId={comment.id} onSuccess={() => { setRepliesCount(prev => prev + 1); setShowReplies(true); queryClient.invalidateQueries({ queryKey: ['comments', postId] }); }} />
      <EditCommentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} comment={comment} postId={postId} />
      
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={comment.mediaUrls || []}
        initialIndex={viewerIndex}
      />
    </>
  );
}