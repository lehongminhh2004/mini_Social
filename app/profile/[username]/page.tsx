'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { User, Post } from '@/app/lib/types';
import Sidebar from '@/app/components/Sidebar';
import FollowButton from '@/app/components/FollowButton';
import ThreadCard from '@/app/components/ThreadCard';
import { Avatar } from '@/app/components/ui/Avatar';
import { useAuth } from '@/app/lib/auth-context';
import { useParams } from 'next/navigation';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();

  // Tìm user theo username
  const { data: users, isLoading: loadingUser } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const res = await api.get<User[]>(`/users/search?keyword=${encodeURIComponent(username)}`);
      return res.data;
    },
  });

  const profileUser = users?.find((u) => u.username === username) ?? users?.[0];

  const isOwnProfile = currentUser?.username === username;

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-4">
          {loadingUser && <p className="text-gray-500">Đang tải...</p>}

          {profileUser && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={profileUser.avatarUrl} alt={profileUser.fullName} size="lg" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profileUser.fullName}</h1>
                    <p className="text-gray-600">@{profileUser.username}</p>
                    {profileUser.bio && (
                      <p className="text-sm text-gray-500 mt-1">{profileUser.bio}</p>
                    )}
                  </div>
                </div>
                {!isOwnProfile && (
                  <FollowButton targetUserId={profileUser.id} />
                )}
              </div>
            </div>
          )}

          {!profileUser && !loadingUser && (
            <p className="text-gray-500">Không tìm thấy user @{username}</p>
          )}
        </section>
      </div>
    </main>
  );
}
