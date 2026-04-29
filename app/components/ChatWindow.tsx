'use client';

import { useMemo, useState } from 'react';
import type { ChatMessage } from '@/app/lib/types';

interface ChatWindowProps {
  conversationId: string;
  currentUserId?: string;
  messages: ChatMessage[];
}

export default function ChatWindow({ conversationId, messages, currentUserId = 'me' }: ChatWindowProps) {
  const [draft, setDraft] = useState('');

  const filteredMessages = useMemo(
    () => messages.filter((message) => message.senderUsername === conversationId || message.receiverUsername === conversationId),
    [messages, conversationId],
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[70vh] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
              message.senderUsername === currentUserId ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
        />
        <button
          onClick={() => setDraft('')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
