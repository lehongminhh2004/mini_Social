'use client';

import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { Avatar } from '@/app/components/ui/Avatar';
import FollowButton from '@/app/components/FollowButton';
import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { User } from '@/app/lib/types';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const { user: currentUser } = useAuth();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', keyword],
    queryFn: async () => {
      if (!keyword.trim()) return [];
      const res = await api.get<User[]>(`/users/search?keyword=${encodeURIComponent(keyword)}`);
      return res.data;
    },
    enabled: keyword.trim().length > 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-4 px-4">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <SearchIcon size={20} className="text-muted" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-secondary text-foreground rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
          />
        </div>

        {isLoading && keyword && (
          <div className="text-center text-muted">Đang tìm kiếm...</div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-2">
            {results.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                  <Avatar src={user.avatarUrl} alt={user.fullName} size="md" />
                  <div>
                    <p className="font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-muted text-sm">@{user.username}</p>
                    {user.bio && <p className="text-foreground/70 text-sm mt-0.5">{user.bio}</p>}
                  </div>
                </Link>
                {/* Không hiện Follow button cho chính mình */}
                {currentUser && user.id !== currentUser.id && (
                  <FollowButton targetUserId={user.id} />
                )}
              </div>
            ))}
          </div>
        )}

        {results?.length === 0 && keyword && !isLoading && (
          <div className="text-center mt-20 text-muted">
            Không tìm thấy user nào với từ khóa &quot;{keyword}&quot;
          </div>
        )}

        {!keyword && (
          <div className="text-center mt-20 text-muted">
            Search for users or threads.
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
