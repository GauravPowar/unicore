// ============================================================
// /api/broadcast – Team Updates & Platform Announcements
// Public GET: Anyone can read broadcast updates
// Protected POST: Authorized admins can broadcast updates
// Decoupled from any hardcoded personal account
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/adminAuth';

export const BROADCAST_FORUM_ID = '77777777-7777-7777-7777-777777777777';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: posts, error } = await admin
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .eq('forum_id', BROADCAST_FORUM_ID)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ broadcasts: posts || [] });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await verifyAdminRequest(req);
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to publish broadcasts' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content_markdown, media_urls } = body;

    if (!content_markdown || !content_markdown.trim()) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Determine author ID:
    // If authenticated user is present, use their id.
    // Otherwise fallback to an existing admin profile or first profile in database.
    let authorId = adminAuth.userId;
    if (!authorId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        authorId = user.id;
      } else {
        // Fallback to any profile in database so foreign key is satisfied
        const { data: profs } = await admin.from('profiles').select('id').limit(1);
        authorId = profs?.[0]?.id;
      }
    }

    if (!authorId) {
      return NextResponse.json({ error: 'No author profile found in database' }, { status: 400 });
    }

    const { data: post, error: insertError } = await admin
      .from('posts')
      .insert({
        author_id: authorId,
        forum_id: BROADCAST_FORUM_ID,
        title: title?.trim() || 'UniCore Team Update',
        content_markdown: content_markdown.trim(),
        media_urls: media_urls || [],
        post_type: 'thought',
      })
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ broadcast: post });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
