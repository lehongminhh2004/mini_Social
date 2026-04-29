'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { User } from '@/app/lib/types';
import Sidebar from '../components/Sidebar';
import { Avatar } from '@/app/components/ui/Avatar';
import { useAuth } from '@/app/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

// BE chưa có endpoint lấy danh sách conversations
// Workaround: tìm user để bắt đầu chat mới
export default function MessagesPage() {
  const [keyword, setKeyword] = useState('');
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search-for-chat', keyword],
    queryFn: async () => {
      if (!keyword.trim()) return [];
      const res = await api.get<User[]>(`/users/search?keyword=${encodeURIComponent(keyword)}`);
      return res.data.filter((u) => u.username !== currentUser?.username);
    },
    enabled: keyword.trim().length > 0,
  });

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 bg-white rounded-xl shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

          {/* Search để bắt đầu chat mới */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm người để nhắn tin..."
              className="w-full border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {isLoading && keyword && (
            <p className="text-gray-400 text-sm text-center py-4">Đang tìm...</p>
          )}

          <div className="space-y-2">
            {results?.map((user) => (
              <button
                key={user.id}
                onClick={() => router.push(`/messages/${user.username}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition text-left"
              >
                <Avatar src={user.avatarUrl} alt={user.fullName} size="md" />
                <div>
                  <p className="font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </button>
            ))}
          </div>

          {!keyword && (
            <p className="text-gray-400 text-sm text-center py-8">
              Tìm kiếm người dùng để bắt đầu cuộc trò chuyện.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
