// ============================================================
// MessagesClient – 1-on-1 Realtime DM UI with Message Requests
// 100% Live Supabase PostgreSQL + Realtime (Zero Mock Data)
// Modeled after Bluesky & modern social messaging architectures
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
import {
  Send,
  MessageSquare,
  Coffee,
  Lock,
  Paperclip,
  X,
  Check,
  UserCheck,
  Inbox,
  ShieldAlert,
  Search,
  ExternalLink,
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

  // Image attachment state
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Accepted & ignored message requests from user metadata
  const acceptedRequests = useMemo<string[]>(() => {
    return (user?.user_metadata?.accepted_requests as string[]) || [];
  }, [user?.user_metadata?.accepted_requests]);

  const ignoredRequests = useMemo<string[]>(() => {
    return (user?.user_metadata?.ignored_requests as string[]) || [];
  }, [user?.user_metadata?.ignored_requests]);

  // Load real registered researchers from Supabase
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

  // Supabase Realtime subscription
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

  // Auto-scroll messages to bottom when updated
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartnerId]);

  // Set preset message if requested
  useEffect(() => {
    if (preset === 'coffee_chat' && activeConversation) {
      setInputValue(
        `Hi ${activeConversation.full_name.split(' ')[0]}! I saw your research profile on UniCore and would love to connect for a quick 15-minute virtual coffee chat to explore collaborative ideas.`
      );
    }
  }, [preset, activeConversation]);

  // Segregate conversation partners into Direct Messages vs Message Requests
  const { directPartners, requestPartners } = useMemo(() => {
    if (!user) return { directPartners: [], requestPartners: [] };

    const direct: Profile[] = [];
    const requests: Profile[] = [];

    allProfiles.forEach((person) => {
      if (ignoredRequests.includes(person.id)) return;

      const sentToPerson = messages.filter(
        (m) => m.sender_id === user.id && m.receiver_id === person.id
      ).length;
      const receivedFromPerson = messages.filter(
        (m) => m.sender_id === person.id && m.receiver_id === user.id
      ).length;

      // Has the current user already accepted this researcher?
      const isExplicitlyAccepted = acceptedRequests.includes(person.id);

      if (receivedFromPerson > 0 && sentToPerson === 0 && !isExplicitlyAccepted) {
        // Someone messaged current user first, and user has not replied/accepted yet
        requests.push(person);
      } else {
        // Mutual conversation, sender-initiated thread, or accepted
        direct.push(person);
      }
    });

    return { directPartners: direct, requestPartners: requests };
  }, [user, allProfiles, messages, acceptedRequests, ignoredRequests]);

  // Check if active conversation is an incoming request
  const isIncomingRequest = useMemo(() => {
    if (!user || !activeConversation) return false;
    if (acceptedRequests.includes(activeConversation.id)) return false;

    const sentToPerson = messages.filter(
      (m) => m.sender_id === user.id && m.receiver_id === activeConversation.id
    ).length;
    const receivedFromPerson = messages.filter(
      (m) => m.sender_id === activeConversation.id && m.receiver_id === user.id
    ).length;

    return receivedFromPerson > 0 && sentToPerson === 0;
  }, [user, activeConversation, messages, acceptedRequests]);

  // Check if current user sent a request that is still pending
  const isOutgoingRequest = useMemo(() => {
    if (!user || !activeConversation) return false;

    const sentToPerson = messages.filter(
      (m) => m.sender_id === user.id && m.receiver_id === activeConversation.id
    ).length;
    const receivedFromPerson = messages.filter(
      (m) => m.sender_id === activeConversation.id && m.receiver_id === user.id
    ).length;

    return (sentToPerson > 0 && receivedFromPerson === 0) || isReqParam;
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
    if (!user) return;
    try {
      const supabase = createClient();
      const updated = Array.from(new Set([...acceptedRequests, partnerId]));
      await supabase.auth.updateUser({
        data: { accepted_requests: updated },
      });
      setActiveTab('direct');
      setSelectedPartnerId(partnerId);
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  // Decline / ignore a message request
  const handleDeclineRequest = async (partnerId: string) => {
    if (!user) return;
    const confirmed = window.confirm('Are you sure you want to dismiss this message request?');
    if (!confirmed) return;

    try {
      const supabase = createClient();
      const updated = Array.from(new Set([...ignoredRequests, partnerId]));
      await supabase.auth.updateUser({
        data: { ignored_requests: updated },
      });
      setSelectedPartnerId('');
    } catch (err) {
      console.error('Error ignoring request:', err);
    }
  };

  // Upload an image attachment via /api/upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

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
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !attachedImageUrl) || !activeConversation || !user || !profile) return;

    const content = inputValue.trim();
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

    // If accepting an incoming request by replying, mark as accepted
    if (isIncomingRequest) {
      try {
        const supabase = createClient();
        const updated = Array.from(new Set([...acceptedRequests, activeConversation.id]));
        await supabase.auth.updateUser({
          data: { accepted_requests: updated },
        });
      } catch (err) {
        console.warn('Could not auto-accept on reply:', err);
      }
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
          Sign in with your verified researcher account to send message requests, exchange data protocols, and connect across labs.
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
                <span className="w-2 h-2 rounded-full bg-saffron-500 absolute top-1.5 right-3" />
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
                    When researchers outside your network contact you, their requests will appear here.
                  </p>
                </>
              ) : (
                <>
                  <p>No active conversations yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Find researchers in the directory or send a message request to begin.
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
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {formatRelativeDate(lastMsg.created_at)}
                        </span>
                      )}
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
                        Start Message Request →
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
                <span className="text-[11px] font-mono bg-saffron-50 text-saffron-700 dark:bg-saffron-950/60 dark:text-saffron-300 border border-saffron-200 dark:border-saffron-900/40 px-2.5 py-1 rounded-full">
                  Request Pending
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

          {/* Incoming Request Banner (if recipient hasn't accepted yet) */}
          {isIncomingRequest && (
            <div className="bg-saffron-50/70 dark:bg-saffron-950/40 border-b border-saffron-200 dark:border-saffron-900/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-saffron-950 dark:text-saffron-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-saffron-600" />
                  Message Request from {activeConversation.full_name}
                </p>
                <p className="text-[11px] text-saffron-800 dark:text-saffron-300/80">
                  Accept this request to reply and enable continuous direct messaging.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAcceptRequest(activeConversation.id)}
                  className="gap-1 text-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Accept Request
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDeclineRequest(activeConversation.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50"
                >
                  Decline
                </Button>
              </div>
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

                      <span
                        className={cn(
                          'block text-[10px] mt-1',
                          isSent ? 'text-brand-100 text-right' : 'text-slate-400'
                        )}
                      >
                        {formatRelativeDate(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

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

          {/* Input bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Attachment Button */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="px-3 shrink-0 text-slate-500 hover:text-brand-600"
              title="Attach figure or lab gel"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <input
              type="text"
              placeholder={
                isIncomingRequest
                  ? `Reply to accept request from ${activeConversation.full_name}...`
                  : `Message ${activeConversation.full_name}...`
              }
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
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
          <p>Select a researcher from the left to start a conversation or review requests.</p>
        </div>
      )}
    </div>
  );
}
