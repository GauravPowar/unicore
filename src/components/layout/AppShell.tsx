// ============================================================
// AppShell – sidebar + main content layout
// Client Component (needs usePathname for active nav links)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  MessageSquare,
  FlaskConical,
  BookOpen,
  TrendingUp,
  Wrench,
  FileSearch,
  Globe,
  Menu,
  X,
  AtSign,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ShareModal } from '@/components/ui/ShareModal';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import { OFFICIAL_FORUMS } from '@/lib/constants';
import { CreateForumModal } from '@/components/forums/CreateForumModal';
import type { Forum } from '@/types';

const PRIMARY_NAV = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/directory', label: 'Researchers', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

const FORUM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'general': MessageSquare,
  'computational-biology': FlaskConical,
  'climate-earth-science': Globe,
  'grant-watch-india': TrendingUp,
  'protocol-troubleshooting': Wrench,
  'materials-nanoscience': BookOpen,
  'open-science-india': FileSearch,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createForumOpen, setCreateForumOpen] = useState(false);
  const [forums, setForums] = useState<Forum[]>(OFFICIAL_FORUMS);
  const { profile, signOut } = useAuth();
  const currentUser = profile;

  useEffect(() => {
    fetch('/api/forums')
      .then((r) => r.json())
      .then((d) => {
        if (d.forums?.length) {
          setForums(d.forums);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-64 flex flex-col',
          'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-saffron-500 flex items-center justify-center">
            <AtSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-lg">Uni</span>
            <span className="font-bold text-brand-500 text-lg">Core</span>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}

          {/* Forums section */}
          <div className="pt-4 pb-1 px-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Forums
            </p>
            <button
              onClick={() => setCreateForumOpen(true)}
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 font-medium px-1.5 py-0.5 rounded hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
              title="Create new specialized forum"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          {forums.map((forum) => {
            const Icon = FORUM_ICONS[forum.slug] ?? BookOpen;
            const href = `/forums/${forum.slug}`;
            return (
              <Link
                key={forum.id}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  pathname === href
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                )}
                title={forum.description ?? undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{forum.name}</span>
              </Link>
            );
          })}
          {/* Active Researcher Profile Card */}
          <div className="pt-3 pb-1 px-3">
            {currentUser ? (
              <div className="space-y-2">
                <Link
                  href={`/profile/${currentUser.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700/50"
                >
                  <Avatar name={currentUser.full_name} src={currentUser.avatar_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {currentUser.full_name}
                      </p>
                      {currentUser.is_verified_researcher && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Verified Researcher" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {currentUser.institution || 'UniCore Researcher'}
                    </p>
                  </div>
                </Link>

                <div className="flex justify-between items-center px-1 text-[11px]">
                  <Link
                    href={`/profile/${currentUser.id}`}
                    className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
                  >
                    View Profile
                  </Link>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    onClick={() => signOut()}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-center space-y-2">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Join the Network
                </p>
                <div className="flex gap-2 justify-center text-xs">
                  <Link
                    href="/login"
                    className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 py-1 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            🇮🇳 Made for Indian Research
          </span>
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (visible on all screens) */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm lg:hidden">
                UniCore
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/40">
                🇮🇳 Indian Academic Beta
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareModal />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </div>

      <CreateForumModal
        isOpen={createForumOpen}
        onClose={() => setCreateForumOpen(false)}
        onForumCreated={(newForum) => {
          setForums((prev) => [...prev.filter((f) => f.id !== newForum.id), newForum]);
        }}
      />
    </div>
  );
}

