'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { useAuth } from '@/app/lib/auth-context';
import { User } from '@/app/lib/types';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // BE trả về JWT string thuần (không phải object)
      const res = await api.post<string>('/users/login', {
        username,
        passwordHash: password,
      });

      const token = res.data;

      // Lưu token trước để interceptor có thể gắn vào request tiếp theo
      localStorage.setItem('token', token);

      // Lấy thông tin user hiện tại bằng cách search theo username
      const userRes = await api.get<User[]>(`/users/search?keyword=${username}`);
      const currentUser = userRes.data.find((u) => u.username === username) ?? userRes.data[0];

      login(token, currentUser);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data || 'Đăng nhập thất bại. Kiểm tra lại username/mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Log in to Threads</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full p-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-primary text-background font-semibold rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Log in'}
          </button>
        </form>

        <div className="text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-foreground hover:underline font-semibold">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
