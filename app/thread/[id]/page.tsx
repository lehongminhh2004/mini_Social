import Sidebar from '@/app/components/Sidebar';
import ThreadCard from '@/app/components/ThreadCard';
import { mockThreads } from '@/app/lib/mock-data';

interface ThreadDetailPageProps {
  params: {
    id: string;
  };
}

export default function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const thread = mockThreads.find((item) => item.id === params.id) ?? mockThreads[0];
  const replies = mockThreads.filter((item) => item.id !== thread.id).slice(0, 2);

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Thread Detail</h1>
          <ThreadCard thread={thread} />
          <h2 className="font-semibold text-gray-800">Replies</h2>
          {replies.map((reply) => (
            <ThreadCard key={reply.id} thread={reply} />
          ))}
        </section>
      </div>
    </main>
  );
}
