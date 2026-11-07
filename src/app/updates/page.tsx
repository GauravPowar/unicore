// ============================================================
// /updates – ResearchSetu Official Broadcast Channel & Team Updates
// Public broadcast feed for releases, new features, and changelogs.
// Admin-only broadcasting and Admin Team permission management.
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { formatRelativeDate } from '@/lib/utils';
import {
  Radio,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Send,
  Plus,
  X,
  Check,
  Trash2,
  ExternalLink,
  Users,
  Megaphone,
} from 'lucide-react';
import type { Post, Profile } from '@/types';

interface AdminMember {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string | null;
  institution?: string;
  department?: string | null;
  isRootAdmin: boolean;
  role: string;
}

interface CandidateResearcher {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string | null;
  institution?: string | null;
  department?: string | null;
  isAdmin: boolean;
}

export default function UpdatesPage() {
  const { user } = useAuth();

  const [broadcasts, setBroadcasts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin access state
  const [isCallerAdmin, setIsCallerAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [candidates, setCandidates] = useState<CandidateResearcher[]>([]);

  // Modals & form state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAdminTeamModal, setShowAdminTeamModal] = useState(false);

  // Broadcast composer state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Admin addition state
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);

  // Load broadcasts from /api/broadcast
  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/broadcast');
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts || []);
      }
    } catch (err) {
      console.warn('Could not load broadcasts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load admin team data from /api/admin/team
  const fetchAdminTeam = async () => {
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setIsCallerAdmin(data.isCallerAdmin || false);
        setAdmins(data.admins || []);
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.warn('Could not check admin privileges:', err);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    fetchAdminTeam();
  }, [user]);

  // Handle publishing a new team update broadcast
  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim() || isPublishing) return;

    setIsPublishing(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle.trim() || 'Team Announcement',
          content_markdown: broadcastContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.broadcast) {
          setBroadcasts((prev) => [data.broadcast, ...prev]);
        }
        setBroadcastTitle('');
        setBroadcastContent('');
        setShowBroadcastModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to publish broadcast');
      }
    } catch {
      alert('Network error while broadcasting update.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle adding an existing researcher to the admin team
  const handleAddAdmin = async () => {
    if (!selectedCandidateId || isUpdatingAdmin) return;

    setIsUpdatingAdmin(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: selectedCandidateId }),
      });

      if (res.ok) {
        await fetchAdminTeam();
        setSelectedCandidateId('');
        alert('Researcher successfully promoted to Admin Team!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add admin');
      }
    } catch {
      alert('Network error while updating admin team.');
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  // Handle removing a member from the admin team
  const handleRemoveAdmin = async (targetUserId: string, name: string) => {
    const confirmed = window.confirm(`Revoke admin privileges from ${name}?`);
    if (!confirmed) return;

    setIsUpdatingAdmin(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        await fetchAdminTeam();
        alert(`Revoked admin privileges from ${name}.`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove admin');
      }
    } catch {
      alert('Network error while removing admin.');
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* ── Channel Header ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-white/15 backdrop-blur-md border border-white/20 text-white">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Official Broadcast Channel
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ResearchSetu Team Updates &amp; Releases
          </h1>

          <p className="text-xs sm:text-sm text-brand-100 max-w-xl leading-relaxed">
            The official log of new platform features, architectural upgrades, and community milestones direct from the core developer team.
          </p>

          {/* Admin Control Bar */}
          {isCallerAdmin && (
            <div className="pt-3 flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBroadcastModal(true)}
                className="gap-1.5 text-xs bg-white text-brand-800 hover:bg-brand-50 border-0 font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Broadcast New Update
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAdminTeamModal(true)}
                className="gap-1.5 text-xs bg-brand-900/40 text-white hover:bg-brand-900/60 border border-white/20"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Manage Admin Team ({admins.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Broadcast Timeline Feed ────────────────────────── */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            Loading team broadcasts...
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <Megaphone className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No broadcasts published yet
            </p>
            <p className="text-xs text-slate-500">
              Check back soon for news regarding feature drops and system updates.
            </p>
          </div>
        ) : (
          broadcasts.map((post) => {
            const author = post.author as Profile | undefined;
            return (
              <article
                key={post.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-brand-400/50 transition-all space-y-4"
              >
                {/* Broadcast meta header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={author?.full_name || 'ResearchSetu Team'}
                      src={author?.avatar_url}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {author?.full_name || 'ResearchSetu Core Team'}
                        </span>
                        <VerifiedBadge />
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          Team Broadcast
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {author?.institution || 'Platform Administration'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {formatRelativeDate(post.created_at)}
                  </span>
                </div>

                {/* Broadcast Title */}
                {post.title && (
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </h2>
                )}

                {/* Content */}
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  <MarkdownContent content={post.content_markdown} />
                </div>

                {/* Footer Link */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500">
                    Broadcast ID: {post.id.slice(0, 8)}
                  </span>
                  <Link
                    href={`/post/${post.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    View &amp; Discuss <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ── Broadcast Composer Modal ───────────────────────── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-brand-500" />
                Publish Team Broadcast
              </h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Update Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ResearchSetu v1.3: Realtime Protocol Sharing Released"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Announcement &amp; Release Notes (Markdown &amp; LaTeX supported)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Describe the new features, architecture changes, bug fixes, or upcoming milestones..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBroadcastModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPublishing}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Broadcast to Network
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Admin Team Management Modal ────────────────────── */}
      {showAdminTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Admin Team Permissions
                </h3>
              </div>
              <button
                onClick={() => setShowAdminTeamModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Admins have permissions to broadcast official announcements, manage specialized forums, and delegate admin privileges to colleagues.
            </p>

            {/* Current Admins List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Current Admins ({admins.length})
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-3 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={admin.full_name} src={admin.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {admin.full_name}
                          </p>
                          <VerifiedBadge />
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {admin.email || admin.institution}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          admin.isRootAdmin
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {admin.role}
                      </span>

                      {!admin.isRootAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(admin.id, admin.full_name)}
                          disabled={isUpdatingAdmin}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Admin Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-brand-500" />
                Add Member to Admin Team
              </h4>
              <div className="flex gap-2">
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select registered researcher to promote...</option>
                  {candidates
                    .filter((c) => !c.isAdmin)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email || c.institution || 'Researcher'})
                      </option>
                    ))}
                </select>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddAdmin}
                  disabled={!selectedCandidateId || isUpdatingAdmin}
                  isLoading={isUpdatingAdmin}
                  className="gap-1 text-xs shrink-0"
                >
                  <Check className="w-3.5 h-3.5" /> Grant Access
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAdminTeamModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
