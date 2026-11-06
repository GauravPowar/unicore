// ============================================================
// Root Layout — UniCore App Router
// ============================================================
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'UniCore — Indian Interdisciplinary Researcher Network',
    template: '%s | UniCore',
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
    title: 'UniCore — Indian Interdisciplinary Researcher Network',
    description:
      'Connect across disciplines, post LaTeX equations, troubleshoot wet/dry protocols, and find co-authors across India.',
    siteName: 'UniCore',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniCore — Indian Interdisciplinary Researcher Network',
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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
