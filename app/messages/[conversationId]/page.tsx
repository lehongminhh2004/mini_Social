import Sidebar from '@/app/components/Sidebar';
import ChatWindow from '@/app/components/ChatWindow';
import { mockConversations, mockMessages } from '@/app/lib/mock-data';

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const conversation = mockConversations.find((item) => item.id === params.conversationId) ?? mockConversations[0];

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Chat với {conversation.participant.name}</h1>
          <ChatWindow conversationId={conversation.id} messages={mockMessages} />
        </section>
      </div>
    </main>
  );
}
