'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/app/lib/api';
import Link from 'next/link';
import { Avatar } from '@/app/components/ui/Avatar'; 

interface UserDTO {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string; 
}

export function FollowersModal({ isOpen, onClose, username }: FollowersModalProps) {
  const [followers, setFollowers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.get(`/users/${username}/followers`)
        .then((res) => {
          setFollowers(res.data);
        })
        .catch((err) => console.error("Lỗi lấy danh sách followers:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="w-8" />
          <h2 className="font-bold text-lg text-foreground">Người theo dõi</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted" size={32} /></div>
          ) : followers.length === 0 ? (
            <div className="text-center text-muted py-8">Chưa có ai theo dõi.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {followers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <Link href={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3 hover:opacity-80 transition">
                    <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-foreground">{user.fullName || user.username}</span>
                      <span className="text-muted text-sm">@{user.username}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}