'use client';

import { useState } from 'react';
import type { ReactionType } from '@/app/types/thread';

const reactionMap: Record<ReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  SAD: '😢',
  ANGRY: '😡',
};

interface ReactionButtonProps {
  onReact?: (reaction: ReactionType) => void;
}

export default function ReactionButton({ onReact }: ReactionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button onMouseEnter={() => setOpen(true)} className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">
        React
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-full p-2 flex gap-1 shadow">
          {(Object.keys(reactionMap) as ReactionType[]).map((reaction) => (
            <button
              key={reaction}
              onClick={() => {
                onReact?.(reaction);
                setOpen(false);
              }}
              className="text-xl hover:scale-125 transition"
            >
              {reactionMap[reaction]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
