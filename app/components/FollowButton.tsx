'use client';

import { useState } from 'react';

interface FollowButtonProps {
  initialFollowed?: boolean;
}

export default function FollowButton({ initialFollowed = false }: FollowButtonProps) {
  const [followed, setFollowed] = useState(initialFollowed);

  return (
    <button
      onClick={() => setFollowed((prev) => !prev)}
      className={`px-4 py-2 rounded-lg font-semibold ${followed ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'}`}
    >
      {followed ? 'Following' : 'Follow'}
    </button>
  );
}
