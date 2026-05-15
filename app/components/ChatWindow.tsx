'use client';

import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query'; 
import { Image as ImageIcon, X, Loader2, Heart, Reply, MoreVertical, Trash2, EyeOff } from 'lucide-react';
import { ImageViewerModal } from './ImageViewerModal';

export interface ChatMessage {
  id: string;
  senderUsername: string;
  receiverUsername: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  isDeletedForEveryone?: boolean;
  deletedByUser?: string;
  reaction?: string;
  replyToContent?: string;
}

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
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<string>('');

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); 
  const queryClient = useQueryClient(); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, imagePreview, replyTo]);

  // Lấy lịch sử chat
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
      } catch (error) {}
    };
    markMessagesAsRead();
  }, [conversationId, currentUserId, queryClient]);

  // Kết nối WebSocket để NHẬN tin nhắn từ người khác (Đã fix lỗi trùng tin nhắn khi thu hồi)
  useEffect(() => {
    if (!currentUserId) return;
    const socket = new SockJS('http://localhost:8080/ws'); 
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
          const newMsg: ChatMessage = JSON.parse(message.body);
          
          if (newMsg.senderUsername === conversationId || newMsg.receiverUsername === conversationId) {
            setMessages((prev) => {
              // Kiểm tra xem tin nhắn này đã có trong danh sách hiển thị chưa (dựa vào ID)
              const existingMsgIndex = prev.findIndex(m => m.id === newMsg.id);
              
              if (existingMsgIndex !== -1) {
                // ĐÃ TỒN TẠI: Dùng để cập nhật trạng thái (Thu hồi, thả tim...)
                const updatedMessages = [...prev];
                updatedMessages[existingMsgIndex] = newMsg;
                return updatedMessages;
              } else {
                // CHƯA TỒN TẠI: Thêm tin nhắn mới vào cuối
                return [...prev, newMsg];
              }
            });
            api.put(`/chat/mark-read/${conversationId}`);
          }
        });
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [currentUserId, conversationId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async () => {
    if ((!draft.trim() && !imageFile) || isUploading) return;
    setIsUploading(true);
    let uploadedUrl = '';

    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrl = uploadRes.data;
      }

      const chatMessage = {
        senderUsername: currentUserId,
        receiverUsername: conversationId,
        content: draft.trim(),
        imageUrl: uploadedUrl,
        replyToContent: replyTo || undefined,
      };

      const res = await api.post('/chat/send', chatMessage);

      // Gửi thành công thì mới add vào giao diện của mình
      setMessages((prev) => [...prev, res.data]);
      setDraft(''); 
      setImageFile(null);
      setImagePreview(null);
      setReplyTo(null); 
    } catch (error) {
      alert("Lỗi khi gửi tin nhắn!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReact = async (msgId: string, currentReaction?: string) => {
    const isRemoving = currentReaction === '❤️';
    const newReaction = isRemoving ? '' : '❤️'; 
    
    try {
      await api.put(`/chat/action/${msgId}?action=REACT&value=${newReaction}`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: isRemoving ? undefined : '❤️' } : m));
    } catch (error) {
      console.error("Lỗi khi thả tim", error);
    }
  };

  const handleRevokeEveryone = async (msgId: string) => {
    try {
      await api.put(`/chat/action/${msgId}?action=REVOKE_EVERYONE`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeletedForEveryone: true } : m));
      setActiveMenuId(null);
    } catch (error) {
      alert("Lỗi: Không thể thu hồi tin nhắn này.");
    }
  };

  const handleRevokeMe = async (msgId: string) => {
    try {
      await api.put(`/chat/action/${msgId}?action=REVOKE_ME`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deletedByUser: currentUserId } : m));
      setActiveMenuId(null);
    } catch (error) {
      alert("Lỗi: Không thể xóa tin nhắn này.");
    }
  };

  return (
    <div className="bg-transparent h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col custom-scrollbar pb-10" onClick={() => setActiveMenuId(null)}>
        {messages.filter(m => m.deletedByUser !== currentUserId).map((message, index) => {
          const isMe = message.senderUsername === currentUserId;
          const isDeleted = message.isDeletedForEveryone;
          const isMenuOpen = activeMenuId === message.id;

          return (
            <div key={message.id || index} className={`group flex flex-col w-full relative ${isMe ? 'items-end' : 'items-start'} ${isMenuOpen ? 'z-50' : 'z-0'}`}>
              
              {message.replyToContent && !isDeleted && (
                <div className={`text-[12px] bg-secondary/50 px-3 py-1 rounded-t-xl mb-[-10px] z-0 opacity-70 flex items-center gap-1 max-w-[75%] ${isMe ? 'mr-2' : 'ml-2'}`}>
                  <Reply size={12}/> {message.replyToContent.length > 25 ? message.replyToContent.substring(0,25) + '...' : message.replyToContent}
                </div>
              )}

              <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} z-10 w-full`}>
                
                <div className={`relative max-w-[70%] rounded-2xl px-4 py-2 text-[15px] ${isDeleted ? 'bg-background border border-border text-muted italic' : (isMe ? 'bg-blue-600 text-white' : 'bg-secondary text-foreground')} ${message.imageUrl && !message.content && !isDeleted ? 'bg-transparent p-0' : ''}`}>
                  
                  {isDeleted ? (
                    "Tin nhắn đã bị thu hồi"
                  ) : (
                    <>
                      {message.imageUrl && (
                        <img 
                          src={message.imageUrl} alt="attachment" 
                          className="max-w-full max-h-[250px] rounded-xl object-cover cursor-pointer mb-1 border border-border/50"
                          onClick={() => { setViewerImage(message.imageUrl!); setViewerOpen(true); }}
                        />
                      )}
                      
                      {message.content && (
                          <span className="whitespace-pre-wrap break-words">{message.content}</span>
                      )}

                      {message.reaction && (
                          <div className="absolute -bottom-2 -right-2 bg-background border border-border rounded-full p-1 text-[10px] shadow-md z-10 flex items-center justify-center">
                            {message.reaction}
                          </div>
                      )}
                    </>
                  )}
                </div>

                {!isDeleted && (
                  <div className={`items-center gap-0.5 transition-opacity ${isMe ? 'mr-1' : 'ml-1'} ${isMenuOpen ? 'flex opacity-100' : 'hidden group-hover:flex opacity-0 group-hover:opacity-100'}`}>
                    
                    <button 
                      onClick={() => handleReact(message.id, message.reaction)} 
                      title={message.reaction ? "Gỡ tim" : "Thả tim"} 
                      className={`p-1.5 hover:bg-secondary rounded-full transition-colors ${message.reaction === '❤️' ? 'text-red-500' : 'text-muted hover:text-red-500'}`}
                    >
                      <Heart size={16} className={message.reaction === '❤️' ? 'fill-current' : ''}/>
                    </button>

                    <button onClick={() => setReplyTo(message.content || 'Hình ảnh')} title="Trả lời" className="p-1.5 hover:bg-secondary rounded-full text-muted hover:text-foreground transition-colors"><Reply size={16}/></button>
                    
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === message.id ? null : message.id); }} title="Thêm" className="p-1.5 hover:bg-secondary rounded-full text-muted hover:text-foreground transition-colors"><MoreVertical size={16}/></button>
                      
                      {isMenuOpen && (
                        <div onClick={(e) => e.stopPropagation()} className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} z-[100] w-56 bg-background border border-border shadow-2xl rounded-xl py-1 overflow-hidden`}>
                          {isMe && (
                            <button onClick={() => handleRevokeEveryone(message.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary text-[14px] text-red-500 text-left font-medium">
                              <Trash2 size={16}/> Thu hồi với mọi người
                            </button>
                          )}
                          <button onClick={() => handleRevokeMe(message.id)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary text-[14px] text-foreground text-left font-medium">
                            <EyeOff size={16}/> Thu hồi ở phía tôi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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

      <div className="border-t border-border bg-background flex flex-col">
        {replyTo && (
          <div className="flex items-center justify-between bg-secondary/30 px-4 py-2 border-l-4 border-blue-500 text-[13px]">
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-foreground">Đang trả lời:</span>
              <span className="truncate text-muted">{replyTo}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-muted hover:text-foreground p-1 rounded-full hover:bg-secondary"><X size={16}/></button>
          </div>
        )}

        <div className="p-3 bg-background/95 backdrop-blur-md flex flex-col gap-2">
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
              className="flex-1 bg-secondary text-foreground border-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none max-h-24 overflow-y-auto custom-scrollbar"
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