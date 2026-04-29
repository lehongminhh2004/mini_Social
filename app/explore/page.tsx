'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { Post } from '@/app/lib/types';
import Sidebar from '../components/Sidebar';
import ThreadCard from '../components/ThreadCard';

export default function ExplorePage() {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['explore'],
    queryFn: async () => {
      const res = await api.get<Post[]>('/posts?page=0&size=20');
      return res.data;
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Explore</h1>

          {isLoading && <p className="text-gray-500">Đang tải...</p>}
          {error && <p className="text-red-500">Không thể tải bài viết.</p>}

          {posts?.map((post) => (
            <ThreadCard key={post.id} thread={post} />
          ))}

          {posts?.length === 0 && (
            <p className="text-gray-500">Chưa có bài viết nào.</p>
          )}
        </section>
      </div>
    </main>
  );
}
