'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { api } from '@/app/lib/api';
import { NotificationItem } from '@/app/lib/types';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { Avatar } from '@/app/components/ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { useEffect } from 'react'; 
import { useRouter } from 'next/navigation'; // 🔥 THÊM ROUTER ĐỂ NHẢY TRANG

const notificationIcon: Record<string, string> = {
  REACTION: '❤️',
  COMMENT: '💬',
  SHARE: '🔁',
  FOLLOW: '👤',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient(); 
  const router = useRouter(); // 🔥 Khởi tạo router

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<NotificationItem[]>('/notifications');
      return res.data;
    },
  });

  useEffect(() => {
    const markNotificationsAsRead = async () => {
      try {
        await api.put('/notifications/mark-read');
        queryClient.invalidateQueries({ queryKey: ['unread-noti-count'] });
        queryClient.invalidateQueries({ queryKey: ['unread-noti-count-mobile'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] }); 
      } catch (error) {
        console.error("Lỗi xóa chấm đỏ thông báo:", error);
      }
    };

    markNotificationsAsRead();
  }, [queryClient]); 

  // 🔥 HÀM CLICK ĐỂ NHẢY TỚI BÀI VIẾT
  const handleNotificationClick = (notif: NotificationItem) => {
    // Nếu có targetId (ID bài viết) và không phải thông báo Follow thì nhảy tới bài viết
    if (notif.targetId && notif.type !== 'FOLLOW') {
      router.push(`/thread/${notif.targetId}`);
    } else if (notif.type === 'FOLLOW' && notif.senderUsername) {
      // Nếu là thông báo follow thì bay qua trang profile của người đó
      router.push(`/profile/${notif.senderUsername}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-4">
        <div className="px-4 mb-4">
          {/* 🔥 ĐÃ ĐỔI THÀNH "Thông báo" */}
          <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
        </div>

        {/* 🔥 ĐÃ XÓA CÁC TAB THỪA, CHỈ GIỮ LẠI TAB "Tất cả" */}
        <div className="border-b border-border flex px-4 mb-2">
          <button className="flex-1 pb-4 border-b-2 border-foreground font-semibold text-foreground">
            Tất cả
          </button>
        </div>

        {isLoading && (
          <div className="text-center mt-10 text-muted">Đang tải thông báo...</div>
        )}

        {error && (
          <div className="text-center mt-10 text-red-500">Không thể tải thông báo.</div>
        )}

        {notifications && notifications.length === 0 && (
          <div className="text-center mt-20 text-muted">Chưa có thông báo nào.</div>
        )}

        <div className="divide-y divide-border">
          {notifications?.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)} // 🔥 GẮN SỰ KIỆN CLICK VÀO ĐÂY
              className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-white/[0.02] ${
                !notif.isRead ? 'bg-secondary/40' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {/* 🔥 Lấy thẳng Avatar từ chuỗi phẳng của DTO */}
                {notif.senderAvatarUrl ? (
                  <Avatar
                    src={notif.senderAvatarUrl}
                    alt={notif.senderFullName || notif.senderUsername || 'User'}
                    size="sm"
                  />
                ) : (
                  <span className="text-xl">{notificationIcon[notif.type] ?? '🔔'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-[15px]">{notif.message}</p>
                <p className="text-muted text-sm mt-0.5">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}