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
import { EditCommentModal } from './EditCommentModal'; // 🔥 Đã tích hợp Modal Sửa

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
  
  // 🔥 States cho Menu Sửa/Xóa
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [isLiked, setIsLiked] = useState(comment.isLiked || false); 
  const [likesCount, setLikesCount] = useState(comment.totalReactions || 0);
  const [isShared, setIsShared] = useState(comment.isShared || false); 
  const [sharesCount, setSharesCount] = useState(comment.totalShares || 0);
  const [repliesCount, setRepliesCount] = useState(comment.totalReplies || 0);

  // Đảm bảo cập nhật khi load lại API
  useEffect(() => {
    setIsLiked(comment.isLiked || false);
    setIsShared(comment.isShared || false);
    setLikesCount(comment.totalReactions || 0);  
    setSharesCount(comment.totalShares || 0);    
    setRepliesCount(comment.totalReplies || 0);  
  }, [comment]); 

  // Đóng menu 3 chấm khi click ra ngoài
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
    if (!user) { alert("Bạn cần đăng nhập để thả tim!"); router.push('/auth/login'); return; }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked); setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      await api.post(`/reactions/comment/${comment.id}?type=LIKE`);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch {
      setIsLiked(!newIsLiked); setLikesCount((prev) => (!newIsLiked ? prev + 1 : prev - 1));
    }
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Bạn cần đăng nhập để đăng lại!"); router.push('/auth/login'); return; }

    const newIsShared = !isShared;
    setIsShared(newIsShared); setSharesCount((prev) => (newIsShared ? prev + 1 : prev - 1));

    try {
      await api.post(`/shares/comment/${comment.id}`);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch {
      setIsShared(!newIsShared); setSharesCount((prev) => (!newIsShared ? prev + 1 : prev - 1));
    }
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { alert("Bạn cần đăng nhập để trả lời!"); router.push('/auth/login'); return; }
    setIsReplying(true);
  };

  const handleDeleteComment = async (e: React.MouseEvent) => {
    e.stopPropagation(); setIsMenuOpen(false);
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này? Hành động không thể hoàn tác.')) return;
    try {
      await api.delete(`/comments/${comment.id}`);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) { 
      alert("Xóa thất bại!"); 
    }
  };

  return (
    <>
      <div className="flex gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-border/50">
        <div className="flex flex-col items-center">
          <Avatar src={comment.author.avatarUrl} alt={comment.author.username} size="sm" />
          {/* Vẽ cái đường line xám dài xuống nếu nó có comment con */}
          {showReplies && replies && replies.length > 0 && (
             <div className="w-[2px] bg-border/50 flex-grow my-2 min-h-[30px]" />
          )}
        </div>

        <div className="flex-1 pb-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <Link href={`/profile/${comment.author.username}`} className="font-semibold text-[15px] text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
                {comment.author.fullName || comment.author.username}
              </Link>
            </div>
            
            {/* 🔥 KHU VỰC MENU 3 CHẤM CỦA BÌNH LUẬN */}
            <div className="flex items-center gap-2 text-muted text-[13px]">
              <span>{timeAgo(comment.createdAt)}</span>
              <div className="relative" ref={menuRef}>
                <button 
                  className="p-1 rounded-full hover:bg-secondary/80 text-muted hover:text-foreground transition-colors" 
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 top-6 w-36 bg-background border border-border rounded-xl shadow-lg z-[100] overflow-hidden py-1">
                    {user?.username === comment.author.username ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-[14px] font-medium transition-colors">
                          <Edit2 size={15} /> Chỉnh sửa
                        </button>
                        <button onClick={handleDeleteComment} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-red-500 text-[14px] font-medium transition-colors">
                          <Trash2 size={15} /> Xóa
                        </button>
                      </>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); alert("Chức năng đang phát triển!"); }} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary text-[14px] font-medium transition-colors">
                        <Flag size={15} /> Báo cáo
                      </button>
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

          {/* 🔥 HIỂN THỊ ẢNH CỦA BÌNH LUẬN (NẾU CÓ) */}
          {comment.mediaUrl && (
             <div className="mt-3 relative rounded-xl overflow-hidden border border-border inline-block max-w-[80%]">
                <img 
                   src={comment.mediaUrl} 
                   alt="Comment media" 
                   className="w-full h-auto max-h-[350px] object-cover rounded-xl"
                />
             </div>
          )}

          <div className="flex items-center gap-4 mt-2 text-muted">
            <button onClick={handleLike} className={`flex items-center gap-1.5 group transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
              <motion.div whileTap={{ scale: 0.8 }}><Heart size={18} className={isLiked ? 'fill-current' : ''} /></motion.div>
            </button>

            <button onClick={handleReplyClick} className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <MessageCircle size={18} />
            </button>

            <button onClick={handleShare} className={`flex items-center gap-1.5 group transition-colors ${isShared ? 'text-green-500' : 'hover:text-green-500'}`}>
              <motion.div whileTap={{ scale: 0.8 }}><Repeat2 size={18} className={isShared ? 'stroke-current' : ''} /></motion.div>
            </button>

            <button className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <Send size={18} />
            </button>
          </div>

          {(likesCount > 0 || repliesCount > 0 || sharesCount > 0) && (
            <div className="flex items-center gap-2 mt-2 text-muted text-[13px]">
              {repliesCount > 0 && <span>{repliesCount} replies</span>}
              {repliesCount > 0 && (likesCount > 0 || sharesCount > 0) && <span>·</span>}
              {likesCount > 0 && <span>{likesCount} likes</span>}
              {likesCount > 0 && sharesCount > 0 && <span>·</span>}
              {sharesCount > 0 && <span>{sharesCount} reposts</span>}
            </div>
          )}
          
          {replies && replies.length > 0 && (
            <div className="mt-2">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowReplies(!showReplies); }}
                className="flex items-center gap-3 text-[14px] font-semibold text-muted hover:text-foreground transition-colors"
              >
                <div className="w-8 h-[1px] bg-border"></div>
                {showReplies ? 'Ẩn câu trả lời' : `Xem ${replies.length} câu trả lời`}
              </button>
            </div>
          )}

          {showReplies && replies && replies.length > 0 && (
            <div className="mt-4 border-l-2 border-border/50 ml-2 pl-2">
              {replies.map(reply => (
                <div key={reply.id} className="pt-2">
                   <CommentCard comment={reply} postId={postId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        
      {/* 🔥 SỬ DỤNG POST COMPOSER ĐA NĂNG CHO BÌNH LUẬN CON */}
      <PostComposer 
        isOpen={isReplying} 
        onClose={() => setIsReplying(false)}
        replyToId={comment.id} // Gửi ID của comment gốc để Backend biết đây là reply
        onSuccess={() => {
          setRepliesCount(prev => prev + 1);
          setShowReplies(true); 
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }} 
      />

      {/* 🔥 MODAL CHỈNH SỬA BÌNH LUẬN */}
      <EditCommentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        comment={comment} 
        postId={postId} 
      />
    </>
  );
}