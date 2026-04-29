'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { Post, Comment } from '@/app/lib/types';
import { PostCard } from '@/app/components/PostCard';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { PostComposer } from '@/app/components/PostComposer';
import { Avatar } from '@/app/components/ui/Avatar';
import { timeAgo } from '@/app/lib/utils';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function ThreadDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const [isReplying, setIsReplying] = useState(false);
  const queryClient = useQueryClient();

  // Lấy danh sách comments của bài viết
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await api.get<Comment[]>(`/comments/post/${postId}`);
      return res.data;
    },
  });

  // Lấy thông tin bài viết từ feed cache nếu có, không thì fetch riêng
  const feedData = queryClient.getQueryData<{ pages: { items: Post[] }[] }>(['feed']);
  const cachedPost = feedData?.pages.flatMap((p) => p.items).find((p) => p.id === postId);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20">
        <div className="w-full">
          {/* Bài viết gốc — lấy từ cache feed nếu có */}
          {cachedPost && <PostCard post={cachedPost} hasReplies={(comments?.length ?? 0) > 0} />}

          {/* Comments */}
          {isLoading ? (
            <div className="p-4 text-center text-muted">Loading replies...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Không thể tải replies.</div>
          ) : (
            <>
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 border-b border-border">
                  <Avatar
                    src={comment.author.avatarUrl}
                    alt={comment.author.fullName}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {comment.author.fullName}
                      </span>
                      <span className="text-muted text-sm">@{comment.author.username}</span>
                      <span className="text-muted text-sm ml-auto">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground/90 text-[15px] leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {comments?.length === 0 && (
                <div className="p-8 text-center text-muted">
                  No replies yet. Be the first to reply!
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Reply bar */}
      {cachedPost && (
        <div
          className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border p-3 flex items-center justify-center cursor-text text-muted"
          onClick={() => setIsReplying(true)}
        >
          Reply to {cachedPost.authorName}...
        </div>
      )}

      <PostComposer
        isOpen={isReplying}
        onClose={() => setIsReplying(false)}
        replyToId={postId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['comments', postId] })}
      />

      <BottomNav />
    </div>
  );
}
