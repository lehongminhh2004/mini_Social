'use client';

import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/app/components/Header';
import { BottomNav } from '@/app/components/BottomNav';
import { Avatar } from '@/app/components/ui/Avatar';
import { useAuth } from '@/app/lib/auth-context';
import { useEffect, useState } from 'react'; 
import { useQuery } from '@tanstack/react-query'; 
import { api } from '@/app/lib/api'; 
import { PostCard } from '@/app/components/PostCard'; 
import { Post } from '@/app/lib/types'; 
import { Mail } from 'lucide-react'; 
// 1. IMPORT CÁI TRẠM ĐIỀU PHỐI VÀO ĐÂY
import { useGlobalChat } from '@/app/lib/ChatContext'; 

export default function OtherUserProfile() {
  const params = useParams(); 
  const targetUsername = params?.username as string; 
  
  const { user: currentUser } = useAuth(); 
  const isOwnProfile = currentUser?.username === targetUsername;

  // 2. LẤY HÀM MỞ KHUNG CHAT RA
  const { setActiveChatUser } = useGlobalChat(); 

  const [activeTab, setActiveTab] = useState<'threads' | 'replies' | 'reposts'>('threads');

  const { data: profileUser, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile', targetUsername],
    queryFn: async () => {
      const res = await api.get(`/users/${targetUsername}`);
      return res.data;
    },
    enabled: !!targetUsername,
  });

  const { data: reposts, isLoading: isLoadingReposts } = useQuery({
    queryKey: ['user-reposts', targetUsername],
    queryFn: async () => {
      const res = await api.get<Post[]>(`/posts/user/${targetUsername}/shares`);
      return res.data;
    },
    enabled: !!targetUsername && activeTab === 'reposts', 
  });

  if (isLoadingProfile) return <div className="min-h-screen bg-background text-white text-center pt-20">Đang tải hồ sơ...</div>;
  if (!profileUser) return <div className="min-h-screen bg-background text-white text-center pt-20">Không tìm thấy người dùng này</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-8 px-4">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profileUser.fullName || profileUser.username}</h1>
            <p className="text-muted mt-1">@{profileUser.username}</p>
            {profileUser.email && <p className="text-foreground/70 mt-1">{profileUser.email}</p>}
          </div>
          <Avatar src={profileUser.avatarUrl} alt={profileUser.username} size="xl" />
        </div>

        {profileUser.bio && (
          <p className="text-foreground mb-4">{profileUser.bio}</p>
        )}

        <div className="flex gap-2 mb-8">
          {isOwnProfile ? (
            <button className="flex-1 bg-secondary text-foreground font-semibold py-2 rounded-xl border border-border hover:bg-secondary/80 transition-colors">
              Edit profile
            </button>
          ) : (
            <>
              <button className="flex-1 bg-foreground text-background font-semibold py-2 rounded-xl hover:bg-foreground/80 transition-colors">
                Theo dõi
              </button>
              
              {/* 3. ĐÃ SỬA CHỖ NÀY: Xóa Link, biến nó thành Nút bấm Mở Khung Chat */}
              <button 
                onClick={() => setActiveChatUser(targetUsername)}
                className="w-12 flex items-center justify-center bg-secondary text-foreground rounded-xl border border-border hover:bg-secondary/80 transition-colors"
              >
                <Mail size={20} />
              </button>
            </>
          )}
        </div>

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

        <div className="py-2">
          {activeTab === 'reposts' && (
            <div className="flex flex-col">
              {isLoadingReposts ? (
                <div className="py-8 text-center text-muted">Đang tải bài đăng lại...</div>
              ) : reposts && reposts.length > 0 ? (
                reposts.map((post) => (
                  <PostCard key={post.id} post={post} />
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
      <BottomNav />
    </div>
  );
}