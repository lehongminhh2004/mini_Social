'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui/Avatar';
import { Image as ImageIcon } from 'lucide-react';
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

  const handleSubmit = async () => {
    if (!content.trim() || content.length > maxLength) return;

    setIsSubmitting(true);
    try {
      if (replyToId) {
        // Comment vào bài viết
        await api.post(`/comments/post/${replyToId}`, { content });
      } else {
        // Tạo bài viết mới
        await api.post('/posts', { content });
      }
      setContent('');
      onClose();
      // Invalidate feed để load lại danh sách mới nhất
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to post:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            className="fixed bottom-0 left-0 right-0 md:inset-0 md:m-auto md:max-w-[600px] md:h-fit bg-card md:rounded-2xl rounded-t-2xl z-50 border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
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

            <div className="p-4 flex gap-3">
              <div className="flex flex-col items-center">
                <Avatar
                  src={user?.avatarUrl}
                  alt={user?.fullName ?? 'User'}
                  size="md"
                />
                <div className="w-[2px] bg-border flex-grow my-2" />
              </div>

              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  {user?.fullName ?? 'User'}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={replyToId ? 'Reply to thread...' : 'Start a thread...'}
                  className="w-full bg-transparent text-foreground placeholder-muted resize-none focus:outline-none min-h-[100px] mt-1 text-[15px]"
                  autoFocus
                />

                <div className="flex items-center gap-2 mt-2">
                  <button className="text-muted hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-secondary">
                    <ImageIcon size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between border-t border-border">
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
                  disabled={!content.trim() || content.length > maxLength || isSubmitting}
                  className="bg-primary text-background px-4 py-1.5 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
