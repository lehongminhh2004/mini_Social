'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui/Avatar';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Comment } from '@/app/lib/types';
import { useAuth } from '@/app/lib/auth-context';

interface EditCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: Comment;
  postId: string; // Truyền postId để refresh đúng bài
}

export function EditCommentModal({ isOpen, onClose, comment, postId }: EditCommentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewNewUrl, setPreviewNewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(comment.content || '');
      setExistingUrl(comment.mediaUrl || null);
      setNewFile(null);
      setPreviewNewUrl(null);
    }
  }, [isOpen, comment]);

  const handleRemoveImage = () => {
    setExistingUrl(null);
    setNewFile(null);
    setPreviewNewUrl(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewNewUrl(URL.createObjectURL(file));
      setExistingUrl(null); // Ghi đè ảnh cũ
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !existingUrl && !newFile) return;
    setIsSubmitting(true);
    try {
      let finalMediaUrl = existingUrl || '';

      if (newFile) {
        const uploadData = new FormData();
        uploadData.append('file', newFile);
        const uploadRes = await api.post('/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalMediaUrl = uploadRes.data;
      }

      await api.put(`/comments/${comment.id}`, { 
        content: content.trim(),
        mediaUrl: finalMediaUrl 
      });
      
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      onClose();
    } catch (error) {
      alert('Cập nhật thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayUrl = previewNewUrl || existingUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { e.stopPropagation(); onClose(); }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="fixed bottom-0 left-0 right-0 md:inset-0 md:m-auto md:max-w-[600px] md:h-fit bg-card md:rounded-2xl rounded-t-2xl z-50 border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <button onClick={onClose} className="text-foreground hover:bg-secondary p-2 rounded-full transition-colors">Cancel</button>
              <h2 className="font-semibold text-foreground">Edit Reply</h2>
              <div className="w-16" />
            </div>

            <div className="p-4 flex gap-3 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center">
                <Avatar src={user?.avatarUrl} alt={user?.fullName ?? 'User'} size="md" />
                <div className="w-[2px] bg-border flex-grow my-2 min-h-[40px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{user?.fullName ?? 'User'}</div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Reply..." className="w-full bg-transparent text-foreground placeholder-muted resize-none focus:outline-none min-h-[40px] mt-1 text-[15px]" rows={displayUrl ? 2 : 4} autoFocus />
                
                {displayUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-border w-[200px] sm:w-[240px] h-[250px] sm:h-[280px]">
                    <img src={displayUrl} alt="Preview" className="w-full h-full object-cover pointer-events-none" />
                    <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors backdrop-blur-sm z-10"><X size={16} /></button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-3">
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="text-muted hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-secondary"><ImageIcon size={20} /></button>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-end border-t border-border shrink-0">
              <button onClick={handleSubmit} disabled={(!content.trim() && !displayUrl) || isSubmitting} className="bg-primary text-background px-5 py-1.5 rounded-full font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving</> : 'Save'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}