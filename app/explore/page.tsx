import Sidebar from '../components/Sidebar';
import ThreadCard from '../components/ThreadCard';
import { mockThreads } from '../lib/mock-data';

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
          {mockThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </section>
      </div>
    </main>
  );
}
