'use client';

import { useAuth } from '@/app/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyProfileRedirect() {
  const { user } = useAuth(); // Bỏ isLoading đi vì context của bạn không có
  const router = useRouter();

  useEffect(() => {
    if (user && user.username) {
      // Đã đăng nhập: Tự động "bế" bạn vào thẳng đường link có tên bạn
      router.push(`/profile/${user.username}`);
    } else if (user === null) {
      // Chưa đăng nhập: Đá văng ra trang Login
      router.push('/auth/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-white">
      Đang chuyển hướng đến hồ sơ của bạn...
    </div>
  );
}