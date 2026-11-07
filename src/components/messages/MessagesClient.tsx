// ============================================================
// MessagesClient – 1-on-1 Realtime DM UI with Message Requests
// 100% Live Supabase PostgreSQL + Realtime (Zero Mock Data)
// Full support for incoming Message Requests, Accept/Decline,
// and Image/Figure attachments via /api/upload
// ============================================================
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeDate, createClientId, cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { screenContent } from '@/lib/moderation';
import {
  showWebNotification,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '@/lib/webNotifications';
import { GifPicker } from '@/components/ui/GifPicker';
import { ReportModal } from '@/components/ui/ReportModal';
import {
  Send,
  MessageSquare,
  Coffee,
  Lock,
  Paperclip,
  Camera,
  Flag,
  Bell,
  X,
  Check,
  CheckCheck,
  Inbox,
  ShieldAlert,
  Search,
  ExternalLink,
  Clock,
  UserCheck,
} from 'lucide-react';
import type { Message, Profile } from '@/types';

export function MessagesClient() {
  const searchParams = useSearchParams();
  const toUserId = searchParams.get('to');
  const preset = searchParams.get('preset');
  const tabParam = searchParams.get('tab');
  const isReqParam = searchParams.get('req') === '1';

  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'direct' | 'requests'>(
    tabParam === 'requests' ? 'requests' : 'direct'
  );
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(toUserId || '');
  const [inputValue, setInputValue] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Persisted accept & ignore sets
  const [acceptedList, setAcceptedList] = useState<string[]>([]);
  const [ignoredList, setIgnoredList] = useState<string[]>([]);

  // Image attachment state
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAcceptingRequest, setIsAcceptingRequest] = useState(false);

  // Camera & GIF picker state
  const [showGifPicker, setShowGifPicker] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Content moderation & reporting state
  const [reportTarget, setReportTarget] = useState<{
    reportedUserId: string;
    targetType: 'message' | 'post';
    targetId: string;
    contentSnippet?: string;
    reportedUserName?: string;
  } | null>(null);

  // Web notification permission state
  const [notifPermission, setNotifPermission] = useState<string>('default');

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotifPermission(getNotificationPermission());
    }
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's accepted & ignored list from server
  useEffect(() => {
    if (!user) return;
    fetch('/api/messages/requests')
      .then((r) => r.json())
      .then((d) => {
        if (d.accepted) setAcceptedList(d.accepted);
        if (d.ignored) setIgnoredList(d.ignored);
      })
      .catch(() => {});
  }, [user]);

  // Load registered researchers from Supabase
  useEffect(() => {
    if (!user) return;

    const loadProfiles = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('full_name', { ascending: true });

        if (!error && data) {
          setAllProfiles(data as Profile[]);
          if (!selectedPartnerId && data.length > 0) {
            setSelectedPartnerId(toUserId || data[0].id);
          }
        }
      } catch (err) {
        console.warn('Could not load profiles for messages:', err);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    loadProfiles();
  }, [user, toUserId, selectedPartnerId]);

  // Fetch real historical messages from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data as unknown as Message[]);
        }
      } catch (err) {
        console.warn('Could not load message history:', err);
      }
    };

    fetchMessages();
  }, [user]);

  // Supabase Realtime subscription (INSERT + UPDATE for live read receipts)
  useEffect(() => {
    if (!user) return;

    try {
      const supabase = createClient();
      const channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newRow = payload.new as Message;
            if (newRow.receiver_id === user.id || newRow.sender_id === user.id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newRow.id)) return prev;
                return [...prev, newRow];
              });
            }

            // Trigger native Desktop/Mobile Web Notification
            if (newRow.receiver_id === user.id && typeof document !== 'undefined') {
              if (document.visibilityState === 'hidden' || selectedPartnerId !== newRow.sender_id) {
                const sender = allProfiles.find((p) => p.id === newRow.sender_id);
                showWebNotification({
                  title: `💬 Message from ${sender?.full_name || 'Researcher'}`,
                  body: newRow.content || 'Sent an attachment',
                  icon: sender?.avatar_url || '/favicon.ico',
                  url: `/messages?to=${newRow.sender_id}`,
                  tag: `researchsetu-msg-${newRow.sender_id}`,
                });
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const updatedRow = payload.new as Message;
            if (updatedRow.receiver_id === user.id || updatedRow.sender_id === user.id) {
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedRow.id ? { ...m, is_read: updatedRow.is_read } : m))
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription error:', err);
    }
  }, [user]);

  const activeConversation = allProfiles.find((p) => p.id === selectedPartnerId) || null;

  // Auto-mark incoming unread messages as read when viewing conversation
  useEffect(() => {
    if (!user || !activeConversation) return;

    const unreadFromPartner = messages.filter(
      (m) => m.receiver_id === user.id && m.sender_id === activeConversation.id && !m.is_read
    );

    if (unreadFromPartner.length > 0) {
      // 1. Optimistic update in local state
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver_id === user.id && m.sender_id === activeConversation.id ? { ...m, is_read: true } : m
        )
      );

      // 2. Dispatch custom event so AppShell resets badge counter immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('researchsetu:messages_read', { detail: { partnerId: activeConversation.id } })
        );
        window.dispatchEvent(
          new CustomEvent('unicore:messages_read', { detail: { partnerId: activeConversation.id } })
        );
      }

      // 3. Persist to server via API
      fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: activeConversation.id }),
      }).catch((err) => console.warn('Failed to mark messages read:', err));
    }
  }, [user, activeConversation, messages]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartnerId]);

  // Preset coffee chat message
  useEffect(() => {
    if (preset === 'coffee_chat' && activeConversation) {
      setInputValue(
        `Hi ${activeConversation.full_name.split(' ')[0]}! I saw your research profile on ResearchSetu and would love to connect for a quick 15-minute virtual coffee chat to explore collaborative ideas.`
      );
    }
  }, [preset, activeConversation]);

  // Segregate conversation partners into Direct Messages vs Message Requests
  const { directPartners, requestPartners } = useMemo(() => {
    if (!user) return { directPartners: [], requestPartners: [] };

    const direct: Profile[] = [];
    const requests: Profile[] = [];

    allProfiles.forEach((person) => {
      if (ignoredList.includes(person.id)) return;

      const sentToPerson = messages.filter(
        (m) => m.sender_id === user.id && m.receiver_id === person.id
      ).length;
      const receivedFromPerson = messages.filter(
        (m) => m.sender_id === person.id && m.receiver_id === user.id
      ).length;

      const isExplicitlyAccepted = acceptedList.includes(person.id);

      if (receivedFromPerson > 0 && sentToPerson === 0 && !isExplicitlyAccepted) {
        // Someone messaged current user first, and user has not replied/accepted yet
        requests.push(person);
      } else {
        // Mutual conversation, sender-initiated thread, or accepted
        direct.push(person);
      }
    });

    return { directPartners: direct, requestPartners: requests };
  }, [user, allProfiles, messages, acceptedList, ignoredList]);

  // Auto-switch to requests tab if user has pending requests and no direct conversation selected
  useEffect(() => {
    if (tabParam === 'requests') {
      setActiveTab('requests');
      if (toUserId) setSelectedPartnerId(toUserId);
    }
  }, [tabParam, toUserId]);

  // Check if active conversation is an incoming request for the current user
  const isIncomingRequest = useMemo(() => {
    if (!user || !activeConversation) return false;
    if (acceptedList.includes(activeConversation.id)) return false;

    const sentToPerson = messages.filter(
      (m) => m.sender_id === user.id && m.receiver_id === activeConversation.id
    ).length;
    const receivedFromPerson = messages.filter(
      (m) => m.sender_id === activeConversation.id && m.receiver_id === user.id
    ).length;

    return receivedFromPerson > 0 && sentToPerson === 0;
  }, [user, activeConversation, messages, acceptedList]);

  // Check if active conversation is an outgoing request sent by current user
  const isOutgoingRequest = useMemo(() => {
    if (!user || !activeConversation) return false;

    const sentToPerson = messages.filter(
      (m) => m.sender_id === user.id && m.receiver_id === activeConversation.id
    ).length;
    const receivedFromPerson = messages.filter(
      (m) => m.sender_id === activeConversation.id && m.receiver_id === user.id
    ).length;

    return (sentToPerson > 0 && receivedFromPerson === 0) || (sentToPerson === 0 && isReqParam);
  }, [user, activeConversation, messages, isReqParam]);

  // Filter partners by search query
  const displayedPartners = (activeTab === 'direct' ? directPartners : requestPartners).filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.institution && p.institution.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Accept a message request
  const handleAcceptRequest = async (partnerId: string) => {
    if (!user || isAcceptingRequest) return;
    setIsAcceptingRequest(true);

    try {
      // 1. Persist to server
      const res = await fetch('/api/messages/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', partnerId }),
      });

      if (res.ok) {
        setAcceptedList((prev) => Array.from(new Set([...prev, partnerId])));
        setActiveTab('direct');
        setSelectedPartnerId(partnerId);
      } else {
        // Fallback local update
        setAcceptedList((prev) => Array.from(new Set([...prev, partnerId])));
        setActiveTab('direct');
        setSelectedPartnerId(partnerId);
      }
    } catch {
      setAcceptedList((prev) => Array.from(new Set([...prev, partnerId])));
      setActiveTab('direct');
      setSelectedPartnerId(partnerId);
    } finally {
      setIsAcceptingRequest(false);
    }
  };

  // Decline / ignore a message request
  const handleDeclineRequest = async (partnerId: string) => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you want to dismiss this message request?');
    if (!confirmed) return;

    try {
      await fetch('/api/messages/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', partnerId }),
      });
      setIgnoredList((prev) => Array.from(new Set([...prev, partnerId])));
      setSelectedPartnerId('');
    } catch {
      setIgnoredList((prev) => Array.from(new Set([...prev, partnerId])));
      setSelectedPartnerId('');
    }
  };

  // Upload an image attachment via /api/upload (compressed with HTML5 canvas to WebP)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // Compress smartphone photo/camera capture to WebP (saves 90% Supabase storage)
      const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.82 });

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setAttachedImageUrl(data.url);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload image');
      }
    } catch {
      alert('Error uploading attachment');
    } finally {
      setIsUploadingImage(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Send message with automated moderation
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !attachedImageUrl) || !activeConversation || !user || !profile) return;

    const content = inputValue.trim();

    // Automated content screening for harassment, scam, or abusive language
    if (content) {
      const modResult = screenContent(content);
      if (!modResult.isClean) {
        alert(
          `Your message was flagged by community safety filters:\n• ${modResult.reasons.join(
            '\n• '
          )}\n\nPlease ensure direct messages remain professional and respectful.`
        );
        return;
      }
    }

    const media_url = attachedImageUrl;
    const tempId = createClientId('msg');

    const newMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeConversation.id,
      content: content || 'Shared an image attachment',
      media_url,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: profile,
      receiver: activeConversation,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setAttachedImageUrl(null);

    // If answering an incoming request by typing a message, auto-accept
    if (isIncomingRequest) {
      handleAcceptRequest(activeConversation.id);
    }

    try {
      const supabase = createClient();
      const { data: dbMsg, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeConversation.id,
          content: content || 'Shared an image attachment',
          media_url,
        })
        .select('*')
        .single();

      if (!error && dbMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (dbMsg as unknown as Message) : m))
        );
      }
    } catch (err) {
      console.error('Message send error:', err);
    }
  };

  const handleQuickCoffeeChat = () => {
    if (!activeConversation) return;
    setInputValue(
      `Hi ${activeConversation.full_name.split(' ')[0]}! Would you be open to a 15-minute virtual coffee chat this week to discuss research overlaps?`
    );
  };

  // Messages for active conversation
  const threadMessages = activeConversation && user
    ? messages.filter(
        (m) =>
          (m.sender_id === user.id && m.receiver_id === activeConversation.id) ||
          (m.sender_id === activeConversation.id && m.receiver_id === user.id)
      )
    : [];

  // Guest State: Sign in required
  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Direct Messages &amp; Requests
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Sign in with your verified researcher email to send message requests, exchange data protocols, and connect across labs.
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
    <div className="h-[calc(100vh-10rem)] min-h-[540px] flex border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* ── Sidebar: researcher list with tabs ────────── */}
      <div className="w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        {/* Header & Tabs */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              Messaging
            </h2>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
              Realtime
            </span>
          </div>

          {/* Pending Requests Alert Banner */}
          {requestPartners.length > 0 && activeTab === 'direct' && (
            <button
              onClick={() => setActiveTab('requests')}
              className="w-full p-2.5 bg-saffron-50 dark:bg-saffron-950/40 border border-saffron-200 dark:border-saffron-900/50 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-all hover:bg-saffron-100/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-saffron-600 shrink-0" />
                <span className="font-semibold text-saffron-950 dark:text-saffron-200 truncate">
                  {requestPartners.length} Pending Message Request{requestPartners.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[10px] bg-saffron-500 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">
                Review →
              </span>
            </button>
          )}

          {/* Direct vs Requests Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('direct')}
              className={cn(
                'py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5',
                activeTab === 'direct'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Inbox className="w-3.5 h-3.5" />
              Direct
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                'py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 relative',
                activeTab === 'requests'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Requests
              {requestPartners.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-saffron-500 text-white">
                  {requestPartners.length}
                </span>
              )}
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search researchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoadingProfiles ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading researchers...</div>
          ) : displayedPartners.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              {activeTab === 'requests' ? (
                <>
                  <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p>No pending message requests.</p>
                  <p className="text-[11px] text-slate-500">
                    When researchers outside your network reach out, their requests will appear here.
                  </p>
                </>
              ) : (
                <>
                  <p>No active conversations yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Find researchers in the directory to start chatting.
                  </p>
                </>
              )}
            </div>
          ) : (
            displayedPartners.map((person) => {
              const lastMsg = messages
                .filter(
                  (m) =>
                    (m.sender_id === user.id && m.receiver_id === person.id) ||
                    (m.sender_id === person.id && m.receiver_id === user.id)
                )
                .slice(-1)[0];

              const unreadFromPerson = messages.filter(
                (m) => m.sender_id === person.id && m.receiver_id === user.id && !m.is_read
              ).length;

              const isSelected = activeConversation?.id === person.id;

              return (
                <button
                  key={person.id}
                  onClick={() => setSelectedPartnerId(person.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3.5 hover:bg-white dark:hover:bg-slate-800/70 transition-colors text-left',
                    isSelected &&
                      'bg-white dark:bg-slate-800 shadow-xs border-l-2 border-brand-500'
                  )}
                >
                  <Avatar name={person.full_name} src={person.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {person.full_name}
                        </p>
                        {person.is_verified_researcher && <VerifiedBadge />}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {unreadFromPerson > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                            {unreadFromPerson}
                          </span>
                        )}
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeDate(lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {person.institution || 'Indian Researcher'}
                    </p>
                    {lastMsg ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1">
                        {lastMsg.content}
                      </p>
                    ) : (
                      <span className="inline-block text-[10px] text-brand-600 dark:text-brand-400 mt-1 font-medium">
                        Send Message Request →
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main: message thread ─────────────────────────── */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
            <Avatar
              name={activeConversation.full_name}
              src={activeConversation.avatar_url}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/profile/${activeConversation.id}`}
                  className="font-semibold text-sm text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
                >
                  {activeConversation.full_name}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>
                {activeConversation.is_verified_researcher && <VerifiedBadge />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {activeConversation.institution || 'Researcher'}{' '}
                {activeConversation.department ? `· ${activeConversation.department}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isOutgoingRequest && (
                <span className="text-[11px] font-mono bg-saffron-50 text-saffron-700 dark:bg-saffron-950/60 dark:text-saffron-300 border border-saffron-200 dark:border-saffron-900/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Request Sent
                </span>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={handleQuickCoffeeChat}
                className="gap-1.5 text-xs shrink-0"
              >
                <Coffee className="w-3.5 h-3.5 text-saffron-500" />
                Coffee Pitch
              </Button>
            </div>
          </div>

          {/* Desktop/Mobile Notification Permission Banner */}
          {notifPermission === 'default' && (
            <div className="bg-brand-50 dark:bg-brand-950/40 px-4 py-2 border-b border-brand-200/60 dark:border-brand-900/40 flex items-center justify-between text-xs text-brand-800 dark:text-brand-300">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-brand-600 animate-bounce" />
                <span>Get real-time desktop &amp; mobile alerts for incoming messages</span>
              </div>
              <button
                onClick={handleEnableNotifications}
                className="px-2.5 py-1 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 text-[11px] transition-colors shadow-xs"
              >
                Enable Alerts
              </button>
            </div>
          )}

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {threadMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2 text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-500 mb-1">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Send a Message Request to {activeConversation.full_name}
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Introduce your research lab, pitch a cross-institutional project, or propose a virtual coffee chat.
                </p>
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isSent = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2.5 max-w-lg',
                      isSent ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm shadow-xs space-y-2',
                        isSent
                          ? 'bg-brand-500 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                      )}
                    >
                      {/* Attached image/figure if present */}
                      {msg.media_url && (
                        <a
                          href={msg.media_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg group"
                        >
                          <img
                            src={msg.media_url}
                            alt="Attachment"
                            className="max-h-60 w-auto rounded-lg object-contain group-hover:opacity-90 transition-opacity bg-black/10"
                          />
                        </a>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {isSent ? (
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-brand-100 mt-1 select-none">
                          <span>{formatRelativeDate(msg.created_at)}</span>
                          {msg.is_read ? (
                            <span className="inline-flex items-center gap-0.5 text-white font-medium" title="Read by recipient">
                              <CheckCheck className="w-3.5 h-3.5 text-white" />
                              <span className="text-[9px]">Read</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-brand-200" title="Delivered">
                              <Check className="w-3.5 h-3.5 text-brand-200" />
                              <span className="text-[9px]">Sent</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 mt-1 select-none">
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeDate(msg.created_at)}
                          </span>
                          <button
                            onClick={() =>
                              setReportTarget({
                                reportedUserId: activeConversation.id,
                                targetType: 'message',
                                targetId: msg.id,
                                contentSnippet: msg.content,
                                reportedUserName: activeConversation.full_name,
                              })
                            }
                            className="text-[10px] text-slate-400 hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-0.5"
                            title="Report message to moderation"
                          >
                            <Flag className="w-2.5 h-2.5" />
                            <span>Report</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Incoming Request Decision Bar ───────────────── */}
          {isIncomingRequest ? (
            <div className="p-4 bg-saffron-50/80 dark:bg-saffron-950/40 border-t border-saffron-200 dark:border-saffron-900/60 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-saffron-950 dark:text-saffron-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-saffron-600" />
                  Message Request from {activeConversation.full_name}
                </p>
                <p className="text-[11px] text-saffron-800 dark:text-saffron-300 leading-relaxed">
                  Accepting this request moves the conversation into Direct Messages and enables continuous replies.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => handleAcceptRequest(activeConversation.id)}
                  isLoading={isAcceptingRequest}
                  className="gap-1.5 text-xs font-semibold px-4"
                >
                  <Check className="w-4 h-4" /> Accept Request &amp; Reply
                </Button>

                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => handleDeclineRequest(activeConversation.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 border-red-200 dark:border-red-900/50"
                >
                  <X className="w-4 h-4 mr-1" /> Decline
                </Button>
              </div>
            </div>
          ) : (
            /* ── Normal Direct Message Input Bar ─────────────── */
            <>
              {/* Attached image preview banner */}
              {attachedImageUrl && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={attachedImageUrl}
                      alt="Attachment preview"
                      className="w-10 h-10 rounded object-cover border border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Figure attachment ready to send
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedImageUrl(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
                {/* File input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* Camera input */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* File Attachment Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-2.5 shrink-0 text-slate-500 hover:text-brand-600"
                  title="Attach file, figure, or lab gel"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                {/* Camera Direct Capture Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-2.5 shrink-0 text-slate-500 hover:text-emerald-600"
                  title="Take photo from camera / webcam"
                >
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </Button>

                {/* GIF Selector Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowGifPicker(true)}
                  disabled={isUploadingImage}
                  className="px-2 shrink-0 text-slate-500 hover:text-brand-600"
                  title="Insert animated GIF (0 bytes storage used)"
                >
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    GIF
                  </span>
                </Button>

                <input
                  type="text"
                  placeholder={`Message ${activeConversation.full_name}...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && !attachedImageUrl) || isUploadingImage}
                  className="px-4 shrink-0 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
          <p>Select a researcher from the left to start a conversation or review requests.</p>
        </div>
      )}

      {/* GIF Picker Modal */}
      <GifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={(gifUrl) => {
          setAttachedImageUrl(gifUrl);
        }}
      />

      {/* Moderation / Abuse Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.reportedUserId}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          contentSnippet={reportTarget.contentSnippet}
          reportedUserName={reportTarget.reportedUserName}
        />
      )}
    </div>
  );
}
