// ============================================================
// MessagesClient – 1-on-1 Realtime DM UI
// Supports ?to=userId, preset=coffee_chat, and Supabase Realtime
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { MOCK_MESSAGES, MOCK_PROFILES, isUsingMockData } from '@/lib/mock-data';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeDate, createClientId, cn } from '@/lib/utils';
import { Send, MessageSquare, Coffee, CheckCheck } from 'lucide-react';
import type { Message } from '@/types';

export function MessagesClient() {
  const searchParams = useSearchParams();
  const toUserId = searchParams.get('to');
  const preset = searchParams.get('preset');

  const { profile } = useAuth();
  const currentUser = profile || MOCK_PROFILES[0];
  const currentUserId = currentUser.id;

  const targetProfile = toUserId ? MOCK_PROFILES.find((p) => p.id === toUserId) : null;
  const initialPartner = targetProfile ?? MOCK_PROFILES[1];

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(initialPartner.id);

  const initialInput =
    preset === 'coffee_chat' && targetProfile
      ? `Hi ${targetProfile.full_name.split(' ')[0]}! I saw your research profile on UniCore and would love to connect for a quick 15-minute virtual coffee chat to explore collaborative ideas.`
      : '';

  const [inputValue, setInputValue] = useState(initialInput);

  const activeConversation =
    MOCK_PROFILES.find((p) => p.id === selectedPartnerId) ?? initialPartner;

  // Supabase Realtime subscription when live keys are active
  useEffect(() => {
    if (isUsingMockData()) return;

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
            if (
              newRow.receiver_id === currentUserId ||
              newRow.sender_id === currentUserId
            ) {
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
  }, [currentUserId]);

  // Derive conversations list
  const conversations = MOCK_PROFILES.filter((p) => p.id !== currentUserId);

  // Messages for active conversation
  const threadMessages = activeConversation
    ? messages.filter(
        (m) =>
          (m.sender_id === currentUserId && m.receiver_id === activeConversation.id) ||
          (m.sender_id === activeConversation.id && m.receiver_id === currentUserId)
      )
    : [];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation) return;

    const content = inputValue.trim();
    const newMessage: Message = {
      id: createClientId('msg'),
      sender_id: currentUserId,
      receiver_id: activeConversation.id,
      content,
      media_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: currentUser,
      receiver: activeConversation,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    if (!isUsingMockData()) {
      try {
        const supabase = createClient();
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: activeConversation.id,
          content,
        });
      } catch (err) {
        console.error('Message send error:', err);
      }
    }
  };

  const handleQuickCoffeeChat = () => {
    if (!activeConversation) return;
    setInputValue(
      `Hi ${activeConversation.full_name}! Would you be open to a virtual coffee chat this week to discuss research overlaps?`
    );
  };

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[500px] flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* ── Sidebar: conversation list ───────────────────── */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Direct Messages
          </h2>
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {conversations.map((person) => {
            const lastMsg = messages
              .filter(
                (m) =>
                  (m.sender_id === currentUserId && m.receiver_id === person.id) ||
                  (m.sender_id === person.id && m.receiver_id === currentUserId)
              )
              .slice(-1)[0];

            const isSelected = activeConversation.id === person.id;

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
                    {person.institution}
                  </p>
                  {lastMsg && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1">
                      {lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
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
                {activeConversation.institution} · {activeConversation.department}
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
                const isSent = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2.5 max-w-lg',
                      isSent ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                    )}
                  >
                    {!isSent && (
                      <Avatar
                        name={activeConversation.full_name}
                        src={activeConversation.avatar_url}
                        size="sm"
                      />
                    )}
                    <div className="space-y-1">
                      <div
                        className={cn(
                          'p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs',
                          isSent
                            ? 'bg-brand-500 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/50'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1 text-[10px] text-slate-400 px-1',
                          isSent ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <span>{formatRelativeDate(msg.created_at)}</span>
                        {isSent && <CheckCheck className="w-3 h-3 text-brand-500" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input box */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3.5 flex gap-2.5 bg-slate-50/50 dark:bg-slate-950/30">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${activeConversation.full_name.split(' ')[0]}...`}
              className="flex-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
            <Button
              variant="primary"
              size="md"
              disabled={!inputValue.trim()}
              onClick={handleSendMessage}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-brand-500" />
            <p className="text-sm font-medium">Select a researcher to open direct messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
