'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { ChatMessage } from '@/app/lib/types';
import { useAuth } from '@/app/lib/auth-context';
import { useChat } from '@/app/lib/use-chat';
import Sidebar from '@/app/components/Sidebar';
import { Avatar } from '@/app/components/ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  // conversationId ở đây chính là username của người kia
  const partnerUsername = params.conversationId as string;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Lấy lịch sử chat
  const { isLoading } = useQuery({
    queryKey: ['chat-history', partnerUsername],
    queryFn: async () => {
      const res = await api.get<ChatMessage[]>(`/chat/history/${partnerUsername}`);
      setMessages(res.data);
      return res.data;
    },
    enabled: !!partnerUsername,
  });

  // Kết nối WebSocket
  const { connected, sendMessage } = useChat({
    currentUsername: user?.username ?? '',
    onMessage: (msg) => {
      // Chỉ thêm tin nhắn nếu đúng conversation này
      if (
        msg.senderUsername === partnerUsername ||
        msg.receiverUsername === partnerUsername
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    },
  });

  // Auto scroll xuống cuối
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim() || !user) return;
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderUsername: user.username,
      receiverUsername: partnerUsername,
      content: draft,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    sendMessage(partnerUsername, draft);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Chat với @{partnerUsername}
            </h1>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {connected ? '● Online' : '○ Connecting...'}
            </span>
          </div>

          {/* Message list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoading && (
                <p className="text-center text-gray-400 text-sm">Đang tải tin nhắn...</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    msg.senderUsername === user?.username
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.senderUsername === user?.username
                        ? 'text-blue-200'
                        : 'text-gray-400'
                    }`}
                  >
                    {timeAgo(msg.timestamp)}
                  </p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || !connected}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
