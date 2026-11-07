-- =============================================================
-- UniCore – Initial Database Schema
-- Migration: 001_initial_schema.sql
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- trigram index for full-text search

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE collab_status_enum AS ENUM (
  'open_to_collab',
  'offering_mentorship',
  'looking_for_coauthor',
  'busy'
);

CREATE TYPE post_type_enum AS ENUM (
  'thought',
  'question',
  'visual_abstract',
  'collab_pitch'
);

CREATE TYPE forum_category_enum AS ENUM (
  'Niche Domain',
  'Wet-Meets-Dry-Lab',
  'Grant Watch',
  'Protocol Troubleshooting',
  'Career & Academia',
  'Open Science'
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: profiles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  institution           TEXT,
  department            TEXT,
  city_state            TEXT,
  bio                   TEXT,
  avatar_url            TEXT,                       -- Supabase Storage public URL
  orcid_id              TEXT CHECK (
                          orcid_id IS NULL OR
                          orcid_id ~ '^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$'
                        ),
  is_verified_researcher BOOLEAN NOT NULL DEFAULT false,
  collab_status         collab_status_enum DEFAULT 'open_to_collab',
  skills_offered        TEXT[] DEFAULT '{}',
  skills_needed         TEXT[] DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- TABLE: forums
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.forums (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  category    forum_category_enum NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forums_slug ON public.forums (slug);
CREATE INDEX idx_forums_category ON public.forums (category);

-- ─────────────────────────────────────────────────────────────
-- TABLE: posts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  forum_id         UUID REFERENCES public.forums(id) ON DELETE SET NULL,
  title            TEXT,
  content_markdown TEXT NOT NULL,
  media_urls       TEXT[] DEFAULT '{}',             -- Supabase Storage public URLs
  post_type        post_type_enum NOT NULL DEFAULT 'thought',
  upvotes_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_posts_author_id ON public.posts (author_id);
CREATE INDEX idx_posts_forum_id  ON public.posts (forum_id);
CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
-- Full-text search index on content
CREATE INDEX idx_posts_content_trgm ON public.posts USING GIN (content_markdown gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────
-- TABLE: comments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.comments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id           UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,  -- nullable for nested replies
  content_markdown  TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id    ON public.comments (post_id);
CREATE INDEX idx_comments_parent_id  ON public.comments (parent_comment_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE: messages
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  media_url   TEXT,                                 -- Supabase Storage public URL (optional)
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_messages_sender_id   ON public.messages (sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages (receiver_id);
CREATE INDEX idx_messages_created_at  ON public.messages (created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- TABLE: post_upvotes  (prevents duplicate upvotes)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.post_upvotes (
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Trigger to sync upvotes_count
CREATE OR REPLACE FUNCTION public.sync_upvotes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET upvotes_count = upvotes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER upvotes_count_sync
  AFTER INSERT OR DELETE ON public.post_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_upvotes_count();

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: auto-create profile on signup
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  email_domain TEXT;
  verified     BOOLEAN := false;
BEGIN
  -- Extract domain from email
  email_domain := split_part(NEW.email, '@', 2);

  -- Check Indian academic/research domain
  IF email_domain LIKE '%.ac.in'
  OR email_domain LIKE '%.edu.in'
  OR email_domain LIKE '%.res.in' THEN
    verified := true;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    institution,
    department,
    orcid_id,
    collab_status,
    is_verified_researcher
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'institution',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'orcid_id',
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'collab_status', '')::collab_status_enum,
      'open_to_collab'::collab_status_enum
    ),
    verified
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_upvotes ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────
-- Public can read all profiles
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── forums ────────────────────────────────────────────────────
-- Forums are publicly readable
CREATE POLICY "forums_select_all"
  ON public.forums FOR SELECT USING (true);

-- Only authenticated users can insert forums (admin-controlled in prod via service role)
CREATE POLICY "forums_insert_authenticated"
  ON public.forums FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── posts ─────────────────────────────────────────────────────
-- Public feed: all posts are readable
CREATE POLICY "posts_select_all"
  ON public.posts FOR SELECT USING (true);

-- Only authenticated users can create posts
CREATE POLICY "posts_insert_authenticated"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update and delete their own posts
CREATE POLICY "posts_update_own"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "posts_delete_own"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- ── comments ──────────────────────────────────────────────────
CREATE POLICY "comments_select_all"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "comments_insert_authenticated"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id);

-- ── messages ──────────────────────────────────────────────────
-- Users can only see messages they sent or received
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert_authenticated"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_read_status"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);  -- only receiver marks as read

-- ── post_upvotes ──────────────────────────────────────────────
CREATE POLICY "upvotes_select_all"
  ON public.post_upvotes FOR SELECT USING (true);

CREATE POLICY "upvotes_insert_own"
  ON public.post_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "upvotes_delete_own"
  ON public.post_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- STORAGE: post-media bucket & policies
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Anyone can view media files
DROP POLICY IF EXISTS "Public media access" ON storage.objects;
CREATE POLICY "Public media access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

-- Authenticated users can upload media
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- REALTIME: enable publication for DMs
-- ─────────────────────────────────────────────────────────────
-- Add tables to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

