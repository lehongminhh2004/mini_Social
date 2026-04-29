'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComposePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home and trigger the composer (if we implement query-based modal)
    // For now, just go home.
    router.push('/?compose=true');
  }, [router]);

  return <div className="min-h-screen bg-background" />;
}
