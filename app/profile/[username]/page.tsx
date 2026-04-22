import Sidebar from '@/app/components/Sidebar';
import FollowButton from '@/app/components/FollowButton';
import ThreadCard from '@/app/components/ThreadCard';
import { mockThreads, mockUsers } from '@/app/lib/mock-data';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const user = mockUsers.find((item) => item.username === params.username) ?? mockUsers[0];
  const userThreads = mockThreads.filter((item) => item.author.username === user.username);

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
              <p className="text-sm text-gray-500 mt-1">
                {user.followers} followers · {user.following} following
              </p>
            </div>
            <FollowButton />
          </div>

          {userThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </section>
      </div>
    </main>
  );
}
