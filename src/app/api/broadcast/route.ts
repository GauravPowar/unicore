// ============================================================
// /api/broadcast – Team Updates & Platform Announcements
// Public GET: Anyone can read broadcast updates
// Protected POST: Only Admin Team members can broadcast updates
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ROOT_ADMIN_IDS, ROOT_ADMIN_EMAILS } from '@/app/api/admin/team/route';

export const BROADCAST_FORUM_ID = '77777777-7777-7777-7777-777777777777';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: posts, error } = await admin
      .from('posts')
      .select('*, author:profiles(*)')
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isCallerAdmin =
      ROOT_ADMIN_IDS.includes(user.id) ||
      ROOT_ADMIN_EMAILS.includes(user.email || '') ||
      user.user_metadata?.is_admin === true ||
      user.app_metadata?.role === 'admin';

    if (!isCallerAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin team members can publish broadcasts' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content_markdown, media_urls } = body;

    if (!content_markdown || !content_markdown.trim()) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: post, error: insertError } = await admin
      .from('posts')
      .insert({
        author_id: user.id,
        forum_id: BROADCAST_FORUM_ID,
        title: title?.trim() || 'Team Update',
        content_markdown: content_markdown.trim(),
        media_urls: media_urls || [],
        post_type: 'thought',
      })
      .select('*, author:profiles(*)')
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
