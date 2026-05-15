'use client';

import Link from "next/link";
import { Home, Search, SquarePen, Heart, User, MessageCircle, Loader2, AlignJustify, Key } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn, timeAgo } from "@/app/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useGlobalChat } from "@/app/lib/ChatContext";
import { Avatar } from "@/app/components/ui/Avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query"; 
import { api } from "@/app/lib/api"; 
import { useAuth } from "@/app/lib/auth-context"; 
import { Client } from '@stomp/stompjs'; 
import SockJS from 'sockjs-client'; 
import { ChangePasswordModal } from "./ChangePasswordModal"; 

interface Conversation {
  partnerUsername: string;
  partnerFullName: string;
  partnerAvatarUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function Header() {
  const pathname = usePathname();
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setActiveChatUser } = useGlobalChat();
  const { user: currentUser } = useAuth(); 
  const queryClient = useQueryClient();
  const stompClientRef = useRef<Client | null>(null);

  const navItems = [
    { icon: Home, href: "/" },
    { icon: Search, href: "/search" },
    { icon: SquarePen, href: "/compose", className: "hidden md:block" },
    { icon: Heart, href: "/notifications" },
    { icon: User, href: `/profile/${currentUser?.username || ''}` }, 
  ];

  const { data: conversationList = [], isLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const res = await api.get<Conversation[]>('/chat/conversations');
      return res.data;
    },
    enabled: isChatMenuOpen && !!currentUser, 
    refetchInterval: isChatMenuOpen ? 5000 : false,
  });

  const { data: unreadNotiCount = 0 } = useQuery({
    queryKey: ['unread-noti-count'],
    queryFn: async () => {
      const res = await api.get<number>('/notifications/unread-count');
      return res.data;
    },
    enabled: !!currentUser, 
  });

  const { data: unreadMsgCount = 0 } = useQuery({
    queryKey: ['unread-msg-count'],
    queryFn: async () => {
      const res = await api.get<number>('/chat/unread-count');
      return res.data;
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (!currentUser) return;
    const socket = new SockJS('http://localhost:8080/ws'); 
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe(`/user/${currentUser.username}/queue/notifications`, () => {
           // Cập nhật số đỏ trên cái chuông
           queryClient.invalidateQueries({ queryKey: ['unread-noti-count'] });
           
           // Báo cho React Query biết để fetch lại data bài viết ngầm, giúp số tim/cmt nhảy theo thời gian thực
           queryClient.invalidateQueries({ queryKey: ['feed'] });
           queryClient.invalidateQueries({ queryKey: ['user-threads'] });
           queryClient.invalidateQueries({ queryKey: ['thread'] });
        });
        
        client.subscribe(`/user/${currentUser.username}/queue/messages`, () => {
           queryClient.invalidateQueries({ queryKey: ['unread-msg-count'] });
        });
        client.subscribe(`/user/${currentUser.username}/queue/updates`, () => {
           queryClient.invalidateQueries({ queryKey: ['feed'] });
           queryClient.invalidateQueries({ queryKey: ['user-threads'] });
           queryClient.invalidateQueries({ queryKey: ['thread'] });
        });
        client.subscribe(`/topic/feed`, () => {
           queryClient.invalidateQueries({ queryKey: ['feed'] });
        });
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [currentUser, queryClient]);

  const filteredConversations = conversationList.filter(c => {
    const keyword = searchQuery.toLowerCase();
    return c.partnerUsername.toLowerCase().includes(keyword) || 
           (c.partnerFullName && c.partnerFullName.toLowerCase().includes(keyword));
  });

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-foreground">@</Link>
          
          <nav className="hidden md:flex items-center gap-6 relative">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href.startsWith('/profile') && pathname.startsWith('/profile'));
              const isNoti = item.href === '/notifications'; 

              return (
                <Link key={i} href={item.href} className={cn("p-3 rounded-lg transition-colors hover:bg-secondary relative", isActive ? "text-foreground" : "text-muted hover:text-foreground/80")}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {isNoti && unreadNotiCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                      {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="relative">
              <button 
                onClick={() => {
                  setIsChatMenuOpen(!isChatMenuOpen);
                  setIsSettingsMenuOpen(false); 
                }} 
                className="p-3 rounded-lg transition-colors hover:bg-secondary text-muted hover:text-foreground/80 relative"
              >
                <MessageCircle size={24} strokeWidth={2} />
                {unreadMsgCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm pointer-events-none">
                    {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                  </span>
                )}
              </button>

              {/* KHU VỰC KHUNG CHAT */}
              {isChatMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-[380px] bg-background border border-border shadow-2xl rounded-2xl flex flex-col z-[100] overflow-hidden">
                  <div className="p-4 pb-2 border-b border-border/50">
                    <h3 className="font-bold text-2xl text-foreground mb-3">Đoạn chat</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm trên Messenger..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-secondary text-foreground rounded-full pl-10 pr-4 py-2 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-muted"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="animate-spin text-muted" size={24} />
                      </div>
                    ) : filteredConversations.length > 0 ? (
                      filteredConversations.map(conv => {
                        const hasUnread = conv.unreadCount > 0;
                        return (
                          <button
                            key={conv.partnerUsername}
                            onClick={() => {
                              setActiveChatUser(conv.partnerUsername);
                              setIsChatMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full p-2 hover:bg-secondary rounded-xl text-left transition-colors relative"
                          >
                            <Avatar src={conv.partnerAvatarUrl} alt={conv.partnerUsername} size="md" />
                            <div className="flex-1 overflow-hidden pr-4">
                              <p className={`text-[15px] truncate ${hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>
                                {conv.partnerFullName || conv.partnerUsername}
                              </p>
                              <p className={`text-[13px] truncate mt-0.5 ${hasUnread ? 'font-bold text-foreground' : 'text-muted'}`}>
                                {conv.lastMessage} · {timeAgo(conv.lastMessageAt)}
                              </p>
                            </div>
                            
                            {hasUnread && (
                              <div className="absolute right-4 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-center text-muted py-4 text-sm">Chưa có cuộc hội thoại nào</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* GÓC PHẢI: Menu cài đặt & Đổi mật khẩu */}
          <div className="relative flex items-center">
            {currentUser && (
               <>
                 <button 
                    onClick={() => {
                      setIsSettingsMenuOpen(!isSettingsMenuOpen);
                      setIsChatMenuOpen(false);
                    }}
                    className="p-2 rounded-lg transition-colors hover:bg-secondary text-muted hover:text-foreground"
                 >
                   <AlignJustify size={28} strokeWidth={1.5} />
                 </button>
                 
                 {isSettingsMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border shadow-xl rounded-xl py-2 z-[100]">
                      <button 
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          setIsChangePasswordModalOpen(true);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary text-left text-[15px] font-medium transition-colors"
                      >
                        <Key size={18} /> Đổi mật khẩu
                      </button>
                    </div>
                 )}
               </>
            )}
            {!currentUser && <div className="w-8" />} 
          </div>
        </div>
      </header>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </>
  );
}