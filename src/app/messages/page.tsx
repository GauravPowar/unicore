// ============================================================
// /messages – Real-Time DMs page (Server Component wrapper)
// ============================================================
import type { Metadata } from 'next';
import { MessagesClient } from '@/components/messages/MessagesClient';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Direct messages with fellow researchers',
};

export default function MessagesPage() {
  return <MessagesClient />;
}

