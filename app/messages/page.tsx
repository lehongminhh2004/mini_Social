import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { mockConversations } from '../lib/mock-data';

export default function MessagesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 bg-white rounded-xl shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="space-y-2">
            {mockConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <p className="font-semibold text-gray-900">{conversation.participant.name}</p>
                <p className="text-sm text-gray-600">{conversation.lastMessage}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
