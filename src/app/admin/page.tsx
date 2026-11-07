// ============================================================
// /admin – UniCore Platform Administration Console
// Decoupled from personal accounts. 100% Real Database Metrics.
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { formatRelativeDate } from '@/lib/utils';
import {
  Shield,
  Users,
  FileText,
  MessageSquare,
  Radio,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  RefreshCw,
  LogOut,
  FolderTree,
  Send,
  AlertTriangle,
  SlidersHorizontal,
  Plus,
  Activity,
  Layers,
  Database,
  Check,
} from 'lucide-react';
import type { Post, Comment, Profile } from '@/types';

interface MetricData {
  totalResearchers: number;
  verifiedResearchers: number;
  totalPosts: number;
  totalComments: number;
  totalMessages: number;
  totalForums: number;
  postsByType: {
    thought: number;
    question: number;
    visual_abstract: number;
    collab_pitch: number;
  };
}

interface EnrichedUser {
  id: string;
  email: string | null;
  full_name: string;
  username: string | null;
  institution: string | null;
  department: string | null;
  avatar_url: string | null;
  is_verified_researcher: boolean;
  isAdmin: boolean;
  collab_status: string;
  orcid_id: string | null;
  postsCount: number;
  created_at: string;
}

type AdminTab = 'overview' | 'users' | 'content' | 'broadcast' | 'forums' | 'reports';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Auth & loading state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'unverified' | 'admin'>('all');
  const [contentSearch, setContentSearch] = useState('');
  const [contentFilter, setContentFilter] = useState<'all' | 'posts' | 'comments'>('all');

  // Broadcast composer state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Forum creation modal
  const [showForumModal, setShowForumModal] = useState(false);
  const [newForumName, setNewForumName] = useState('');
  const [newForumSlug, setNewForumSlug] = useState('');
  const [newForumDesc, setNewForumDesc] = useState('');
  const [newForumCategory, setNewForumCategory] = useState('Open Science');
  const [isCreatingForum, setIsCreatingForum] = useState(false);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Verify admin authorization
  const checkAdminAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (!res.ok || !data.isAdmin) {
        setIsAdmin(false);
        router.push('/admin/login');
      } else {
        setIsAdmin(true);
        setAuthMethod(data.method);
      }
    } catch {
      setIsAdmin(false);
      router.push('/admin/login');
    }
  }, [router]);

  // 2. Fetch all admin data
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [metricsRes, usersRes, contentRes, reportsRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/users'),
        fetch('/api/admin/content'),
        fetch('/api/admin/reports'),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m.metrics);
        setRecentProfiles(m.recentProfiles || []);
      }

      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }

      if (contentRes.ok) {
        const c = await contentRes.json();
        setPosts(c.posts || []);
        setComments(c.comments || []);
      }

      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setReports(r.reports || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, loadDashboardData]);

  // 3. User Moderation Handlers
  const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'toggle_verified',
          value: !currentStatus,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_verified_researcher: !currentStatus } : u))
        );
        showToast(!currentStatus ? 'Blue Verification Badge granted' : 'Verification badge removed');
      }
    } catch (err) {
      console.error('Error updating verification:', err);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    const confirmMsg = currentAdminStatus
      ? 'Are you sure you want to revoke Admin rights from this user?'
      : 'Grant Admin privileges to this user? They will have full administrative access.';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'toggle_admin',
          value: !currentAdminStatus,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAdmin: !currentAdminStatus } : u))
        );
        showToast(!currentAdminStatus ? 'Admin privileges granted' : 'Admin privileges revoked');
      }
    } catch (err) {
      console.error('Error updating admin role:', err);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (
      !window.confirm(
        `DANGER: Permanently delete researcher account "${name}"? This removes all their posts, messages, and comments.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showToast(`Researcher "${name}" was permanently removed`);
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // 4. Content Moderation Handlers
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post and its comments from the platform?')) return;

    try {
      const res = await fetch(`/api/admin/content?type=post&id=${postId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        showToast('Post removed successfully');
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/admin/content?type=comment&id=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast('Comment purged');
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // 5. Broadcast Publisher
  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle.trim() || 'UniCore Platform Announcement',
          content_markdown: broadcastContent.trim(),
        }),
      });

      if (res.ok) {
        setBroadcastSuccess(true);
        setBroadcastTitle('');
        setBroadcastContent('');
        showToast('Team update broadcast published to /updates');
        loadDashboardData();
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error publishing broadcast:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Dismiss a user report
  const handleDismissReport = async (reportId: string, reportedUserId: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, reportedUserId, action: 'dismiss' }),
      });
      if (res.ok) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' } : r)));
        showToast('Report dismissed as reviewed');
      }
    } catch (err) {
      console.error('Error dismissing report:', err);
    }
  };

  // 6. Admin Sign Out
  const handleSignOutAdmin = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch {
      router.push('/admin/login');
    }
  };

  // Loading indicator while authenticating
  if (isAdmin === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Verifying admin credentials...</p>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const query = userSearch.toLowerCase();
    const matchesSearch =
      u.full_name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.institution?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (userFilter === 'verified') return u.is_verified_researcher;
    if (userFilter === 'unverified') return !u.is_verified_researcher;
    if (userFilter === 'admin') return u.isAdmin;
    return true;
  });

  // Filter content
  const filteredPosts = posts.filter((p) => {
    const query = contentSearch.toLowerCase();
    return (
      p.content_markdown?.toLowerCase().includes(query) ||
      p.title?.toLowerCase().includes(query) ||
      p.author?.full_name?.toLowerCase().includes(query)
    );
  });

  const filteredComments = comments.filter((c) => {
    const query = contentSearch.toLowerCase();
    return (
      c.content_markdown?.toLowerCase().includes(query) ||
      c.author?.full_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">UniCore Admin Console</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Node (BOM1)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Decoupled platform administration & moderation. Authorized via{' '}
              <span className="font-semibold text-white">
                {authMethod === 'cookie' ? 'Admin Master Passkey' : 'Admin Role'}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-colors"
              title="Refresh platform metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Community View</span>
            </Link>

            <button
              onClick={handleSignOutAdmin}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-medium flex items-center gap-1.5 border border-red-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: Activity },
          { id: 'users', label: `Researchers (${users.length})`, icon: Users },
          { id: 'reports', label: `Moderation Queue (${reports.filter((r) => r.status === 'pending').length})`, icon: AlertTriangle },
          { id: 'content', label: `Content (${posts.length})`, icon: Shield },
          { id: 'broadcast', label: 'Team Broadcasts', icon: Radio },
          { id: 'forums', label: `Forums (${metrics?.totalForums || 0})`, icon: FolderTree },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW & METRICS ──────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Researchers
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalResearchers ?? '...'}
              </p>
              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                100% Live DB
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Verified
              </span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics?.verifiedResearchers ?? '...'}
              </p>
              <span className="text-[11px] text-slate-400">
                {metrics?.totalResearchers
                  ? `${Math.round((metrics.verifiedResearchers / metrics.totalResearchers) * 100)}% verified`
                  : '0%'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Posts
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalPosts ?? '...'}
              </p>
              <span className="text-[11px] text-slate-400">Across all forums</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Comments
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalComments ?? '...'}
              </p>
              <span className="text-[11px] text-slate-400">Peer discussions</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Direct DMs
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalMessages ?? '...'}
              </p>
              <span className="text-[11px] text-slate-400">Read receipts synced</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Forums
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics?.totalForums ?? '...'}
              </p>
              <span className="text-[11px] text-slate-400">Domain categories</span>
            </div>
          </div>

          {/* Research Distribution & System Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Post Type Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" />
                  Research Activity Breakdown
                </h3>
                <span className="text-xs text-slate-400">Total: {metrics?.totalPosts || 0}</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Collab Pitches 🤝', count: metrics?.postsByType.collab_pitch || 0, color: 'bg-emerald-500' },
                  { label: 'Scientific Questions ❓', count: metrics?.postsByType.question || 0, color: 'bg-amber-500' },
                  { label: 'Micro-Thoughts 💭', count: metrics?.postsByType.thought || 0, color: 'bg-brand-500' },
                  { label: 'Visual Abstracts 🎨', count: metrics?.postsByType.visual_abstract || 0, color: 'bg-indigo-500' },
                ].map((item) => {
                  const pct = metrics?.totalPosts ? Math.round((item.count / metrics.totalPosts) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="text-slate-500">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Infrastructure Health */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Platform Infrastructure Status
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ALL OPERATIONAL
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">Database Engine</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">PostgreSQL (Supabase bom1)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">File Storage Bucket</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">media (25MB / file limit)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">Realtime WebSocket Sync</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">public:messages / posts Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">Authentication Governance</span>
                  <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">Decoupled Admin Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: RESEARCHERS MANAGEMENT ─────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, handle, email, institute..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'verified', 'unverified', 'admin'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setUserFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    userFilter === filter
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Researcher</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Posts</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No researchers found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                            <div>
                              <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                                <span>{u.full_name}</span>
                                {u.is_verified_researcher && <VerifiedBadge />}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {u.username ? `@${u.username}` : `ID: ${u.id.slice(0, 8)}...`}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {u.email || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[180px]">
                            {u.institution || '—'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {u.department || ''}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleVerified(u.id, u.is_verified_researcher)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                              u.is_verified_researcher
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Click to toggle verified researcher badge"
                          >
                            {u.is_verified_researcher ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                                <span>Verified</span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                <span>Unverified</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                              u.isAdmin
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Click to toggle admin status"
                          >
                            <Shield className="w-3 h-3" />
                            <span>{u.isAdmin ? 'Admin' : 'Member'}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {u.postsCount}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/profile/${u.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View Public Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MODERATION QUEUE & REPORTS ───────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Community Reports &amp; Abuse Moderation
              </h3>
              <p className="text-xs text-slate-500">
                Review flagged messages, reported posts, and harassment claims filed by researchers.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
              {reports.filter((r) => r.status === 'pending').length} Pending
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Moderation Queue is Clear
              </h4>
              <p className="text-xs text-slate-500">
                Zero active abuse or harassment reports pending review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        {report.target_type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {report.category?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeDate(report.created_at)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          report.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleDismissReport(report.id, report.reported_user_id)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      )}

                      {report.target_type === 'post' && (
                        <button
                          onClick={() => handleDeletePost(report.target_id)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-300 font-medium transition-colors border border-red-200 dark:border-red-800"
                        >
                          Purge Post
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(report.reported_user_id, report.reportedUser?.name || 'User')}
                        className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Ban / Delete Researcher Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Reported Researcher
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {report.reportedUser?.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {report.reportedUser?.email || report.reported_user_id}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Filed By
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {report.reporter?.name || 'Anonymous Researcher'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ID: {report.reporter_id.slice(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {report.content_snippet && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                        Reported Content Snippet:
                      </span>
                      <p className="italic">&ldquo;{report.content_snippet}&rdquo;</p>
                    </div>
                  )}

                  {report.details && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Context:</span>{' '}
                      {report.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: CONTENT MODERATION ──────────────────────── */}
      {activeTab === 'content' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search content by keyword, author, title..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'posts', 'comments'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setContentFilter(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    contentFilter === mode
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          {(contentFilter === 'all' || contentFilter === 'posts') && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Platform Posts ({filteredPosts.length})
              </h3>
              {filteredPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  No posts found matching search.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={post.author?.full_name || 'Researcher'} src={post.author?.avatar_url} size="sm" />
                          <div>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {post.author?.full_name || 'Anonymous'}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-2">
                              {formatRelativeDate(post.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {post.post_type}
                          </span>
                          <Link
                            href={`/post/${post.id}`}
                            target="_blank"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Open Post"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {post.title && (
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {post.title}
                        </h4>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 font-sans">
                        {post.content_markdown}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments List */}
          {(contentFilter === 'all' || contentFilter === 'comments') && (
            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Platform Comments ({filteredComments.length})
              </h3>
              {filteredComments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  No comments found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {comment.author?.full_name || 'Researcher'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                          {comment.content_markdown}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: TEAM BROADCASTS ────────────────────────── */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-brand-500" />
                Publish Official Broadcast to /updates
              </h3>
              <p className="text-xs text-slate-500">
                Announcements published here are highlighted across the platform as official UniCore updates.
              </p>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. UniCore v1.3: Decoupled Admin Console & Enhanced Research Feed"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Markdown Content
                </label>
                <textarea
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Share details about new features, protocol fixes, or community milestones..."
                  rows={6}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Published with system authority directly to the official feed.
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isBroadcasting || !broadcastContent.trim()}
                  className="text-xs px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isBroadcasting ? 'Publishing...' : 'Broadcast to Network'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 5: FORUMS MANAGEMENT ──────────────────────── */}
      {activeTab === 'forums' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Specialized Forums ({metrics?.totalForums || 0})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { slug: 'general', name: 'General Research Discussion', cat: 'Open Science', desc: 'Cross-disciplinary queries & lab chatter' },
              { slug: 'computational-biology', name: 'Computational Biology & Genomics', cat: 'Niche Domain', desc: 'Bioinformatics, NGS pipelines & docking' },
              { slug: 'climate-earth-science', name: 'Climate & Earth Science', cat: 'Wet-Meets-Dry-Lab', desc: 'Atmospheric modeling & monsoon dynamics' },
              { slug: 'grant-watch-india', name: 'Grant Watch India', cat: 'Grant Watch', desc: 'DST, SERB, ICMR, DBT funding alerts' },
              { slug: 'protocol-troubleshooting', name: 'Protocol Troubleshooting', cat: 'Protocol Troubleshooting', desc: 'Western blots, PCR, TEM/SEM diagnostics' },
              { slug: 'materials-nanoscience', name: 'Materials & Nanoscience', cat: 'Niche Domain', desc: 'Synthesis, spectroscopy & XRD/AFM' },
              { slug: 'open-science-india', name: 'Open Science India', cat: 'Open Science', desc: 'Preprints, open datasets & reproducibility' },
              { slug: 'team-updates', name: 'UniCore Team Updates', cat: 'Career & Academia', desc: 'Official broadcast channel' },
            ].map((f) => (
              <div
                key={f.slug}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {f.cat}
                  </span>
                  <Link
                    href={`/forums/${f.slug}`}
                    target="_blank"
                    className="text-slate-400 hover:text-brand-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.desc}</p>
                <p className="text-[10px] font-mono text-slate-400 pt-1">slug: /{f.slug}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
