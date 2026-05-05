'use client';

import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query'; 
import { Image as ImageIcon, X, Loader2 } from 'lucide-react'; // 🔥 Import icon
import { ImageViewerModal } from './ImageViewerModal'; // 🔥 Import Trình xem ảnh
import { ChatMessage } from '@/app/lib/types';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string; 
}

const formatTime = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // 🔥 States hỗ trợ gửi ảnh
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 States cho Trình xem ảnh
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<string>('');

  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); 
  const queryClient = useQueryClient(); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, imagePreview]); // Cuộn xuống khi có ảnh preview

  useEffect(() => {
    if (!currentUserId || !conversationId) return;
    api.get(`/chat/history/${conversationId}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Lỗi lấy lịch sử chat:", err));

    const markMessagesAsRead = async () => {
      try {
        await api.put(`/chat/mark-read/${conversationId}`);
        queryClient.invalidateQueries({ queryKey: ['unread-msg-count'] }); 
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] }); 
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

  // 🔥 Hàm chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 🔥 Hàm gửi tin nhắn
  const handleSendMessage = async () => {
    if ((!draft.trim() && !imageFile) || !stompClientRef.current || isUploading) return;

    setIsUploading(true);
    let uploadedUrl = '';

    try {
      // 1. Upload ảnh trước (nếu có)
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrl = uploadRes.data;
      }

      // 2. Gửi STOMP Message
      const chatMessage = {
        id: Date.now().toString(),
        senderUsername: currentUserId,
        receiverUsername: conversationId,
        content: draft.trim(),
        imageUrl: uploadedUrl, // Kẹp ảnh vào đây
        timestamp: new Date().toISOString(), 
      };

      stompClientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify(chatMessage),
      });

      setMessages((prev) => [...prev, chatMessage]);
      setDraft(''); 
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      alert("Lỗi khi gửi tin nhắn!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-transparent h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col custom-scrollbar">
        {messages.map((message, index) => {
          const isMe = message.senderUsername === currentUserId;
          return (
            <div key={index} className="flex flex-col">
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-[15px] w-fit ${
                  isMe ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-secondary text-foreground'
                } ${message.imageUrl && !message.content ? 'bg-transparent p-0' : ''}`} // Xóa viền nếu chỉ có ảnh
              >
                {/* Render ảnh đính kèm */}
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="Chat attachment" 
                    className={`max-w-full max-h-[250px] rounded-xl object-cover cursor-pointer mb-1 border border-border/50`}
                    onClick={() => { setViewerImage(message.imageUrl!); setViewerOpen(true); }}
                  />
                )}
                
                {/* Render Text */}
                {message.content && (
                  message.content.includes('/thread/') ? (
                    <a href={message.content} target="_blank" className="underline break-all">
                      {message.content}
                    </a>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{message.content}</span>
                  )
                )}
              </div>
              
              <span className={`text-[11px] text-muted mt-1 ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Khu vực Nhập tin nhắn */}
      <div className="p-3 border-t border-border bg-background/95 backdrop-blur-md flex flex-col gap-2">
        
        {/* Preview ảnh nhỏ trước khi gửi */}
        {imagePreview && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X size={14} />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 size={16} className="text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors shrink-0 mb-0.5"
          >
            <ImageIcon size={22} />
          </button>
          
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
            }} 
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="flex-1 bg-secondary text-foreground border-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none max-h-24 overflow-y-auto"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={isUploading || (!draft.trim() && !imageFile)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center w-10 h-10 shrink-0 mb-0.5 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>}
          </button>
        </div>
      </div>

      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={[viewerImage]}
        initialIndex={0}
      />
    </div>
  );
}