// ============================================================
// MessagesClient – 1-on-1 DM UI with Supabase Realtime stub
// Full Realtime integration in Step 4
// ============================================================
'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MOCK_MESSAGES, MOCK_PROFILES } from '@/lib/mock-data';
import { formatRelativeDate, cn } from '@/lib/utils';
import { Send, MessageSquare } from 'lucide-react';
import type { Profile } from '@/types';

export function MessagesClient() {
  const currentUserId = MOCK_PROFILES[0].id; // Simulated logged-in user
  const [activeConversation, setActiveConversation] = useState<Profile | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Derive unique conversation partners
  const conversations = MOCK_PROFILES.filter((p) => p.id !== currentUserId);

  // Messages for active conversation
  const threadMessages = activeConversation
    ? MOCK_MESSAGES.filter(
        (m) =>
          (m.sender_id === currentUserId && m.receiver_id === activeConversation.id) ||
          (m.sender_id === activeConversation.id && m.receiver_id === currentUserId)
      )
    : [];

  return (
    <div className="h-[calc(100vh-10rem)] flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      {/* ── Sidebar: conversation list ───────────────────── */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((person) => (
            <button
              key={person.id}
              onClick={() => setActiveConversation(person)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left',
                activeConversation?.id === person.id &&
                  'bg-brand-50 dark:bg-brand-900/20'
              )}
            >
              <Avatar name={person.full_name} src={person.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {person.full_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {person.institution}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main: message thread ─────────────────────────── */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <Avatar name={activeConversation.full_name} src={activeConversation.avatar_url} size="sm" />
            <div>
              <p className="font-medium text-sm text-slate-900 dark:text-white">
                {activeConversation.full_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeConversation.institution}
              </p>
            </div>
            <div className="ml-auto">
              <Button size="sm" variant="secondary">
                ☕ Request Coffee Chat
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {threadMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Start the conversation with {activeConversation.full_name}!
              </div>
            ) : (
              threadMessages.map((msg) => {
                const isSent = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2', isSent ? 'flex-row-reverse' : 'flex-row')}
                  >
                    {!isSent && (
                      <Avatar
                        name={activeConversation.full_name}
                        src={activeConversation.avatar_url}
                        size="sm"
                      />
                    )}
                    <div className="max-w-xs space-y-1">
                      <div
                        className={
                          isSent ? 'chat-bubble-sent' : 'chat-bubble-received'
                        }
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p
                        className={cn(
                          'text-xs text-slate-400',
                          isSent ? 'text-right' : 'text-left'
                        )}
                      >
                        {formatRelativeDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  // In Step 4, this will insert into Supabase
                  setInputValue('');
                }
              }}
              placeholder="Type a message…"
              className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!inputValue.trim()}
              onClick={() => setInputValue('')}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
