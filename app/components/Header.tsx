'use client';

import Link from "next/link";
import { Home, Search, SquarePen, Heart, User, MessageCircle, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { useState } from "react";
import { useGlobalChat } from "@/app/lib/ChatContext";
import { Avatar } from "@/app/components/ui/Avatar";
import { useQuery } from "@tanstack/react-query"; // Gọi API
import { api } from "@/app/lib/api"; 
import { useAuth } from "@/app/lib/auth-context"; // Lấy thông tin mình để loại trừ

// Định nghĩa Type cho cục Data trả về từ Backend
interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export function Header() {
  const pathname = usePathname();
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setActiveChatUser } = useGlobalChat();
  const { user: currentUser } = useAuth(); // Lấy data của bản thân

  const navItems = [
    { icon: Home, href: "/" },
    { icon: Search, href: "/search" },
    { icon: SquarePen, href: "/compose", className: "hidden md:block" },
    { icon: Heart, href: "/notifications" },
    { icon: User, href: "/profile" },
  ];

  // GỌI API LẤY DANH SÁCH USER THẬT (TỪ BACKEND)
  const { data: userList = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await api.get<ChatUser[]>('/users');
      return res.data;
    },
    // MẸO UX TỐI THƯỢNG: Chỉ gọi API khi người dùng BẤM MỞ Menu Chat. 
    // Tránh việc F5 web mà load quá nhiều API không cần thiết!
    enabled: isChatMenuOpen, 
  });

  // LỌC DANH SÁCH: 
  const filteredChatList = userList.filter(u => {
    // 1. Không hiển thị chính mình trong danh sách chat
    if (u.username === currentUser?.username) return false;
    
    // 2. Tìm kiếm theo Username hoặc Tên hiển thị (đều đưa về chữ thường để dễ tìm)
    const keyword = searchQuery.toLowerCase();
    return u.username.toLowerCase().includes(keyword) || 
           (u.fullName && u.fullName.toLowerCase().includes(keyword));
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight text-foreground">
          @
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 relative">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={i} href={item.href} className={cn("p-3 rounded-lg transition-colors hover:bg-secondary", isActive ? "text-foreground" : "text-muted hover:text-foreground/80")}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}

          {/* ICON NHẮN TIN VÀ MENU */}
          <div className="relative">
            <button onClick={() => setIsChatMenuOpen(!isChatMenuOpen)} className="p-3 rounded-lg transition-colors hover:bg-secondary text-muted hover:text-foreground/80 relative">
              <MessageCircle size={24} strokeWidth={2} />
            </button>

            {isChatMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-[360px] bg-background border border-border shadow-2xl rounded-2xl flex flex-col z-[100] overflow-hidden">
                <div className="p-4 pb-2">
                  <h3 className="font-bold text-2xl text-foreground mb-3">Đoạn chat</h3>
                  
                  {/* THANH TÌM KIẾM */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm bạn bè..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-secondary text-foreground rounded-full pl-10 pr-4 py-2 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-muted"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[400px] p-2 pt-0 custom-scrollbar">
                  {/* Hiệu ứng load xoay xoay nếu API đang chạy */}
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="animate-spin text-muted" size={24} />
                    </div>
                  ) : filteredChatList.length > 0 ? (
                    // In ra danh sách Data xịn
                    filteredChatList.map(friend => (
                      <button
                        key={friend.username}
                        onClick={() => {
                          setActiveChatUser(friend.username);
                          setIsChatMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full p-2 hover:bg-secondary rounded-xl text-left transition-colors"
                      >
                        {/* URL Avatar thật từ Database */}
                        <Avatar src={friend.avatarUrl} alt={friend.username} size="md" />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold text-[15px] text-foreground truncate">
                            {friend.fullName || friend.username}
                          </p>
                          <p className="text-[13px] text-muted truncate">@{friend.username}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-muted py-4 text-sm">Không tìm thấy ai</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
        <div className="w-8" />
      </div>
    </header>
  );
} 