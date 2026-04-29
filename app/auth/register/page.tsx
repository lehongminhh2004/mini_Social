'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/lib/api';
import { useAuth } from '@/app/lib/auth-context';
import { User } from '@/app/lib/types';

export default function Register() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Đăng ký — BE nhận User object với passwordHash
      await api.post('/users/register', {
        username,
        fullName,
        email,
        passwordHash: password,
      });

      // Tự động đăng nhập sau khi đăng ký thành công
      const res = await api.post<string>('/users/login', {
        username,
        passwordHash: password,
      });

      const token = res.data;
      localStorage.setItem('token', token);

      // Lấy thông tin user vừa tạo
      const userRes = await api.get<User[]>(`/users/search?keyword=${username}`);
      const currentUser = userRes.data.find((u) => u.username === username) ?? userRes.data[0];

      login(token, currentUser);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data || 'Đăng ký thất bại. Username hoặc email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign up for Threads</h1>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (không dấu, không khoảng trắng)"
              required
              className="w-full p-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
            />

            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Họ và tên"
              required
              className="w-full p-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              required
              className="w-full p-4 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-border transition-shadow"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-primary text-background font-semibold rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Đang đăng ký...' : 'Sign up'}
          </button>
        </form>

        <div className="text-muted">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-foreground hover:underline font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
