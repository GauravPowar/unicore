// ============================================================
// PostCard – renders a single post in the feed with comments & upvoting,
// plus Bluesky-style inline post editing & deletion for authors
// Client Component
// ============================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { CommentSection } from '@/components/feed/CommentSection';
import { POST_TYPE_CONFIG, formatRelativeDate, cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ReportModal } from '@/components/ui/ReportModal';
import {
  ArrowUp,
  MessageSquare,
  Share2,
  Bookmark,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Flag,
} from 'lucide-react';
import type { Post, Comment, PostType } from '@/types';

interface PostCardProps {
  post: Post;
  compact?: boolean;
  defaultShowComments?: boolean;
}

const POST_TYPES: PostType[] = ['thought', 'question', 'visual_abstract', 'collab_pitch'];

export function PostCard({ post, compact = false, defaultShowComments = false }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const author = currentPost.author;
  const isAuthor = user?.id === currentPost.author_id;

  const [upvotes, setUpvotes] = useState(currentPost.upvotes_count);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTargeted, setIsTargeted] = useState(false);

  // Sync bookmark from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw =
          localStorage.getItem('researchsetu_saved_posts') ||
          localStorage.getItem('unicore_saved_posts') ||
          '[]';
        const saved: string[] = JSON.parse(raw);
        if (Array.isArray(saved) && saved.includes(currentPost.id)) {
          setIsBookmarked(true);
        }
      } catch {}
    }
  }, [currentPost.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (typeof window !== 'undefined') {
      try {
        const raw =
          localStorage.getItem('researchsetu_saved_posts') ||
          localStorage.getItem('unicore_saved_posts') ||
          '[]';
        let saved: string[] = JSON.parse(raw);
        if (next) {
          if (!saved.includes(currentPost.id)) saved.push(currentPost.id);
        } else {
          saved = saved.filter((id) => id !== currentPost.id);
        }
        localStorage.setItem('researchsetu_saved_posts', JSON.stringify(saved));
        localStorage.setItem('unicore_saved_posts', JSON.stringify(saved));
        window.dispatchEvent(new CustomEvent('researchsetu_bookmarks_updated'));
        window.dispatchEvent(new CustomEvent('unicore_bookmarks_updated'));
      } catch {}
    }
  };

  // Author action state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(currentPost.title || '');
  const [editContent, setEditContent] = useState(currentPost.content_markdown);
  const [editType, setEditType] = useState<PostType>(currentPost.post_type);

  const menuRef = useRef<HTMLDivElement>(null);
  const initialComments: Comment[] = [];

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('[role="button"]') ||
      isEditing
    ) {
      return;
    }

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith(`/post/${currentPost.id}`)) {
      router.push(`/post/${currentPost.id}`);
    }
  };

  const isEdited =
    currentPost.updated_at &&
    currentPost.updated_at !== currentPost.created_at &&
    new Date(currentPost.updated_at).getTime() - new Date(currentPost.created_at).getTime() > 2000;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Auto-scroll and highlight when navigated to via URL hash
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === `#${currentPost.id}`) {
        setIsTargeted(true);
        const el = document.getElementById(currentPost.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setIsTargeted(false);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentPost.id]);

  // Check if current user has already upvoted this post
  useEffect(() => {
    if (!user) return;

    const checkUpvote = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('post_upvotes')
          .select('post_id')
          .eq('post_id', currentPost.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) setHasUpvoted(true);
      } catch {
        // ignore
      }
    };

    checkUpvote();
  }, [currentPost.id, user]);

  const handleUpvote = async () => {
    if (!user) {
      alert('Please sign in to upvote research posts.');
      window.location.href = '/login';
      return;
    }

    const nextState = !hasUpvoted;
    setUpvotes((v) => (nextState ? v + 1 : v - 1));
    setHasUpvoted(nextState);

    try {
      const supabase = createClient();
      if (nextState) {
        await supabase.from('post_upvotes').insert({
          post_id: currentPost.id,
          user_id: user.id,
        });
      } else {
        await supabase
          .from('post_upvotes')
          .delete()
          .eq('post_id', currentPost.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.warn('Upvote error:', err);
      // rollback
      setUpvotes((v) => (nextState ? Math.max(0, v - 1) : v + 1));
      setHasUpvoted(!nextState);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shortUrl = `${window.location.origin}/p/${currentPost.id.slice(0, 8)}`;
      navigator.clipboard?.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Author: Modify Post (Bluesky-style) ─────────────────────
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);

    const updates = {
      title: editTitle.trim() || null,
      content_markdown: editContent.trim(),
      post_type: editType,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', currentPost.id);

      if (!error) {
        setCurrentPost((prev) => ({
          ...prev,
          ...updates,
        }));
        setIsEditing(false);
      } else {
        alert('Could not update post: ' + error.message);
      }
    } catch {
      alert('Network error while saving post.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Author: Delete Post ─────────────────────────────────────
  const handleDeletePost = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const supabase = createClient();
      await supabase.from('post_upvotes').delete().eq('post_id', currentPost.id);
      await supabase.from('comments').delete().eq('post_id', currentPost.id);
      const { error } = await supabase.from('posts').delete().eq('id', currentPost.id);

      if (!error) {
        setIsDeleted(true);
      } else {
        alert('Could not delete post: ' + error.message);
      }
    } catch {
      alert('Network error while deleting post.');
    }
  };

  if (isDeleted) return null;

  const typeConfig = POST_TYPE_CONFIG[currentPost.post_type];

  return (
    <article
      id={currentPost.id}
      onClick={handleCardClick}
      className={cn(
        'bg-white dark:bg-slate-900 border rounded-xl p-5 transition-all scroll-mt-24 relative',
        !defaultShowComments && 'cursor-pointer hover:border-brand-400 dark:hover:border-brand-600',
        isTargeted
          ? 'border-brand-500 ring-2 ring-brand-500/50 shadow-lg dark:ring-brand-400/40'
          : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
      )}
    >
      {/* Author row */}
      <div className="flex items-start gap-3 mb-3">
        {author && (
          <Avatar name={author.full_name} src={author.avatar_url} size="md" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {author && (
              <Link
                href={`/profile/${author.id}`}
                className="font-semibold text-slate-900 dark:text-white text-sm hover:underline"
              >
                {author.full_name}
              </Link>
            )}
            {author?.is_verified_researcher && <VerifiedBadge />}
            {author?.username && (
              <span className="text-xs text-slate-400 font-mono">@{author.username}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {author?.institution && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {author.institution}
              </span>
            )}
            <span className="text-xs text-slate-400">·</span>
            <Link
              href={`/post/${currentPost.id}`}
              className="text-xs text-slate-400 dark:text-slate-500 hover:underline hover:text-brand-600 dark:hover:text-brand-400"
            >
              {formatRelativeDate(currentPost.created_at)}
            </Link>
            {isEdited && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                · edited
              </span>
            )}
          </div>
        </div>

        {/* Post type badge */}
        <span
          className={cn(
            'shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
            typeConfig.color
          )}
        >
          <span>{typeConfig.icon}</span>
          {typeConfig.label}
        </span>

        {/* Post Options Dropdown Menu (Edit/Delete for author, Report for community) */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
              {isAuthor ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-brand-500" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDeletePost();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Post
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setShowReportModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Forum tag */}
      {currentPost.forum && (
        <Link
          href={`/forums/${currentPost.forum.slug}`}
          className="inline-block mb-2"
        >
          <Badge variant="category" className="hover:opacity-80 transition-opacity">
            {currentPost.forum.name}
          </Badge>
        </Link>
      )}

      {/* ── Inline Edit Mode ───────────────────────────────── */}
      {isEditing ? (
        <div className="my-2 p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          {/* Post Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {POST_TYPES.map((type) => {
              const cfg = POST_TYPE_CONFIG[type];
              const isSelected = editType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEditType(type)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    isSelected
                      ? cfg.color + ' ring-1 ring-current font-semibold'
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  )}
                >
                  <span>{cfg.icon}</span>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Title input */}
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Headline or question (optional)…"
            className="w-full px-3 py-1.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* Content textarea */}
          <textarea
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono leading-relaxed resize-none"
          />

          {/* Edit Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveEdit}
              isLoading={isSaving}
              className="gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Title */}
          {currentPost.title && (
            <h2 className="font-semibold text-slate-900 dark:text-white mb-2 text-base leading-snug">
              {currentPost.title}
            </h2>
          )}

          {/* Content */}
          <div className={cn(compact && 'line-clamp-5')}>
            <MarkdownContent content={currentPost.content_markdown} />
          </div>

          {/* Academic DOI / Paper Embed Card */}
          {(() => {
            const doiRegex = /(?:https?:\/\/doi\.org\/|doi:\s*|(?:^|\s))(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i;
            const doiMatch = currentPost.content_markdown.match(doiRegex);
            const detectedDoi = doiMatch ? doiMatch[1].replace(/[.,;)]+$/, '') : null;
            if (!detectedDoi) return null;

            return (
              <div
                onClick={(e) => e.stopPropagation()}
                className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center shrink-0 text-[11px] border border-brand-500/20">
                    DOI
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      Academic Preprint / Publication
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      https://doi.org/{detectedDoi}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://doi.org/${detectedDoi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 shrink-0 flex items-center gap-1.5 text-xs transition-colors shadow-xs"
                >
                  <span>Read Paper</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })()}
        </>
      )}

      {/* Media */}
      {currentPost.media_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {currentPost.media_urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Media ${i + 1}`}
              className="rounded-lg object-cover w-full h-48 bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleUpvote}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors group',
            hasUpvoted
              ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 font-semibold'
              : 'text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
          title="Upvote post"
        >
          <ArrowUp
            className={cn(
              'w-4 h-4 transition-transform group-hover:-translate-y-0.5',
              hasUpvoted && 'text-brand-500 stroke-[2.5]'
            )}
          />
          <span>{upvotes}</span>
        </button>

        <button
          onClick={() => setShowComments((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors',
            showComments
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
              : 'text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {initialComments.length > 0
              ? `${initialComments.length} Discussion${initialComments.length > 1 ? 's' : ''}`
              : 'Discuss'}
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors ml-auto p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Copy shortlink"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
              <Check className="w-3.5 h-3.5" /> Copied!
            </span>
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={toggleBookmark}
          className={cn(
            'flex items-center gap-1.5 text-xs p-1.5 rounded-lg transition-colors',
            isBookmarked
              ? 'text-saffron-500 hover:text-saffron-600 bg-saffron-50 dark:bg-saffron-950/40'
              : 'text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
          title={isBookmarked ? 'Saved to bookmarks' : 'Save post to bookmarks'}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current text-saffron-500')} />
        </button>
      </div>

      {/* Nested Comments View */}
      {showComments && (
        <CommentSection postId={currentPost.id} initialComments={initialComments} />
      )}

      {/* Report Modal */}
      {author && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={author.id}
          targetType="post"
          targetId={currentPost.id}
          contentSnippet={currentPost.title || currentPost.content_markdown}
          reportedUserName={author.full_name}
        />
      )}
    </article>
  );
}
