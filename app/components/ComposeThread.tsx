'use client';

import { useState } from 'react';

interface ComposeThreadProps {
  onSubmit?: (content: string) => void;
}

export default function ComposeThread({ onSubmit }: ComposeThreadProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit?.(content.trim());
    setContent('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="Bạn đang nghĩ gì?"
        className="w-full p-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{content.length}/280</span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Đăng thread
        </button>
      </div>
    </div>
  );
}
