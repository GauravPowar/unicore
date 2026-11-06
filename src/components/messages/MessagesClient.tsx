// ============================================================
// MessagesClient – 1-on-1 Realtime DM UI
// 100% Live Supabase PostgreSQL + Realtime (Zero Mock Data)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeDate, createClientId, cn } from '@/lib/utils';
import { Send, MessageSquare, Coffee, Lock } from 'lucide-react';
import type { Message, Profile } from '@/types';

export function MessagesClient() {
  const searchParams = useSearchParams();
  const toUserId = searchParams.get('to');
  const preset = searchParams.get('preset');

  const { user, profile } = useAuth();

  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(toUserId || '');
  const [inputValue, setInputValue] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

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

  const activeConversation = allProfiles.find((p) => p.id === selectedPartnerId) || null;

  // Set preset message if requested
  useEffect(() => {
    if (preset === 'coffee_chat' && activeConversation) {
      setInputValue(
        `Hi ${activeConversation.full_name.split(' ')[0]}! I saw your research profile on UniCore and would love to connect for a quick 15-minute virtual coffee chat to explore collaborative ideas.`
      );
    }
  }, [preset, activeConversation]);

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

  // Messages for active conversation
  const threadMessages = activeConversation && user
    ? messages.filter(
        (m) =>
          (m.sender_id === user.id && m.receiver_id === activeConversation.id) ||
          (m.sender_id === activeConversation.id && m.receiver_id === user.id)
      )
    : [];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation || !user || !profile) return;

    const content = inputValue.trim();
    const tempId = createClientId('msg');

    const newMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeConversation.id,
      content,
      media_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: profile,
      receiver: activeConversation,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    try {
      const supabase = createClient();
      const { data: dbMsg, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeConversation.id,
          content,
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

  // Guest State: Sign in required
  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Direct Messages
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Sign in with your researcher account to send 1-on-1 messages, exchange protocols, and schedule virtual coffee chats.
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
    <div className="h-[calc(100vh-10rem)] min-h-[500px] flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* ── Sidebar: researcher list ───────────────────── */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Direct Messages
          </h2>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoadingProfiles ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading researchers...</div>
          ) : allProfiles.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <p>No other researchers registered yet.</p>
              <p className="text-[11px] text-slate-500">
                Share UniCore with your colleagues across labs to start messaging!
              </p>
            </div>
          ) : (
            allProfiles.map((person) => {
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
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {person.full_name}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeDate(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {person.institution || 'Indian Researcher'}
                    </p>
                    {lastMsg && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1">
                        {lastMsg.content}
                      </p>
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
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
            <Avatar
              name={activeConversation.full_name}
              src={activeConversation.avatar_url}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {activeConversation.full_name}
                </p>
                {activeConversation.is_verified_researcher && <VerifiedBadge />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {activeConversation.institution || 'Researcher'} {activeConversation.department ? `· ${activeConversation.department}` : ''}
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleQuickCoffeeChat}
              className="gap-1.5 text-xs shrink-0"
            >
              <Coffee className="w-3.5 h-3.5 text-saffron-500" />
              Coffee Chat Preset
            </Button>
          </div>

          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {threadMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
                <Coffee className="w-10 h-10 text-brand-400/40" />
                <p>No messages yet. Send an opening message or pitch a collaboration!</p>
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
                        'rounded-2xl px-4 py-2.5 text-sm shadow-xs',
                        isSent
                          ? 'bg-brand-500 text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                      )}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
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
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
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
              className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
          <p>Select a researcher from the left to start a conversation.</p>
        </div>
      )}
    </div>
  );
}
