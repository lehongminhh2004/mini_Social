'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui/Avatar';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Post } from '@/app/lib/types';
import { useAuth } from '@/app/lib/auth-context';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 280;

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewNewUrls, setPreviewNewUrls] = useState<string[]>([]);

  // CÁC REF DÙNG CHO TÍNH NĂNG KÉO THẢ (DRAG TO SCROLL)
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setContent(post.content || '');
      setExistingUrls(post.mediaUrls || []);
      setNewFiles([]);
      setPreviewNewUrls([]);
    }
  }, [isOpen, post]);

  const handleRemoveExistingImage = (index: number) => {
    setExistingUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== index));
    setPreviewNewUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const addedFiles = Array.from(e.target.files);
      const totalCount = existingUrls.length + newFiles.length + addedFiles.length;
      
      if (totalCount > 4) {
        alert("Chỉ được tải lên tối đa 4 ảnh!");
        return;
      }
      
      setNewFiles(prev => [...prev, ...addedFiles]);
      setPreviewNewUrls(prev => [...prev, ...addedFiles.map(f => URL.createObjectURL(f))]);
    }
  };

  const handleSubmit = async () => {
    if ((!content.trim() && existingUrls.length === 0 && newFiles.length === 0) || content.length > maxLength) return;

    setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];

      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (file) => {
          const uploadData = new FormData();
          uploadData.append('file', file);
          const uploadRes = await api.post('/upload/image', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return uploadRes.data;
        });
        uploadedUrls = await Promise.all(uploadPromises);
      }

      const finalMediaUrls = [...existingUrls, ...uploadedUrls];

      await api.put(`/posts/${post.id}`, { 
        content: content.trim(),
        mediaUrls: finalMediaUrls 
      });
      
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['thread', post.id] }); 
      if (post.authorUsername) {
        queryClient.invalidateQueries({ queryKey: ['user-threads', post.authorUsername] });
      }

      onClose();
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Cập nhật thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CÁC HÀM XỬ LÝ KÉO CHUỘT
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
    const walk = (x - startX.current) * 1.5; 
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const totalImages = existingUrls.length + newFiles.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 🔥 THÊM CHẶN SỰ KIỆN Ở LỚP NỀN */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* 🔥 THÊM CHẶN SỰ KIỆN KHÔNG CHO XUYÊN XUỐNG POST CARD BÊN TRONG MODAL */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()} 
            onMouseDown={(e) => e.stopPropagation()} 
            className="fixed bottom-0 left-0 right-0 md:inset-0 md:m-auto md:max-w-[600px] md:h-fit bg-card md:rounded-2xl rounded-t-2xl z-50 border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <button onClick={onClose} className="text-foreground hover:bg-secondary p-2 rounded-full transition-colors">Cancel</button>
              <h2 className="font-semibold text-foreground">Edit Thread</h2>
              <div className="w-16" />
            </div>

            <div className="p-4 flex gap-3 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center">
                <Avatar src={user?.avatarUrl} alt={user?.fullName ?? 'User'} size="md" />
                <div className="w-[2px] bg-border flex-grow my-2 min-h-[40px]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{user?.fullName ?? 'User'}</div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start a thread..."
                  className="w-full bg-transparent text-foreground placeholder-muted resize-none focus:outline-none min-h-[40px] mt-1 text-[15px]"
                  rows={totalImages > 0 ? 2 : 4} 
                  autoFocus
                />

                {totalImages > 0 && (
                  <div 
                    ref={sliderRef}
                    onMouseDown={onMouseDown}
                    onMouseLeave={onMouseLeaveOrUp}
                    onMouseUp={onMouseLeaveOrUp}
                    onMouseMove={onMouseMove}
                    className="mt-2 flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar cursor-grab active:cursor-grabbing"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {existingUrls.map((url, idx) => (
                      <div key={`old-${idx}`} className={`relative flex-shrink-0 rounded-xl overflow-hidden border border-border snap-center ${totalImages === 1 ? 'w-full h-[250px] sm:h-[300px]' : 'w-[200px] sm:w-[240px] h-[250px] sm:h-[280px]'}`}>
                        <img src={url} alt="Old Preview" className="w-full h-full object-cover pointer-events-none" />
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(idx); }} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors backdrop-blur-sm z-10"><X size={16} /></button>
                      </div>
                    ))}
                    {previewNewUrls.map((url, idx) => (
                      <div key={`new-${idx}`} className={`relative flex-shrink-0 rounded-xl overflow-hidden border border-border snap-center ${totalImages === 1 ? 'w-full h-[250px] sm:h-[300px]' : 'w-[200px] sm:w-[240px] h-[250px] sm:h-[280px]'}`}>
                        <img src={url} alt="New Preview" className="w-full h-full object-cover pointer-events-none" />
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveNewImage(idx); }} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors backdrop-blur-sm z-10"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" multiple className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalImages >= 4} 
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
                <div className={`text-sm ${content.length > maxLength ? 'text-red-500' : 'text-muted'}`}>{content.length}/{maxLength}</div>
                <button
                  onClick={handleSubmit}
                  disabled={(!content.trim() && totalImages === 0) || content.length > maxLength || isSubmitting}
                  className="bg-primary text-background px-5 py-1.5 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving</> : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}