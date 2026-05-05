'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { Post, Comment } from '@/app/lib/types';
import { PostCard } from '@/app/components/PostCard';
import { CommentCard } from '@/app/components/CommentCard'; 
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { PostComposer } from '@/app/components/PostComposer';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/lib/auth-context';

export default function ThreadDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const [isReplying, setIsReplying] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth(); 

  // 1. Gọi API Lấy chi tiết bài viết gốc
  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const res = await api.get<Post>(`/posts/${postId}`); 
      return res.data;
    },
    refetchInterval: 3000, 
  });

  // 2. Lấy danh sách comments của bài viết
  const { data: comments, isLoading: isCommentsLoading, error } = useQuery({
    queryKey: ['comments', postId, user?.username], 
    queryFn: async () => {
      const url = user?.username 
          ? `/comments/post/${postId}?username=${user.username}` 
          : `/comments/post/${postId}`;
          
      const res = await api.get<Comment[]>(url);
      return res.data;
    },
    refetchInterval: 3000, 
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-[60px]">
        <div className="w-full">
          
          {/* Render Bài viết gốc */}
          {isPostLoading ? (
             <div className="p-4 text-center text-muted">Loading post...</div>
          ) : post ? (
             <PostCard post={post} hasReplies={(comments?.length ?? 0) > 0} />
          ) : (
             <div className="p-4 text-center text-red-500">Post not found.</div>
          )}

          {/* Render Comments */}
          {isCommentsLoading ? (
            <div className="p-4 text-center text-muted">Loading replies...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">Không thể tải replies.</div>
          ) : (
            <>
              {comments?.filter(c => !c.parentCommentId).map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  postId={postId} 
                  replies={comments.filter(child => child.parentCommentId === comment.id)} 
                />
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

      {/* Gọi Form PostComposer để bình luận (Bị ẩn, chỉ hiện khi click icon) */}
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