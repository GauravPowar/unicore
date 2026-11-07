// ============================================================
// UniCore – Shared TypeScript Types
// Mirrors the PostgreSQL schema in supabase/migrations/001_initial_schema.sql
// ============================================================

export type CollabStatus =
  | 'open_to_collab'
  | 'offering_mentorship'
  | 'looking_for_coauthor'
  | 'busy';

export type PostType = 'thought' | 'question' | 'visual_abstract' | 'collab_pitch';

export type ForumCategory =
  | 'Niche Domain'
  | 'Wet-Meets-Dry-Lab'
  | 'Grant Watch'
  | 'Protocol Troubleshooting'
  | 'Career & Academia'
  | 'Open Science';

// ── Database Row Types ────────────────────────────────────────

export interface ProfileLinks {
  labWebsite?: string;
  googleScholar?: string;
  githubUrl?: string;
  personalWebsite?: string;
}

export interface Profile {
  id: string;
  username?: string | null;
  full_name: string;
  institution: string | null;
  department: string | null;
  city_state: string | null;
  bio: string | null;
  avatar_url: string | null;
  orcid_id: string | null;
  is_verified_researcher: boolean;
  collab_status: CollabStatus;
  skills_offered: string[];
  skills_needed: string[];
  links?: ProfileLinks | null;
  created_at: string;
  updated_at: string;
}

export interface Forum {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ForumCategory;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  forum_id: string | null;
  title: string | null;
  content_markdown: string;
  media_urls: string[];
  post_type: PostType;
  upvotes_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields (optional, populated by queries)
  author?: Profile;
  forum?: Forum | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content_markdown: string;
  created_at: string;
  // Joined fields
  author?: Profile;
  replies?: Comment[];
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  // Joined
  sender?: Profile;
  receiver?: Profile;
}

// ── UI / Form Types ───────────────────────────────────────────

export interface PostComposerValues {
  content_markdown: string;
  post_type: PostType;
  forum_id?: string;
  title?: string;
  media_urls: string[];
}

export interface DirectoryFilters {
  search: string;
  institution: string;
  collab_status: CollabStatus | '';
  skill_offered: string;
  skill_needed: string;
}

