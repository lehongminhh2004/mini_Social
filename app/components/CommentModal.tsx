'use client';

import { useState } from 'react';
import { api } from '@/app/lib/api';
import { Post } from '@/app/lib/types';
import { Avatar } from './ui/Avatar';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface CommentModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Thêm prop này để nhận lệnh nhảy số từ PostCard
}

export function CommentModal({ post, isOpen, onClose, onSuccess }: CommentModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Bắn API và LẤY LUÔN dữ liệu bình luận vừa tạo từ Backend trả về
      const response = await api.post(`/comments/post/${post.id}`, { content });
      const newComment = response.data; // Đây là cái CommentResponseDTO có tên, avatar

      // 2. NHÉT TRỰC TIẾP VÀO BỘ NHỚ TRÌNH DUYỆT (Trang chi tiết bài viết sẽ thấy ngay lập tức)
      // Giả sử API get danh sách comment của bạn có key là ['comments', post.id]
      queryClient.setQueryData(['comments', post.id], (oldComments: any) => {
        if (!oldComments) return [newComment];
        // Nhét comment mới lên ĐẦU danh sách
        return [newComment, ...oldComments];
      });

      // 3. Kích hoạt lệnh làm cho chữ "replies" ở PostCard nhảy lên +1
      if (onSuccess) onSuccess();

      // 4. Vẫn gọi invalidate để nó ngầm đồng bộ với DB cho chắc cú, nhưng UI đã được update từ bước 2, 3 rồi!
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
      
      setContent('');
      onClose();
    } catch (error) {
      console.error("Lỗi đăng bình luận:", error);
      alert("Không thể gửi bình luận lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background w-full max-w-[600px] rounded-3xl border border-border overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
          <h2 className="font-bold text-lg">Phản hồi</h2>
          <div className="w-8" />
        </div>

        <div className="p-4">
          <div className="flex gap-3 opacity-60">
            <div className="flex flex-col items-center">
              <Avatar src={post.authorAvatarUrl} alt="avatar" size="md" />
              <div className="w-[2px] bg-border flex-grow my-2" />
            </div>
            <div className="flex-1 pb-4">
              <p className="font-bold">{post.authorName}</p>
              <p className="text-[15px]">{post.content}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <Avatar src={undefined} alt="Your Avatar" size="md" />
            <div className="flex-1">
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Trả lời ${post.authorUsername}...`}
                className="w-full bg-transparent border-none focus:ring-0 text-[16px] resize-none min-h-[120px] placeholder:text-muted focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              content.trim() ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-foreground/20 text-background/50 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Đang gửi...' : 'Đăng'}
          </button>
        </div>
      </div>
    </div>
  );
}