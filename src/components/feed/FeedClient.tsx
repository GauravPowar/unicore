// ============================================================
// FeedClient – Interactive Research Timeline with Multi-Filter,
// Following Feed, Saved Bookmarks, Live Search & Sorting Controls
// ============================================================
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PostComposer } from '@/components/feed/PostComposer';
import { PostCard } from '@/components/feed/PostCard';
import { createClientId } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import {
  getForumPreferences,
  FORUMS_UPDATED_EVENT,
  type ForumPreferences,
} from '@/lib/userForums';
import type { Post, PostType } from '@/types';
import {
  Sparkles,
  Search,
  X,
  RefreshCw,
  SlidersHorizontal,
  Bookmark,
  Users,
  Compass,
  ArrowUpDown,
  Flame,
  Clock,
  MessageCircle,
} from 'lucide-react';

interface FeedClientProps {
  initialPosts: Post[];
  defaultForumId?: string;
}

type FeedTab = 'all' | 'my_forums' | 'following' | PostType | 'saved';
type SortMode = 'latest' | 'top' | 'discussed';

export function FeedClient({ initialPosts, defaultForumId }: FeedClientProps) {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedTab, setSelectedTab] = useState<FeedTab>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [forumPrefs, setForumPrefs] = useState<ForumPreferences>(() =>
    getForumPreferences(user?.id, user?.user_metadata?.forum_preferences)
  );

  useEffect(() => {
    setForumPrefs(getForumPreferences(user?.id, user?.user_metadata?.forum_preferences));
  }, [user?.id, user?.user_metadata?.forum_preferences]);

  useEffect(() => {
    const handlePrefsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<ForumPreferences>;
      if (customEvent.detail) {
        setForumPrefs(customEvent.detail);
      } else {
        setForumPrefs(getForumPreferences(user?.id, user?.user_metadata?.forum_preferences));
      }
    };
    window.addEventListener(FORUMS_UPDATED_EVENT, handlePrefsUpdate);
    return () => window.removeEventListener(FORUMS_UPDATED_EVENT, handlePrefsUpdate);
  }, [user?.id, user?.user_metadata?.forum_preferences]);

  const activeTabs = useMemo(() => {
    const base: Array<{ id: FeedTab; label: string; icon?: string }> = [
      { id: 'all', label: defaultForumId ? 'All Posts' : 'All Network' },
    ];
    if (!defaultForumId) {
      base.push({ id: 'my_forums', label: 'My Joined Forums', icon: '🏛️' });
    }
    base.push(
      { id: 'following', label: 'Following', icon: '👥' },
      { id: 'collab_pitch', label: 'Collab Pitches', icon: '🤝' },
      { id: 'question', label: 'Questions', icon: '❓' },
      { id: 'thought', label: 'Thoughts', icon: '💭' },
      { id: 'visual_abstract', label: 'Visual Abstracts', icon: '🎨' },
      { id: 'saved', label: 'Saved', icon: '🔖' }
    );
    return base;
  }, [defaultForumId]);

  // 1. Fetch live posts
  const fetchLivePosts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
        .order('created_at', { ascending: false });

      if (defaultForumId) {
        if (defaultForumId === '00000000-0000-0000-0000-000000000000') {
          query = query.or(`forum_id.is.null,forum_id.eq.${defaultForumId}`);
        } else {
          query = query.eq('forum_id', defaultForumId);
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        setPosts(data as unknown as Post[]);
      }
    } catch (err) {
      console.warn('Could not fetch live posts:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [defaultForumId]);

  useEffect(() => {
    fetchLivePosts();
  }, [fetchLivePosts]);

  // 2. Load Bookmarks from localStorage & listen for updates
  useEffect(() => {
    const loadSaved = () => {
      try {
        const raw = localStorage.getItem('researchsetu_saved_posts') || '[]';
        const stored = JSON.parse(raw);
        if (Array.isArray(stored)) {
          setSavedPostIds(stored);
        }
      } catch {}
    };

    loadSaved();
    window.addEventListener('researchsetu_bookmarks_updated', loadSaved);
    return () => {
      window.removeEventListener('researchsetu_bookmarks_updated', loadSaved);
    };
  }, []);

  // 3. Load Following IDs from user metadata or profile API
  useEffect(() => {
    if (!user) {
      setFollowingIds([]);
      return;
    }

    const loadFollowing = async () => {
      try {
        const list = (user.user_metadata?.following as string[]) || [];
        setFollowingIds(list);
      } catch {}
    };

    loadFollowing();
  }, [user]);

  // 4. Handle Post Composer creation
  const handlePost = async (data: {
    content_markdown: string;
    post_type: PostType;
    forum_id?: string;
    title?: string;
    media_urls: string[];
  }) => {
    if (!user || !profile) {
      alert('Please sign in to publish your post to the ResearchSetu research community.');
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
          forum_id: data.forum_id || '00000000-0000-0000-0000-000000000000',
          title: data.title || null,
          content_markdown: data.content_markdown,
          media_urls: data.media_urls,
          post_type: data.post_type,
        })
        .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
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

  // 5. Multi-filter & search pipeline
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Category / Tab filter
    if (selectedTab === 'my_forums') {
      result = result.filter((p) => {
        if (p.forum?.slug) {
          return forumPrefs.joinedSlugs.includes(p.forum.slug);
        }
        if (!p.forum_id || p.forum_id === '00000000-0000-0000-0000-000000000000') {
          return forumPrefs.joinedSlugs.includes('general');
        }
        return false;
      });
    } else if (selectedTab === 'following') {
      result = result.filter((p) => followingIds.includes(p.author_id));
    } else if (selectedTab === 'saved') {
      result = result.filter((p) => savedPostIds.includes(p.id));
    } else if (selectedTab !== 'all') {
      result = result.filter((p) => p.post_type === selectedTab);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          p.title?.toLowerCase().includes(q) ||
          p.content_markdown?.toLowerCase().includes(q) ||
          p.author?.full_name?.toLowerCase().includes(q) ||
          p.author?.username?.toLowerCase().includes(q) ||
          p.author?.institution?.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortMode === 'top') {
        return b.upvotes_count - a.upvotes_count;
      }
      // 'latest' default
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [posts, selectedTab, followingIds, savedPostIds, forumPrefs.joinedSlugs, searchQuery, sortMode]);

  return (
    <div className="space-y-4">
      {/* Composer */}
      <PostComposer onPost={handlePost} defaultForumId={defaultForumId} />

      {/* Timeline Controls: Tabs & Action Bar */}
      <div className="space-y-2.5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/60 dark:border-slate-800 scrollbar-none">
          {activeTabs.map((tab) => {
            const isSelected = selectedTab === tab.id;
            let count = 0;
            if (tab.id === 'all') count = posts.length;
            else if (tab.id === 'my_forums') {
              count = posts.filter((p) => {
                if (p.forum?.slug) return forumPrefs.joinedSlugs.includes(p.forum.slug);
                if (!p.forum_id || p.forum_id === '00000000-0000-0000-0000-000000000000') {
                  return forumPrefs.joinedSlugs.includes('general');
                }
                return false;
              }).length;
            } else if (tab.id === 'following') count = posts.filter((p) => followingIds.includes(p.author_id)).length;
            else if (tab.id === 'saved') count = posts.filter((p) => savedPostIds.includes(p.id)).length;
            else count = posts.filter((p) => p.post_type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
          {/* Live Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter feed by keywords, author, DOI, or institute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Refresh controls */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {/* Sort Toggle Buttons */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
              <button
                onClick={() => setSortMode('latest')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sortMode === 'latest'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Sort chronologically (Newest first)"
              >
                <Clock className="w-3 h-3" />
                <span>Latest</span>
              </button>

              <button
                onClick={() => setSortMode('top')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sortMode === 'top'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Sort by most upvoted posts"
              >
                <Flame className="w-3 h-3 text-orange-500" />
                <span>Top Upvoted</span>
              </button>
            </div>

            {/* Refresh Live Posts */}
            <button
              onClick={fetchLivePosts}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 transition-colors shadow-xs"
              title="Refresh timeline from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Search / Filter indicator */}
        {searchQuery && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
            <span>
              Showing {filteredAndSortedPosts.length} post{filteredAndSortedPosts.length === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Post List & Custom Empty States */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3 shadow-xs">
          {selectedTab === 'my_forums' ? (
            <>
              <SlidersHorizontal className="w-8 h-8 mx-auto text-brand-400/60" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No posts in your joined forums yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Join additional specialized forums using the &ldquo;Organize&rdquo; button in the sidebar, or publish a research update to kick off discussion.
              </p>
            </>
          ) : selectedTab === 'following' ? (
            <>
              <Users className="w-8 h-8 mx-auto text-brand-400/60" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {user ? 'No posts from researchers you follow yet' : 'Sign in to see posts from peers you follow'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {user ? (
                  <>
                    Explore the{' '}
                    <Link href="/directory" className="text-brand-600 dark:text-brand-400 underline font-medium">
                      Researchers Directory
                    </Link>{' '}
                    to discover and follow Indian researchers in your discipline.
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-brand-600 dark:text-brand-400 underline font-medium">
                      Sign in
                    </Link>{' '}
                    or register to follow researchers and build your custom peer feed.
                  </>
                )}
              </p>
            </>
          ) : selectedTab === 'saved' ? (
            <>
              <Bookmark className="w-8 h-8 mx-auto text-saffron-400/60" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No saved research posts yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bookmark intriguing papers, collaboration pitches, or protocol questions by clicking the bookmark icon on any post card.
              </p>
            </>
          ) : (
            <>
              <Sparkles className="w-8 h-8 mx-auto text-brand-400/50" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery
                  ? 'No posts matched your search terms'
                  : selectedTab === 'all'
                  ? 'No research posts yet'
                  : `No ${activeTabs.find((t) => t.id === selectedTab)?.label || 'posts'} yet`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try checking for typos or searching for a broader term like a university name, topic, or field.'
                  : 'Share your lab findings, protocols, or collaboration pitch above to get the discussion started.'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAndSortedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
