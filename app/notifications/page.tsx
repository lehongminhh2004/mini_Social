'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { NotificationItem } from '@/app/lib/types';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { Avatar } from '@/app/components/ui/Avatar';
import { timeAgo } from '@/app/lib/utils';

const notificationIcon: Record<string, string> = {
  REACTION: '❤️',
  COMMENT: '💬',
  SHARE: '🔁',
  FOLLOW: '👤',
};

export default function NotificationsPage() {
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<NotificationItem[]>('/notifications');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-4">
        <div className="px-4 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        </div>

        <div className="border-b border-border flex px-4 mb-2">
          <button className="flex-1 pb-4 border-b-2 border-foreground font-semibold text-foreground">
            All
          </button>
          <button className="flex-1 pb-4 font-semibold text-muted hover:text-foreground transition-colors">
            Replies
          </button>
          <button className="flex-1 pb-4 font-semibold text-muted hover:text-foreground transition-colors">
            Mentions
          </button>
        </div>

        {isLoading && (
          <div className="text-center mt-10 text-muted">Đang tải thông báo...</div>
        )}

        {error && (
          <div className="text-center mt-10 text-red-500">Không thể tải thông báo.</div>
        )}

        {notifications && notifications.length === 0 && (
          <div className="text-center mt-20 text-muted">No recent activity.</div>
        )}

        <div className="divide-y divide-border">
          {notifications?.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                !notif.isRead ? 'bg-secondary/40' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {notif.sender ? (
                  <Avatar
                    src={notif.sender.avatarUrl}
                    alt={notif.sender.fullName}
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
