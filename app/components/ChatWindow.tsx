'use client';

import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query'; 

export interface ChatMessage {
  senderUsername: string;
  receiverUsername: string;
  content: string;
  timestamp?: string; 
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string; 
}

// 🔥 HÀM ĐỊNH DẠNG GIỜ (Ví dụ: 22:55)
const formatTime = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); 
  const queryClient = useQueryClient(); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUserId || !conversationId) return;
    api.get(`/chat/history/${conversationId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Lỗi lấy lịch sử chat:", err));

    const markMessagesAsRead = async () => {
      try {
        await api.put(`/chat/mark-read/${conversationId}`);
        queryClient.invalidateQueries({ queryKey: ['unread-msg-count'] }); 
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }); // Reset cả list hội thoại
      } catch (error) {
        console.error("Lỗi xóa chấm đỏ tin nhắn:", error);
      }
    };
    markMessagesAsRead();
  }, [conversationId, currentUserId, queryClient]);

  useEffect(() => {
    if (!currentUserId) return;
    const socket = new SockJS('http://localhost:8080/ws'); 
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
          const newMsg: ChatMessage = JSON.parse(message.body);
          if (newMsg.senderUsername === conversationId) {
            setMessages((prev) => [...prev, newMsg]);
            api.put(`/chat/mark-read/${conversationId}`).then(() => {
                queryClient.invalidateQueries({ queryKey: ['unread-msg-count'] });
                queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            });
          }
        });
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [currentUserId, conversationId, queryClient]);

  const handleSendMessage = () => {
    if (!draft.trim() || !stompClientRef.current) return;

    const chatMessage = {
      senderUsername: currentUserId,
      receiverUsername: conversationId,
      content: draft,
      timestamp: new Date().toISOString(), // 🔥 Gắn giờ hiện tại để tin vừa gửi hiện giờ luôn
    };

    stompClientRef.current.publish({
      destination: '/app/chat',
      body: JSON.stringify(chatMessage),
    });

    setMessages((prev) => [...prev, chatMessage]);
    setDraft(''); 
  };

  return (
    <div className="bg-transparent h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col custom-scrollbar">
        {messages.map((message, index) => {
          const isMe = message.senderUsername === currentUserId;
          return (
            <div key={index} className="flex flex-col">
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-[15px] w-fit ${
                  isMe ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-secondary text-foreground'
                }`}
              >
                {message.content.includes('/thread/') ? (
                  <a href={message.content} target="_blank" className="underline">
                    {message.content}
                  </a>
                ) : (
                  message.content
                )}
              </div>
              
              {/* 🔥 HIỂN THỊ GIỜ Ở DƯỚI BONG BÓNG */}
              <span className={`text-[11px] text-muted mt-1 ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-secondary text-foreground border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center w-9 h-9"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </div>
    </div>
  );
}