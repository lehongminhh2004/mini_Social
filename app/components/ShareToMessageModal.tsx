'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Post, User } from '@/app/lib/types';
import { Avatar } from './ui/Avatar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { useAuth } from '@/app/lib/auth-context';

interface ShareToMessageModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareToMessageModal({ post, isOpen, onClose }: ShareToMessageModalProps) {
  const { user: currentUser } = useAuth();
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Lấy danh sách user để share (Bạn có thể đổi API thành lấy bạn bè/follower tuỳ logic hệ thống của bạn)
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-list-to-share'],
    queryFn: async () => {
      const res = await api.get<User[]>('/users'); 
      return res.data.filter(u => u.username !== currentUser?.username); // Lọc bỏ chính mình
    },
    enabled: isOpen,
  });

  const handleSend = async (receiverUsername: string) => {
    setSendingTo(receiverUsername);
    // Nội dung gửi là 1 đường link dẫn thẳng tới bài viết
    const currentDomain = window.location.origin; 
    const shareContent = `${currentDomain}/thread/${post.id}`;

    try {
      await api.post('/chat/send', {
        senderUsername: currentUser?.username,
        receiverUsername: receiverUsername,
        content: shareContent,
      });
      alert('Đã gửi qua tin nhắn thành công!');
      onClose();
    } catch (error) {
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại!');
    } finally {
      setSendingTo(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background w-full max-w-[400px] rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Chia sẻ qua tin nhắn</h2>
            <button onClick={onClose} className="p-2 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* List Users */}
          <div className="p-4 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="text-center text-muted py-4">Đang tải danh sách...</div>
            ) : users && users.length > 0 ? (
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatarUrl} alt={u.username} size="md" />
                      <div>
                        <p className="font-semibold text-foreground text-[15px]">{u.fullName || u.username}</p>
                        <p className="text-muted text-[13px]">@{u.username}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleSend(u.username)}
                      disabled={sendingTo === u.username}
                      className="bg-foreground text-background px-4 py-1.5 rounded-lg font-semibold text-[14px] flex items-center gap-2 hover:bg-foreground/80 disabled:opacity-50 transition-colors"
                    >
                      {sendingTo === u.username ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted py-4">Không có người dùng nào.</div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}