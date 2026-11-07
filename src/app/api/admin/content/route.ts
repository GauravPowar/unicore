// ============================================================
// /api/admin/content – Content Moderation (Posts & Comments)
// Decoupled Admin Authorization
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch posts with author profiles and forums
    const { data: posts, error: postErr } = await admin
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*), forum:forums(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch recent comments with author profiles
    const { data: comments, error: commentErr } = await admin
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (postErr || commentErr) {
      return NextResponse.json(
        { error: postErr?.message || commentErr?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts: posts || [],
      comments: comments || [],
    });
  } catch (error) {
    console.error('Error fetching content for moderation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('type') || 'post';
    const contentId = searchParams.get('id');

    if (!contentId) {
      return NextResponse.json({ error: 'Missing content ID' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (contentType === 'post') {
      // 1. Delete associated comments first
      await admin.from('comments').delete().eq('post_id', contentId);
      // 2. Delete associated upvotes
      await admin.from('post_upvotes').delete().eq('post_id', contentId);
      // 3. Delete the post
      const { error } = await admin.from('posts').delete().eq('id', contentId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Post and its interactions purged successfully' });
    }

    if (contentType === 'comment') {
      const { error } = await admin.from('comments').delete().eq('id', contentId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Comment purged successfully' });
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

