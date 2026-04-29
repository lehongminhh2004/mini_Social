'use client';

import { useState } from 'react';
import { api } from '@/app/lib/api';

interface FollowButtonProps {
  targetUserId: string;
  initialFollowed?: boolean;
}

export default function FollowButton({ targetUserId, initialFollowed = false }: FollowButtonProps) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    // Optimistic update
    setFollowed((prev) => !prev);
    try {
      await api.post(`/users/follow/${targetUserId}`);
    } catch {
      // Revert on error
      setFollowed((prev) => !prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
        followed
          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {followed ? 'Following' : 'Follow'}
    </button>
  );
}
