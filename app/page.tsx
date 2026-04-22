'use client';

import { useState } from 'react';
import ComposeThread from './components/ComposeThread';
import Sidebar from './components/Sidebar';
import ThreadCard from './components/ThreadCard';
import { mockThreads } from './lib/mock-data';
import type { ThreadItem } from './types/thread';

export default function Home() {
  const [threads, setThreads] = useState<ThreadItem[]>(mockThreads);

  const handleCompose = (content: string) => {
    const newThread: ThreadItem = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: 'me',
        name: 'Bạn',
        username: 'you',
      },
      repliesCount: 0,
      retweets: 0,
      reactions: { LIKE: 0, LOVE: 0, HAHA: 0, SAD: 0, ANGRY: 0 },
    };

    setThreads((prev) => [newThread, ...prev]);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Sidebar />
        </div>

        <section className="md:col-span-2">
          <ComposeThread onSubmit={handleCompose} />
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        </section>

        <aside className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-2">Trending</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>#nextjs</li>
              <li>#typescript</li>
              <li>#webdev</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
