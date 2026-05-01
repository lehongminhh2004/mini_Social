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
import { Mail } from 'lucide-react'; // Import Icon Mail
import Link from 'next/link';

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams(); // Lấy tham số từ URL
  
  // KIỂM TRA: Có phải trang của chính mình không?
  // Nếu URL không có username (localhost:3000/profile) HOẶC username trên URL trùng với username đang đăng nhập
  const targetUsername = (params?.username as string) || user?.username;
  const isOwnProfile = !params?.username || params?.username === user?.username;

  const [activeTab, setActiveTab] = useState<'threads' | 'replies' | 'reposts'>('threads');

  // GỌI API LẤY BÀI ĐĂNG LẠI (Dùng targetUsername thay vì user.username)
  const { data: reposts, isLoading: isLoadingReposts } = useQuery({
    queryKey: ['user-reposts', targetUsername],
    queryFn: async () => {
      const res = await api.get<Post[]>(`/posts/user/${targetUsername}/shares`);
      return res.data;
    },
    enabled: !!targetUsername && activeTab === 'reposts', 
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[600px] mx-auto min-h-screen pb-20 pt-8 px-4">
        {/* LƯU Ý: Vì chưa làm API lấy profile user khác, mình tạm thời hiện data của user đang đăng nhập nhé */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
            <p className="text-muted mt-1">@{targetUsername}</p>
            <p className="text-foreground/70 mt-1">{user.email}</p>
          </div>
          <Avatar src={user.avatarUrl} alt={user.fullName} size="xl" />
        </div>

        {user.bio && (
          <p className="text-foreground mb-4">{user.bio}</p>
        )}

        {/* ĐÃ SỬA: Hiển thị Nút theo logic Chủ nhà / Khách */}
        <div className="flex gap-2 mb-8">
          {isOwnProfile ? (
            <button className="flex-1 bg-secondary text-foreground font-semibold py-2 rounded-xl border border-border hover:bg-secondary/80 transition-colors">
              Edit profile
            </button>
            // Bỏ luôn cái nút Share profile theo ý bạn
          ) : (
            <>
              <button className="flex-1 bg-foreground text-background font-semibold py-2 rounded-xl hover:bg-foreground/80 transition-colors">
                Theo dõi
              </button>
              <Link 
                href={`/messages/${targetUsername}`} // Bấm vào đây sẽ nhảy sang trang Chat với người này
                className="w-12 flex items-center justify-center bg-secondary text-foreground rounded-xl border border-border hover:bg-secondary/80 transition-colors"
              >
                <Mail size={20} />
              </Link>
            </>
          )}
        </div>

        <div className="mt-8 border-b border-border flex">
          <button 
            onClick={() => setActiveTab('threads')}
            className={`flex-1 pb-4 font-semibold transition-colors ${
              activeTab === 'threads' ? 'border-b-2 border-foreground text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            Threads
          </button>
          <button 
            onClick={() => setActiveTab('replies')}
            className={`flex-1 pb-4 font-semibold transition-colors ${
              activeTab === 'replies' ? 'border-b-2 border-foreground text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            Replies
          </button>
          <button 
            onClick={() => setActiveTab('reposts')}
            className={`flex-1 pb-4 font-semibold transition-colors ${
              activeTab === 'reposts' ? 'border-b-2 border-foreground text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            Reposts
          </button>
        </div>

        <div className="py-2">
          {activeTab === 'threads' && (
            <div className="py-8 text-center text-muted">
              API lấy bài viết gốc (Threads) đang chờ ghép...
            </div>
          )}

          {activeTab === 'replies' && (
            <div className="py-8 text-center text-muted">
              API lấy bình luận (Replies) đang chờ ghép...
            </div>
          )}

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
                  Bạn chưa đăng lại bài viết nào.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chỉ hiện nút Đăng xuất ở trang của mình */}
        {isOwnProfile && (
          <div className="mt-8 border-t border-border pt-8">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 text-red-500 font-semibold py-3 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}