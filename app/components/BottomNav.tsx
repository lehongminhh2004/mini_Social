'use client';

import Link from "next/link";
import { Home, Search, SquarePen, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { useQuery } from "@tanstack/react-query"; 
import { api } from "@/app/lib/api"; 
import { useAuth } from "@/app/lib/auth-context";

export function BottomNav() {
  const pathname = usePathname();
  const { user: currentUser } = useAuth(); 

  const navItems = [
    { icon: Home, href: "/" },
    { icon: Search, href: "/search" },
    { icon: SquarePen, href: "/compose" },
    { icon: Heart, href: "/notifications" },
    { icon: User, href: "/profile" },
  ];

  // 🔥 GỌI API LẤY SỐ THÔNG BÁO CHƯA ĐỌC CHO MOBILE
  const { data: unreadNotiCount = 0 } = useQuery({
    queryKey: ['unread-noti-count-mobile'],
    queryFn: async () => {
      const res = await api.get<number>('/notifications/unread-count');
      return res.data;
    },
    enabled: !!currentUser,
    refetchInterval: 10000, 
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isNoti = item.href === '/notifications';

          return (
            <Link 
              key={i} 
              href={item.href}
              className={cn(
                "p-3 transition-colors relative",
                isActive ? "text-foreground" : "text-muted hover:text-foreground/80"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              
              {/* 🔥 VẼ CHẤM ĐỎ CHO MOBILE */}
              {isNoti && unreadNotiCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                  {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}