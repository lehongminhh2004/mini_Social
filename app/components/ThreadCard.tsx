import Link from 'next/link';
import type { Post } from '@/app/lib/types';
import ReactionButton from './ReactionButton';

interface ThreadCardProps {
  thread: Post;
}

export default function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <article className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{thread.authorName}</p>
          <p className="text-xs text-gray-500">@{thread.authorUsername}</p>
        </div>
        <p className="text-xs text-gray-500">{new Date(thread.createdAt).toLocaleString('vi-VN')}</p>
      </div>

      <Link href={`/thread/${thread.id}`} className="block text-gray-900 leading-relaxed hover:underline">
        {thread.content}
      </Link>

      <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
        <ReactionButton />
        <span>💬 {thread.totalComments}</span>
        <span>🔁 {thread.totalShares}</span>
        <span>❤️ {thread.totalReactions}</span>
      </div>
    </article>
  );
}
