// ============================================================
// CommentSection – nested comments with LaTeX & reply support
// Live Supabase sync with fallback to mock researcher session
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { formatRelativeDate } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Comment } from '@/types';
import { CornerDownRight, Send } from 'lucide-react';

let commentIdCounter = 1000;
function generateId(prefix: string) {
  commentIdCounter += 1;
  return `${prefix}-${commentIdCounter}`;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { user, profile } = useAuth();

  // Load real comments from Supabase
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('comments')
          .select('*, author:profiles(*)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const topComments: Comment[] = [];
          const replyMap = new Map<string, Comment[]>();

          data.forEach((item) => {
            const c = { ...item, replies: [] } as unknown as Comment;
            if (c.parent_comment_id) {
              const existing = replyMap.get(c.parent_comment_id) || [];
              existing.push(c);
              replyMap.set(c.parent_comment_id, existing);
            } else {
              topComments.push(c);
            }
          });

          topComments.forEach((tc) => {
            tc.replies = replyMap.get(tc.id) || [];
          });

          setComments(topComments);
        }
      } catch (err) {
        console.warn('Could not load live comments:', err);
      }
    };

    fetchComments();
  }, [postId]);

  const handleAddTopComment = async () => {
    if (!newCommentText.trim()) return;

    if (!user || !profile) {
      alert('Please sign in to comment on posts.');
      window.location.href = '/login';
      return;
    }

    const content = newCommentText.trim();
    const newComment: Comment = {
      id: generateId('comment'),
      post_id: postId,
      author_id: user.id,
      parent_comment_id: null,
      content_markdown: content,
      created_at: new Date().toISOString(),
      author: profile,
      replies: [],
    };

    setComments((prev) => [...prev, newComment]);
    setNewCommentText('');

    try {
      const supabase = createClient();
      const { data: dbComment } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          parent_comment_id: null,
          content_markdown: content,
        })
        .select('*, author:profiles(*)')
        .single();

      if (dbComment) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === newComment.id ? ({ ...dbComment, replies: [] } as unknown as Comment) : c
          )
        );
      }
    } catch (err) {
      console.error('Comment insertion error:', err);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    if (!user || !profile) {
      alert('Please sign in to reply to comments.');
      window.location.href = '/login';
      return;
    }

    const content = replyText.trim();
    const newReply: Comment = {
      id: generateId('reply'),
      post_id: postId,
      author_id: user.id,
      parent_comment_id: parentId,
      content_markdown: content,
      created_at: new Date().toISOString(),
      author: profile,
      replies: [],
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies ?? []), newReply],
          };
        }
        return c;
      })
    );

    setReplyingToId(null);
    setReplyText('');

    try {
      const supabase = createClient();
      await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        parent_comment_id: parentId,
        content_markdown: content,
      });
    } catch (err) {
      console.error('Reply insertion error:', err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
      {/* Top-level comment input */}
      <div className="flex gap-2">
        <Avatar name={profile?.full_name ?? 'Researcher'} src={profile?.avatar_url ?? null} size="sm" />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Add to the discussion... (Markdown & $LaTeX$ supported)"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTopComment();
            }}
            className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button
            size="sm"
            variant="primary"
            disabled={!newCommentText.trim()}
            onClick={handleAddTopComment}
            className="px-3"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Render comment list */}
      {comments.length > 0 && (
        <div className="space-y-3 pt-2">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Comment Bubble */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar
                    name={comment.author?.full_name ?? 'Researcher'}
                    src={comment.author?.avatar_url}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {comment.author?.full_name}
                      </span>
                      {comment.author?.is_verified_researcher && <VerifiedBadge />}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeDate(comment.created_at)}
                    </span>
                  </div>
                </div>

                <div className="pl-8">
                  <MarkdownContent content={comment.content_markdown} className="text-xs" />
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() =>
                        setReplyingToId(replyingToId === comment.id ? null : comment.id)
                      }
                      className="text-[11px] font-medium text-slate-500 hover:text-brand-500 flex items-center gap-1 transition-colors"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Reply form */}
              {replyingToId === comment.id && (
                <div className="ml-8 flex gap-2 pl-2 border-l-2 border-brand-200 dark:border-brand-800">
                  <input
                    type="text"
                    placeholder={`Reply to ${comment.author?.full_name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddReply(comment.id);
                    }}
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!replyText.trim()}
                    onClick={() => handleAddReply(comment.id)}
                    className="px-2.5 py-1 text-xs"
                  >
                    Reply
                  </Button>
                </div>
              )}

              {/* Nested replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="bg-slate-50/70 dark:bg-slate-800/30 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/60"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar
                          name={reply.author?.full_name ?? 'Researcher'}
                          src={reply.author?.avatar_url}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {reply.author?.full_name}
                            </span>
                            {reply.author?.is_verified_researcher && <VerifiedBadge />}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {formatRelativeDate(reply.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="pl-7">
                        <MarkdownContent content={reply.content_markdown} className="text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
