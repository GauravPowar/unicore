// ============================================================
// FeedClient – client-side feed with category tabs & live sync
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { PostComposer } from '@/components/feed/PostComposer';
import { PostCard } from '@/components/feed/PostCard';
import { createClientId } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Post, PostType } from '@/types';
import { Sparkles } from 'lucide-react';

interface FeedClientProps {
  initialPosts: Post[];
  defaultForumId?: string;
}

const FILTER_TABS: Array<{ id: 'all' | PostType; label: string; icon?: string }> = [
  { id: 'all', label: 'All Feed' },
  { id: 'collab_pitch', label: 'Collab Pitches', icon: '🤝' },
  { id: 'question', label: 'Questions', icon: '❓' },
  { id: 'thought', label: 'Thoughts', icon: '💭' },
  { id: 'visual_abstract', label: 'Visual Abstracts', icon: '🎨' },
];

export function FeedClient({ initialPosts, defaultForumId }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedTab, setSelectedTab] = useState<'all' | PostType>('all');
  const { profile, user } = useAuth();

  useEffect(() => {
    const fetchLivePosts = async () => {
      try {
        const supabase = createClient();
        let query = supabase
          .from('posts')
          .select('*, author:profiles(*), forum:forums(*)')
          .order('created_at', { ascending: false });

        if (defaultForumId) {
          query = query.eq('forum_id', defaultForumId);
        }

        const { data, error } = await query;
        if (!error && data) {
          setPosts(data as unknown as Post[]);
        }
      } catch (err) {
        console.warn('Could not fetch live posts:', err);
      }
    };

    fetchLivePosts();
  }, [defaultForumId]);

  const handlePost = async (data: {
    content_markdown: string;
    post_type: PostType;
    forum_id?: string;
    title?: string;
    media_urls: string[];
  }) => {
    if (!user || !profile) {
      alert('Please sign in to publish your post to the UniCore research community.');
      window.location.href = '/login';
      return;
    }

    const newPost: Post = {
      id: createClientId('post'),
      author_id: user.id,
      forum_id: data.forum_id ?? null,
      title: data.title ?? null,
      content_markdown: data.content_markdown,
      media_urls: data.media_urls,
      post_type: data.post_type,
      upvotes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: profile,
    };

    // Optimistic UI update
    setPosts((prev) => [newPost, ...prev]);

    // Live Database Insertion into Supabase
    try {
      const supabase = createClient();
      const { data: dbPost, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          forum_id: data.forum_id || null,
          title: data.title || null,
          content_markdown: data.content_markdown,
          media_urls: data.media_urls,
          post_type: data.post_type,
        })
        .select('*, author:profiles(*), forum:forums(*)')
        .single();

      if (!error && dbPost) {
        setPosts((prev) => [
          dbPost as unknown as Post,
          ...prev.filter((p) => p.id !== newPost.id),
        ]);
      }
    } catch (err) {
      console.error('Post insertion error:', err);
    }
  };

  const filteredPosts =
    selectedTab === 'all'
      ? posts
      : posts.filter((p) => p.post_type === selectedTab);

  return (
    <div className="space-y-4">
      {/* Composer */}
      <PostComposer onPost={handlePost} defaultForumId={defaultForumId} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/60 dark:border-slate-800">
        {FILTER_TABS.map((tab) => {
          const isSelected = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.id !== 'all' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  {posts.filter((p) => p.post_type === tab.id).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Post List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-slate-400 space-y-3 shadow-xs">
          <Sparkles className="w-8 h-8 mx-auto text-brand-400/50" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {selectedTab === 'all'
              ? 'No research posts yet'
              : `No ${FILTER_TABS.find((t) => t.id === selectedTab)?.label} yet`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Share your lab findings, protocols, or collaboration pitch above to get the discussion started.
          </p>
        </div>
      ) : (
        filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
