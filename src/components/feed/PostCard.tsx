// ============================================================
// PostCard – renders a single post in the feed
// Client Component: uses formatDate() which calls new Date()
// ============================================================
'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerifiedBadge } from '@/components/ui/Badge';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { POST_TYPE_CONFIG, formatRelativeDate, cn } from '@/lib/utils';
import { ArrowUp, MessageSquare, Share2, Bookmark } from 'lucide-react';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const author = post.author;
  const typeConfig = POST_TYPE_CONFIG[post.post_type];

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
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
            'shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
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
              className="rounded-lg object-cover w-full h-48 bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group">
          <ArrowUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>{post.upvotes_count}</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>Reply</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
