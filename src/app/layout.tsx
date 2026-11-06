// ============================================================
// Root Layout — ShodhConnect App Router
// ============================================================
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'ShodhConnect',
    template: '%s | ShodhConnect',
  },
  description:
    'The interdisciplinary researcher network connecting scientists and academics across India.',
  keywords: ['research', 'India', 'academia', 'science', 'collaboration', 'ORCID'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
