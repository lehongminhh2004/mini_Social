'use client';

import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { Avatar } from '@/app/components/ui/Avatar';
import { useAuth } from '@/app/lib/auth-context';
import { useState, useEffect, useMemo } from 'react'; 
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { api } from '@/app/lib/api'; 
import { PostCard } from '@/app/components/PostCard'; 
import { CommentCard } from '@/app/components/CommentCard'; 
import { Post, Comment, ShareItem } from '@/app/lib/types';
import { Mail, LogOut, Repeat2, Loader2 } from 'lucide-react';
import { useGlobalChat } from '@/app/lib/ChatContext'; 
import { EditProfileModal } from '@/app/components/EditProfileModal'; // 🔥 IMPORT MODAL Ở ĐÂY

export default function OtherUserProfile() {
  const params = useParams(); 
  const targetUsername = params?.username as string; 
  
  const router = useRouter(); 
  const { user: currentUser } = useAuth(); 
  const isOwnProfile = currentUser?.username === targetUsername;

  const { setActiveChatUser } = useGlobalChat(); 
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'threads' | 'replies' | 'reposts'>('threads');
  
  // 🔥 STATE ĐIỀU KHIỂN MODAL EDIT PROFILE
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const profileQueryKey = useMemo(() => ['user-profile', targetUsername, currentUser?.username], [targetUsername, currentUser?.username]);

  // ==========================================
  // 1. LẤY THÔNG TIN NGƯỜI DÙNG (PROFILE INFO)
  // ==========================================
  const { data: profileUser, isLoading: isLoadingProfile } = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const url = currentUser?.username 
        ? `/users/${targetUsername}?viewerUsername=${currentUser.username}` 
        : `/users/${targetUsername}`;
      
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!targetUsername,
  });

  useEffect(() => {
    if (currentUser) {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    }
  }, [currentUser, queryClient, profileQueryKey]);

  // ==========================================
  // 2. LẤY BÀI VIẾT GỐC (THREADS)
  // ==========================================
  const { data: threads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['user-threads', targetUsername],
    queryFn: async () => {
      const res = await api.get<Post[]>(`/posts/user/${targetUsername}`);
      return res.data;
    },
    enabled: !!targetUsername && activeTab === 'threads', 
  });

  // ==========================================
  // 3. LẤY BÌNH LUẬN (REPLIES)
  // ==========================================
  const { data: replies, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['user-replies', targetUsername],
    queryFn: async () => {
      const res = await api.get<Comment[]>(`/comments/user/${targetUsername}`);
      return res.data;
    },
    enabled: !!targetUsername && activeTab === 'replies', 
  });

  // ==========================================
  // 4. LẤY BÀI ĐĂNG LẠI (REPOSTS)
  // ==========================================
  const { data: reposts, isLoading: isLoadingReposts } = useQuery({
    queryKey: ['user-reposts', targetUsername],
    queryFn: async () => {
      const res = await api.get<ShareItem[]>(`/posts/user/${targetUsername}/shares`);
      return res.data;
    },
    enabled: !!targetUsername && activeTab === 'reposts', 
  });

  // ==========================================
  // HANDLERS (XỬ LÝ SỰ KIỆN FOLLOW / LOGOUT)
  // ==========================================
  const handleFollow = async () => {
    if (!currentUser) {
      alert("Bạn cần đăng nhập để theo dõi người này!");
      router.push('/auth/login');
      return;
    }

    const currentlyFollowing = profileUser?.isFollowing;

    await queryClient.cancelQueries({ queryKey: profileQueryKey });
    const previousProfile = queryClient.getQueryData(profileQueryKey);

    queryClient.setQueryData(profileQueryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        isFollowing: !currentlyFollowing,
        followerCount: currentlyFollowing ? oldData.followerCount - 1 : oldData.followerCount + 1
      };
    });

    try {
      await api.post(`/users/follow/${profileUser.id}`);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    } catch (error) {
      console.error("Lỗi API Follow:", error);
      queryClient.setQueryData(profileQueryKey, previousProfile);
    }
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      queryClient.clear();
      router.push('/auth/login');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // ==========================================
  // GIAO DIỆN (RENDER)
  // ==========================================
  if (isLoadingProfile) return <div className="min-h-screen bg-background text-white text-center pt-20">Đang tải hồ sơ...</div>;
  if (!profileUser) return <div className="min-h-screen bg-background text-white text-center pt-20">Không tìm thấy người dùng này</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header/>

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-8 px-4">
        
        {/* THÔNG TIN HỒ SƠ */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profileUser.fullName || profileUser.username}</h1>
            <p className="text-muted mt-1">@{profileUser.username}</p>
            {profileUser.email && <p className="text-foreground/70 mt-1">{profileUser.email}</p>}
            
            <p className="text-foreground font-semibold mt-2">
              {profileUser.followerCount} <span className="font-normal text-muted">người theo dõi</span>
            </p>
          </div>
          <Avatar src={profileUser.avatarUrl} alt={profileUser.username} size="xl"/>
        </div>

        {profileUser.bio && (
          <p className="text-foreground mb-4">{profileUser.bio}</p>
        )}

        {/* NÚT TƯƠNG TÁC */}
        <div className="flex gap-2 mb-8">
          {isOwnProfile ? (
            <div className="flex w-full gap-2">
              <button 
                onClick={() => setIsEditModalOpen(true)} // 🔥 MỞ MODAL KHI BẤM EDIT
                className="flex-1 bg-secondary text-foreground font-semibold py-2 rounded-xl border border-border hover:bg-secondary/80 transition-colors"
              >
                Edit profile
              </button>
              <button 
                onClick={handleLogout}
                className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={20}/>
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={handleFollow}
                className={`flex-1 font-semibold py-2 rounded-xl border transition-colors ${
                  profileUser.isFollowing 
                    ? "bg-transparent text-foreground border-border hover:border-foreground" 
                    : "bg-foreground text-background border-transparent hover:bg-foreground/80" 
                }`}
              >
                {profileUser.isFollowing ? "Đang theo dõi" : "Theo dõi"}
              </button>
              
              <button 
                onClick={() => setActiveChatUser(targetUsername)}
                className="w-12 flex items-center justify-center bg-secondary text-foreground rounded-xl border border-border hover:bg-secondary/80 transition-colors"
              >
                <Mail size={20}/>
              </button>
            </>
          )}
        </div>

        {/* CÁC TAB */}
        <div className="mt-8 border-b border-border flex">
          <button onClick={() => setActiveTab('threads')} className={`flex-1 pb-4 font-semibold transition-colors ${activeTab === 'threads' ? 'border-b-2 border-foreground text-foreground' : 'text-muted hover:text-foreground'}`}>
            Threads
          </button>
          <button onClick={() => setActiveTab('replies')} className={`flex-1 pb-4 font-semibold transition-colors ${activeTab === 'replies' ? 'border-b-2 border-foreground text-foreground' : 'text-muted hover:text-foreground'}`}>
            Replies
          </button>
          <button onClick={() => setActiveTab('reposts')} className={`flex-1 pb-4 font-semibold transition-colors ${activeTab === 'reposts' ? 'border-b-2 border-foreground text-foreground' : 'text-muted hover:text-foreground'}`}>
            Reposts
          </button>
        </div>

        {/* NỘI DUNG TỪNG TAB */}
        <div className="py-2">
          
          {/* TAB: THREADS */}
          {activeTab === 'threads' && (
            <div className="flex flex-col">
              {isLoadingThreads ? (
                <div className="py-8 flex justify-center text-muted">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : threads && threads.length > 0 ? (
                threads.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="py-8 text-center text-muted">
                  Chưa có bài viết nào.
                </div>
              )}
            </div>
          )}

          {/* TAB: REPLIES */}
          {activeTab === 'replies' && (
            <div className="flex flex-col">
              {isLoadingReplies ? (
                <div className="py-8 flex justify-center text-muted">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : replies && replies.length > 0 ? (
                replies.map((comment) => (
                  <CommentCard key={comment.id} comment={comment} postId={comment.postId} />
                ))
              ) : (
                <div className="py-8 text-center text-muted">
                  Người này chưa bình luận gì cả.
                </div>
              )}
            </div>
          )}

          {/* TAB: REPOSTS */}
          {activeTab === 'reposts' && (
            <div className="flex flex-col">
              {isLoadingReposts ? (
                <div className="py-8 flex justify-center text-muted">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : reposts && reposts.length > 0 ? (
                reposts.map((item) => (
                  <div key={item.shareId} className="relative">
                    <div className="absolute top-2 left-14 z-10 flex items-center gap-2 text-muted text-[13px] font-semibold">
                       <Repeat2 size={14}/> {profileUser.username} đã đăng lại
                    </div>
                    <div className="pt-6">
                      {item.type === 'POST' && item.post ? (
                        <PostCard post={item.post}/>
                      ) : item.type === 'COMMENT' && item.comment ? (
                        <CommentCard comment={item.comment} postId={item.comment.postId}/>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted">
                  Người này chưa đăng lại bài viết nào.
                </div>
              )}
            </div>
          )}

        </div>

      </main>
      <BottomNav/>

      {/* 🔥 GẮN COMPONENT MODAL XUỐNG DƯỚI CÙNG TRANG */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        initialData={{
          fullName: profileUser.fullName || '',
          bio: profileUser.bio || '',
          avatarUrl: profileUser.avatarUrl || ''
        }}
      />
    </div>
  );
}