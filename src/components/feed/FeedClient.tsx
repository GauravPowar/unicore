// ============================================================
// FeedClient – client-side feed with composer + optimistic posts
// ============================================================
'use client';

import { useState } from 'react';
import { PostComposer } from '@/components/feed/PostComposer';
import { PostCard } from '@/components/feed/PostCard';
import type { Post, PostType } from '@/types';
import { MOCK_PROFILES } from '@/lib/mock-data';

interface FeedClientProps {
  initialPosts: Post[];
  defaultForumId?: string;
}

export function FeedClient({ initialPosts, defaultForumId }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handlePost = (data: {
    content_markdown: string;
    post_type: PostType;
    forum_id?: string;
    title?: string;
    media_urls: string[];
  }) => {
    // Optimistic UI: add the post to the top of the feed
    const newPost: Post = {
      id: `optimistic-${Date.now()}`,
      author_id: MOCK_PROFILES[0].id,
      forum_id: data.forum_id ?? null,
      title: data.title ?? null,
      content_markdown: data.content_markdown,
      media_urls: data.media_urls,
      post_type: data.post_type,
      upvotes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: MOCK_PROFILES[0],
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="space-y-4">
      <PostComposer onPost={handlePost} defaultForumId={defaultForumId} />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

