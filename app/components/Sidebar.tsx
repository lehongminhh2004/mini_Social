'use client';

import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

const staticLinks = [
  { href: '/', label: 'Timeline', emoji: '🏠' },
  { href: '/explore', label: 'Explore', emoji: '🔎' },
  { href: '/messages', label: 'Messages', emoji: '💬' },
  { href: '/notifications', label: 'Notifications', emoji: '🔔' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">MiniSocial</h2>
      <nav className="space-y-2">
        {staticLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            <span>{link.emoji}</span>
            <span className="font-medium">{link.label}</span>
          </Link>
        ))}
        <Link
          href={user ? `/profile/${user.username}` : '/profile'}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          <span>👤</span>
          <span className="font-medium">Profile</span>
        </Link>
      </nav>
    </aside>
  );
}
