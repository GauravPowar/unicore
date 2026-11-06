// ============================================================
// /messages – Real-Time DMs page (Server Component wrapper)
// Wrapped in Suspense for useSearchParams client compatibility
// ============================================================
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MessagesClient } from '@/components/messages/MessagesClient';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Direct messages and coffee chat requests with fellow researchers',
};

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-10rem)] flex items-center justify-center text-slate-400">
          Loading messages...
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
