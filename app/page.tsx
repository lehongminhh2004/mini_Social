'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { Post } from '@/app/lib/types';
import { PostCard } from '@/app/components/PostCard';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { PostComposer } from '@/app/components/PostComposer';
import { Plus, Loader2 } from 'lucide-react'; 
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer'; 
export default function Home() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 🔥 TẠO CẢM BIẾN NHẬN DIỆN CHẠM ĐÁY
  const { ref, inView } = useInView({
    threshold: 0, // Chạm đúng vạch là kích hoạt ngay
  });

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
        const res = await api.get<Post[]>(`/posts?page=${pageParam}&size=10`);
        return {
          items: res.data,
          nextPage: res.data.length === 10 ? pageParam + 1 : undefined,
        };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  // 🔥 MA THUẬT NẰM Ở ĐÂY: KHI CẢM BIẾN HIỆN LÊN MÀN HÌNH VÀ CÒN TRANG TIẾP THEO -> TỰ ĐỘNG TẢI
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20">
        <div className="w-full">
          {status === 'pending' ? (
            <div className="p-8 flex justify-center text-muted">
              <Loader2 className="animate-spin" size={32} />
            </div>
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

              {/* 🔥 GẮN CẢM BIẾN VÀO CUỐI DANH SÁCH (THAY THẾ CHO NÚT BẤM) */}
              {hasNextPage && (
                <div ref={ref} className="p-8 flex justify-center items-center">
                  {isFetchingNextPage ? (
                    <Loader2 className="animate-spin text-muted" size={24} />
                  ) : (
                    // Một thẻ div tàng hình để làm điểm neo
                    <div className="h-4 w-full"></div> 
                  )}
                </div>
              )}
              
              {/* Thông báo hết bài viết */}
              {!hasNextPage && data.pages[0].items.length > 0 && (
                <div className="p-8 text-center text-muted text-sm border-t border-border mt-4">
                  Bạn đã xem hết bài viết.
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