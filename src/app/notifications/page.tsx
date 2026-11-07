// ============================================================
// /notifications – Researcher Alerts & Connection Requests
// 100% Live Supabase PostgreSQL (Zero Mock Data)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/Badge';
import { formatRelativeDate } from '@/lib/utils';
import {
  Bell,
  MessageSquare,
  UserPlus,
  ArrowUp,
  Coffee,
  CheckCheck,
  Lock,
  Inbox,
  Sparkles,
} from 'lucide-react';
import type { Profile } from '@/types';

interface NotificationItem {
  id: string;
  type: 'message_request' | 'follow' | 'upvote' | 'comment';
  actorName: string;
  actorAvatar?: string | null;
  actorInstitution?: string | null;
  actorIsVerified?: boolean;
  actorId?: string;
  targetText?: string;
  timestamp: string;
  isRead: boolean;
  actionUrl: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'requests' | 'interactions'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    // Load local read state
    try {
      const stored = localStorage.getItem('unicore_read_notifs');
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadRealNotifications = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const items: NotificationItem[] = [];

        // 1. Fetch user's posts to track upvotes & comments on them
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id, title, content_markdown')
          .eq('author_id', user.id);

        const postMap = new Map<string, string>();
        const postIds: string[] = [];
        if (userPosts && userPosts.length > 0) {
          userPosts.forEach((p) => {
            postIds.push(p.id);
            const titleSnippet = p.title || p.content_markdown.slice(0, 45) + '...';
            postMap.set(p.id, titleSnippet);
          });

          // 2. Fetch upvotes on user's posts by others
          const { data: upvotes } = await supabase
            .from('post_upvotes')
            .select('post_id, user_id, created_at')
            .in('post_id', postIds)
            .neq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(15);

          if (upvotes && upvotes.length > 0) {
            const upvoterIds = Array.from(new Set(upvotes.map((u) => u.user_id)));
            const { data: upvoterProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', upvoterIds);

            const profileLookup = new Map<string, Profile>();
            upvoterProfiles?.forEach((prof) => profileLookup.set(prof.id, prof as Profile));

            upvotes.forEach((u) => {
              const prof = profileLookup.get(u.user_id);
              items.push({
                id: `upvote-${u.post_id}-${u.user_id}`,
                type: 'upvote',
                actorName: prof?.full_name || 'A researcher',
                actorAvatar: prof?.avatar_url,
                actorInstitution: prof?.institution,
                actorIsVerified: prof?.is_verified_researcher,
                actorId: u.user_id,
                targetText: `upvoted your post "${postMap.get(u.post_id)}"`,
                timestamp: u.created_at,
                isRead: false,
                actionUrl: `/post/${u.post_id}`,
              });
            });
          }

          // 3. Fetch comments on user's posts by others
          const { data: comments } = await supabase
            .from('comments')
            .select('id, post_id, author_id, content_markdown, created_at')
            .in('post_id', postIds)
            .neq('author_id', user.id)
            .order('created_at', { ascending: false })
            .limit(15);

          if (comments && comments.length > 0) {
            const commenterIds = Array.from(new Set(comments.map((c) => c.author_id)));
            const { data: commenterProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', commenterIds);

            const commentProfileLookup = new Map<string, Profile>();
            commenterProfiles?.forEach((prof) => commentProfileLookup.set(prof.id, prof as Profile));

            comments.forEach((c) => {
              const prof = commentProfileLookup.get(c.author_id);
              items.push({
                id: `comment-${c.id}`,
                type: 'comment',
                actorName: prof?.full_name || 'A researcher',
                actorAvatar: prof?.avatar_url,
                actorInstitution: prof?.institution,
                actorIsVerified: prof?.is_verified_researcher,
                actorId: c.author_id,
                targetText: `commented on your post "${postMap.get(c.post_id)}": "${c.content_markdown.slice(0, 50)}..."`,
                timestamp: c.created_at,
                isRead: false,
                actionUrl: `/post/${c.post_id}`,
              });
            });
          }
        }

        // 4. Fetch incoming messages / message requests
        const { data: incomingMessages } = await supabase
          .from('messages')
          .select('id, sender_id, content, created_at, is_read')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (incomingMessages && incomingMessages.length > 0) {
          const senderIds = Array.from(new Set(incomingMessages.map((m) => m.sender_id)));
          const { data: senderProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', senderIds);

          const senderLookup = new Map<string, Profile>();
          senderProfiles?.forEach((prof) => senderLookup.set(prof.id, prof as Profile));

          // Check if current user has replied to sender
          const { data: userSentMessages } = await supabase
            .from('messages')
            .select('receiver_id')
            .eq('sender_id', user.id)
            .in('receiver_id', senderIds);

          const repliedSenderIds = new Set((userSentMessages || []).map((m) => m.receiver_id));
          const acceptedList: string[] = (user.user_metadata?.accepted_requests as string[]) || [];

          // Group by sender (latest message per sender)
          const seenSenders = new Set<string>();
          incomingMessages.forEach((msg) => {
            if (seenSenders.has(msg.sender_id)) return;
            seenSenders.add(msg.sender_id);

            const prof = senderLookup.get(msg.sender_id);
            const isRequest = !repliedSenderIds.has(msg.sender_id) && !acceptedList.includes(msg.sender_id);

            items.push({
              id: `msg-${msg.id}`,
              type: isRequest ? 'message_request' : 'comment',
              actorName: prof?.full_name || 'A researcher',
              actorAvatar: prof?.avatar_url,
              actorInstitution: prof?.institution,
              actorIsVerified: prof?.is_verified_researcher,
              actorId: msg.sender_id,
              targetText: isRequest
                ? `sent you a Message & Collaboration Request: "${msg.content.slice(0, 60)}..."`
                : `sent you a message: "${msg.content.slice(0, 60)}..."`,
              timestamp: msg.created_at,
              isRead: msg.is_read,
              actionUrl: `/messages?to=${msg.sender_id}${isRequest ? '&tab=requests' : ''}`,
            });
          });
        }

        // Sort items by timestamp descending
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(items);
      } catch (err) {
        console.warn('Could not load notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealNotifications();
  }, [user]);

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('unicore_read_notifs', JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

  const isItemRead = (item: NotificationItem) => {
    return item.isRead || readIds.includes(item.id);
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'requests') return n.type === 'message_request';
    if (filter === 'interactions')
      return n.type === 'upvote' || n.type === 'comment' || n.type === 'follow';
    return true;
  });

  const unreadCount = notifications.filter((n) => !isItemRead(n)).length;

  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Researcher Notifications
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Sign in with your researcher email to see incoming collaboration requests, peer citations, and post upvotes.
        </p>
        <div className="pt-3 flex justify-center gap-3">
          <Link href="/login">
            <Button variant="primary" size="md">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary" size="md">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-slate-500">Live alerts for peer interactions &amp; message requests</p>
          </div>
          {unreadCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-semibold ml-2">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800 pb-2">
        {(['all', 'requests', 'interactions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-brand-500 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'requests' ? 'Message Requests' : tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            Loading real-time notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              All caught up!
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When researchers send you collaboration message requests, upvote your micro-thoughts, or comment on your publications, you’ll be alerted here.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link href="/">
                <Button variant="secondary" size="sm" className="text-xs">
                  Browse Feed
                </Button>
              </Link>
              <Link href="/directory">
                <Button variant="primary" size="sm" className="text-xs">
                  Discover Researchers
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          filtered.map((item) => {
            const read = isItemRead(item);
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all ${
                  !read
                    ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/50 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Type Icon indicator */}
                <div className="shrink-0 mt-0.5">
                  {item.type === 'message_request' && (
                    <div className="w-9 h-9 rounded-full bg-saffron-100 dark:bg-saffron-950/70 text-saffron-600 dark:text-saffron-400 flex items-center justify-center">
                      <Coffee className="w-4 h-4" />
                    </div>
                  )}
                  {item.type === 'follow' && (
                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  )}
                  {item.type === 'upvote' && (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                  )}
                  {item.type === 'comment' && (
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Avatar name={item.actorName} src={item.actorAvatar} size="sm" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {item.actorName}
                    </span>
                    {item.actorIsVerified && <VerifiedBadge />}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                    {item.targetText}
                  </p>
                  {item.actorInstitution && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.actorInstitution}
                    </p>
                  )}
                  <span className="inline-block text-[10px] text-slate-400 mt-1">
                    {formatRelativeDate(item.timestamp)}
                  </span>
                </div>

                {/* Action CTA */}
                <Link href={item.actionUrl} className="shrink-0 self-center">
                  <Button variant="secondary" size="sm" className="text-xs px-3 py-1">
                    {item.type === 'message_request' ? 'View Request' : 'View'}
                  </Button>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
