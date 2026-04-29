'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { Avatar } from '@/app/components/ui/Avatar';
import { useAuth } from '@/app/lib/auth-context';
import { useEffect } from 'react';

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-8 px-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
            <p className="text-muted mt-1">@{user.username}</p>
            <p className="text-foreground/70 mt-1">{user.email}</p>
          </div>
          <Avatar src={user.avatarUrl} alt={user.fullName} size="xl" />
        </div>

        {user.bio && (
          <p className="text-foreground mb-4">{user.bio}</p>
        )}

        <div className="flex gap-2 mb-8">
          <button className="flex-1 bg-secondary text-foreground font-semibold py-2 rounded-xl border border-border hover:bg-secondary/80 transition-colors">
            Edit profile
          </button>
          <button className="flex-1 bg-secondary text-foreground font-semibold py-2 rounded-xl border border-border hover:bg-secondary/80 transition-colors">
            Share profile
          </button>
        </div>

        <div className="mt-8 border-b border-border flex">
          <button className="flex-1 pb-4 border-b-2 border-foreground font-semibold text-foreground">
            Threads
          </button>
          <button className="flex-1 pb-4 font-semibold text-muted hover:text-foreground transition-colors">
            Replies
          </button>
          <button className="flex-1 pb-4 font-semibold text-muted hover:text-foreground transition-colors">
            Reposts
          </button>
        </div>

        <div className="py-8 text-center text-muted">
          No threads yet.
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 text-red-500 font-semibold py-3 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Log out
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
