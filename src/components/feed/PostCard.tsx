// ============================================================
// PostCard – renders a single post in the feed with comments & upvoting
// Client Component
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { CommentSection } from '@/components/feed/CommentSection';
import { POST_TYPE_CONFIG, formatRelativeDate, cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { ArrowUp, MessageSquare, Share2, Bookmark, Check } from 'lucide-react';
import type { Post, Comment } from '@/types';

interface PostCardProps {
  post: Post;
  compact?: boolean;
  defaultShowComments?: boolean;
}

export function PostCard({ post, compact = false, defaultShowComments = false }: PostCardProps) {
  const author = post.author;
  const typeConfig = POST_TYPE_CONFIG[post.post_type];
  const initialComments: Comment[] = [];

  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(post.upvotes_count);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if current user has already upvoted this post
  useEffect(() => {
    if (!user) return;

    const checkUpvote = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('post_upvotes')
          .select('post_id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) setHasUpvoted(true);
      } catch {
        // ignore
      }
    };

    checkUpvote();
  }, [post.id, user]);

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
        await supabase.from('post_upvotes').upsert({
          post_id: post.id,
          user_id: user.id,
        });
        await supabase
          .from('posts')
          .update({ upvotes_count: upvotes + 1 })
          .eq('id', post.id);
      } else {
        await supabase
          .from('post_upvotes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        await supabase
          .from('posts')
          .update({ upvotes_count: Math.max(0, upvotes - 1) })
          .eq('id', post.id);
      }
    } catch (err) {
      console.warn('Upvote error:', err);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.origin + `/forums/${post.forum?.slug ?? 'general'}#${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article
      id={post.id}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
    >
      {/* Author row */}
      <div className="flex items-start gap-3 mb-3">
        {author && (
          <Avatar name={author.full_name} src={author.avatar_url} size="md" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {author && (
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {author.full_name}
              </span>
            )}
            {author?.is_verified_researcher && <VerifiedBadge />}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {author?.institution && (
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {author.institution}
              </span>
            )}
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatRelativeDate(post.created_at)}
            </span>
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
      </div>

      {/* Forum tag */}
      {post.forum && (
        <Link
          href={`/forums/${post.forum.slug}`}
          className="inline-block mb-2"
        >
          <Badge variant="category" className="hover:opacity-80 transition-opacity">
            {post.forum.name}
          </Badge>
        </Link>
      )}

      {/* Title */}
      {post.title && (
        <h2 className="font-semibold text-slate-900 dark:text-white mb-2 text-base leading-snug">
          {post.title}
        </h2>
      )}

      {/* Content */}
      <div className={cn(compact && 'line-clamp-5')}>
        <MarkdownContent content={post.content_markdown} />
      </div>

      {/* Media */}
      {post.media_urls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {post.media_urls.map((url, i) => (
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
          title="Copy link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setIsBookmarked((b) => !b)}
          className={cn(
            'flex items-center gap-1.5 text-xs p-1.5 rounded-lg transition-colors',
            isBookmarked
              ? 'text-saffron-500 hover:text-saffron-600'
              : 'text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
          title={isBookmarked ? 'Bookmarked' : 'Bookmark post'}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
        </button>
      </div>

      {/* Nested Comments View */}
      {showComments && (
        <CommentSection postId={post.id} initialComments={initialComments} />
      )}
    </article>
  );
}
