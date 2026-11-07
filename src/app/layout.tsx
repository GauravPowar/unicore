// ============================================================
// Root Layout — ResearchSetu App Router
// ============================================================
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'ResearchSetu — Indian Interdisciplinary Researcher Network',
    template: '%s | ResearchSetu',
  },
  description:
    'Connecting scientists, professors, and PhD scholars across India with LaTeX micro-thoughts, niche lab forums, and collaboration matching.',
  keywords: [
    'research',
    'India',
    'academia',
    'science',
    'collaboration',
    'ORCID',
    'IISc',
    'IIT',
    'TIFR',
    'CSIR',
  ],
  openGraph: {
    title: 'ResearchSetu — Indian Interdisciplinary Researcher Network',
    description:
      'Connect across disciplines, post LaTeX equations, troubleshoot wet/dry protocols, and find co-authors across India.',
    siteName: 'ResearchSetu',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResearchSetu — Indian Interdisciplinary Researcher Network',
    description:
      'Connect across disciplines, post LaTeX equations, troubleshoot wet/dry protocols, and find co-authors across India.',
  },
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
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
