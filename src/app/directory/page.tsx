// ============================================================
// /directory – Researcher Directory (Server Component wrapper)
// ============================================================
import type { Metadata } from 'next';
import { mockData } from '@/lib/mock-data';
import { DirectoryClient } from '@/components/directory/DirectoryClient';

export const metadata: Metadata = {
  title: 'Researcher Directory',
  description: 'Find and connect with Indian researchers by institution, discipline, and skills',
};

export default function DirectoryPage() {
  const profiles = mockData.getProfiles();
  return <DirectoryClient profiles={profiles} />;
}
