'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui/Avatar';
import { Image as ImageIcon, X } from 'lucide-react';
import { api } from '@/app/lib/api';
import { useAuth } from '@/app/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';

interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  replyToId?: string;
  onSuccess?: () => void;
}

export function PostComposer({ isOpen, onClose, replyToId, onSuccess }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const maxLength = 280;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 🔥 CÁC REF DÙNG CHO TÍNH NĂNG KÉO THẢ CHUỘT (DRAG TO SCROLL)
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...selectedFiles, ...newFiles].slice(0, 4);
      setSelectedFiles(totalFiles);
      setPreviewUrls(totalFiles.map(file => URL.createObjectURL(file)));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if ((!content.trim() && selectedFiles.length === 0) || content.length > maxLength) return;

    setIsSubmitting(true);
    try {
      let finalMediaUrls: string[] = [];

      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const uploadData = new FormData();
          uploadData.append('file', file);
          const uploadRes = await api.post('/upload/image', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return uploadRes.data;
        });
        
        finalMediaUrls = await Promise.all(uploadPromises);
      }

      if (replyToId) {
        const endpoint = replyToId.length > 36 ? `/comments/reply/${replyToId}` : `/comments/post/${replyToId}`; 
        
        await api.post(`/comments/post/${replyToId}`, { 
          content: content.trim(),
          mediaUrls: finalMediaUrls 
        });
      } else {
        await api.post('/posts', { 
          content: content.trim(),
          mediaUrls: finalMediaUrls 
        });
      }
      
      setContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      onClose();
      
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: ['user-threads', user.username] });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Đăng bài thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 CÁC HÀM XỬ LÝ KÉO CHUỘT
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    if (!sliderRef.current) return;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };

  const onMouseLeaveOrUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Tốc độ cuộn (nhân 1.5 để mượt hơn)
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 md:inset-0 md:m-auto md:max-w-[600px] md:h-fit bg-card md:rounded-2xl rounded-t-2xl z-50 border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <button
                onClick={onClose}
                className="text-foreground hover:bg-secondary p-2 rounded-full transition-colors"
              >
                Cancel
              </button>
              <h2 className="font-semibold text-foreground">
                {replyToId ? 'Reply' : 'New Thread'}
              </h2>
              <div className="w-16" />
            </div>

            <div className="p-4 flex gap-3 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center">
                <Avatar
                  src={user?.avatarUrl}
                  alt={user?.fullName ?? 'User'}
                  size="md"
                />
                <div className="w-[2px] bg-border flex-grow my-2 min-h-[40px]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">
                  {user?.fullName ?? 'User'}
                </div>
                
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={replyToId ? 'Reply to thread...' : 'Start a thread...'}
                  className="w-full bg-transparent text-foreground placeholder-muted resize-none focus:outline-none min-h-[40px] mt-1 text-[15px]"
                  rows={previewUrls.length > 0 ? 2 : 4} 
                  autoFocus
                />

                {/* 🔥 KHU VỰC ẢNH CUỘN NGANG (DRAG TO SCROLL) */}
                {previewUrls.length > 0 && (
                  <div 
                    ref={sliderRef}
                    onMouseDown={onMouseDown}
                    onMouseLeave={onMouseLeaveOrUp}
                    onMouseUp={onMouseLeaveOrUp}
                    onMouseMove={onMouseMove}
                    className="mt-2 flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar cursor-grab active:cursor-grabbing"
                    style={{ WebkitOverflowScrolling: 'touch' }} // Hỗ trợ cuộn mượt trên điện thoại
                  >
                    {previewUrls.map((url, idx) => (
                      <div 
                        key={idx} 
                        className={`relative flex-shrink-0 rounded-xl overflow-hidden border border-border snap-center ${
                          previewUrls.length === 1 ? 'w-full h-[250px] sm:h-[300px]' : 'w-[200px] sm:w-[240px] h-[250px] sm:h-[280px]'
                        }`}
                      >
                        <img 
                          src={url} 
                          alt={`Preview ${idx}`} 
                          // pointer-events-none cực kỳ quan trọng để trình duyệt không hiểu lầm hành động "kéo chuột" thành "kéo ảnh tải về"
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors backdrop-blur-sm z-10"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    multiple 
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 4} 
                    className="text-muted hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-secondary disabled:opacity-50"
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between border-t border-border shrink-0">
              <div className="text-muted text-sm">Anyone can reply</div>
              <div className="flex items-center gap-4">
                <div
                  className={`text-sm ${
                    content.length > maxLength ? 'text-red-500' : 'text-muted'
                  }`}
                >
                  {content.length}/{maxLength}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={(!content.trim() && selectedFiles.length === 0) || content.length > maxLength || isSubmitting}
                  className="bg-primary text-background px-5 py-1.5 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}