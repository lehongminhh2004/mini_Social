import Sidebar from '../components/Sidebar';
import { mockNotifications } from '../lib/mock-data';

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <Sidebar />
        <section className="md:col-span-3 bg-white rounded-xl shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
          <div className="space-y-2">
            {mockNotifications.map((item) => (
              <div key={item.id} className={`p-3 rounded-lg border ${item.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'}`}>
                <p className="text-sm text-gray-900">{item.message}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
