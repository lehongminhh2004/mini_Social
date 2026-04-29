'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { Post } from '@/app/lib/types';
import { PostCard } from '@/app/components/PostCard';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { PostComposer } from '@/app/components/PostComposer';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get('compose') === 'true') {
      setIsComposerOpen(true);
      router.replace('/');
    }
  }, [searchParams, router]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: async ({ pageParam = 0 }) => {
        // BE dùng page bắt đầu từ 0, size mặc định 5
        const res = await api.get<Post[]>(`/posts?page=${pageParam}&size=10`);
        return {
          items: res.data,
          nextPage: res.data.length === 10 ? pageParam + 1 : undefined,
        };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20">
        <div className="w-full">
          {status === 'pending' ? (
            <div className="p-4 text-center text-muted">Loading threads...</div>
          ) : status === 'error' ? (
            <div className="p-4 text-center text-red-500">
              Không thể tải bài viết. Kiểm tra kết nối với backend.
            </div>
          ) : (
            <>
              {data.pages.map((page, i) => (
                <div key={i}>
                  {page.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ))}

              {data.pages[0].items.length === 0 && (
                <div className="p-8 text-center text-muted">
                  Chưa có bài viết nào. Hãy là người đầu tiên đăng!
                </div>
              )}

              {hasNextPage && (
                <div className="p-4 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-primary hover:underline"
                  >
                    {isFetchingNextPage ? 'Loading more...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsComposerOpen(true)}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-primary text-background p-4 rounded-2xl shadow-lg hover:scale-105 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      <PostComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
      />

      <BottomNav />
    </div>
  );
}
