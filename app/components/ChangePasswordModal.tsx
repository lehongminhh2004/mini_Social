'use client';

import { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/app/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await api.put('/users/password', {
        oldPassword,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form state
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data || 'Đã xảy ra lỗi khi đổi mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border w-full max-w-md rounded-2xl shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="w-8" />
          <h2 className="font-bold text-lg text-foreground">Đổi mật khẩu</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
             <div className="text-center text-green-500 font-medium py-8">
               Đổi mật khẩu thành công!
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 border border-border/50"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 border border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-blue-500 border border-border/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground text-background font-bold rounded-xl px-4 py-3 mt-2 hover:opacity-90 transition-opacity flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Cập nhật mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}