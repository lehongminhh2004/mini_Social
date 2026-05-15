'use client';

import { useGlobalChat } from '@/app/lib/ChatContext';
import ChatWindow from '@/app/components/ChatWindow'; // File Real-time Chat siêu xịn của bạn
import { X, Minus } from 'lucide-react';
import { useAuth } from '@/app/lib/auth-context';

export function FloatingChat() {
  const { activeChatUser, setActiveChatUser } = useGlobalChat();
  const { user } = useAuth();

  // Nếu không ai được chọn để chat, hoặc chưa đăng nhập thì ẩn cái khung này đi
  if (!activeChatUser || !user) return null;

  return (
    <div className="fixed bottom-0 right-4 md:right-20 w-[350px] h-[450px] bg-background border border-border rounded-t-2xl shadow-[0_-5px_25px_rgba(0,0,0,0.15)] flex flex-col z-[100] overflow-hidden">
      
      {/* HEADER CỦA KHUNG CHAT MINI */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          {/* Chấm xanh lá báo Online ảo diệu */}
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="font-bold text-foreground">@{activeChatUser}</span>
        </div>
        
        <div className="flex gap-3 text-muted">
          <button className="hover:text-foreground transition-colors">
            <Minus size={20} />
          </button>
          {/* Nút X để tắt chat */}
          <button onClick={() => setActiveChatUser(null)} className="hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* BODY CỦA KHUNG CHAT (Nhúng cái ChatWindow cũ vào đây) */}
      <div className="flex-1 bg-background overflow-hidden relative">
        {/* MẸO: Truyền props vào ChatWindow để nó chạy logic kết nối WebSocket */}
        <div className="absolute inset-0">
           <ChatWindow conversationId={activeChatUser} currentUserId={user.username} />
        </div>
      </div>
    </div>
  );
}