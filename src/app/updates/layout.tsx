// ============================================================
// /updates/layout.tsx – Layout & Metadata for Broadcast Channel
// ============================================================
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Official Broadcast Channel & Team Updates | ResearchSetu',
  description:
    'The official log of new platform features, architectural upgrades, and community milestones direct from the core developer team.',
  openGraph: {
    title: 'ResearchSetu Official Broadcast Channel',
    description:
      'The official log of new platform features, architectural upgrades, and community milestones direct from the core developer team.',
    siteName: 'ResearchSetu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResearchSetu Official Broadcast Channel',
    description:
      'The official log of new platform features, architectural upgrades, and community milestones direct from the core developer team.',
  },
};

export default function UpdatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
