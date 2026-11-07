// ============================================================
// /api/admin/users – User Management & Moderation
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

    // 1. Fetch all profiles
    const { data: profiles, error: profileErr } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 2. Fetch auth users to get emails and metadata
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const authUserMap = new Map((authData?.users || []).map((u) => [u.id, u]));

    // 3. Fetch post counts per user
    const { data: postsData } = await admin.from('posts').select('author_id');
    const postCountMap = new Map<string, number>();
    (postsData || []).forEach((p) => {
      postCountMap.set(p.author_id, (postCountMap.get(p.author_id) || 0) + 1);
    });

    const enrichedUsers = (profiles || []).map((p) => {
      const authUser = authUserMap.get(p.id);
      const isUserAdmin =
        authUser?.app_metadata?.role === 'admin' ||
        authUser?.user_metadata?.is_admin === true;

      return {
        id: p.id,
        email: authUser?.email || null,
        full_name: p.full_name,
        username: p.username || null,
        institution: p.institution || null,
        department: p.department || null,
        avatar_url: p.avatar_url || null,
        is_verified_researcher: p.is_verified_researcher || false,
        isAdmin: isUserAdmin,
        collab_status: p.collab_status,
        orcid_id: p.orcid_id || null,
        postsCount: postCountMap.get(p.id) || 0,
        created_at: p.created_at,
      };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action, value } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (action === 'toggle_verified') {
      const newStatus = Boolean(value);
      const { data, error } = await admin
        .from('profiles')
        .update({ is_verified_researcher: newStatus })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated verification status to ${newStatus ? 'Verified' : 'Unverified'}`,
        profile: data,
      });
    }

    if (action === 'toggle_admin') {
      const newAdminStatus = Boolean(value);
      const { data: userResp, error: fetchErr } = await admin.auth.admin.getUserById(userId);

      if (fetchErr || !userResp?.user) {
        return NextResponse.json({ error: 'User not found in auth' }, { status: 404 });
      }

      const targetUser = userResp.user;
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser.user_metadata,
          is_admin: newAdminStatus,
        },
        app_metadata: {
          ...targetUser.app_metadata,
          role: newAdminStatus ? 'admin' : 'authenticated',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Admin access ${newAdminStatus ? 'granted' : 'revoked'}`,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Delete from auth.users (cascades to profile, posts, comments, upvotes, messages)
    const { error: deleteAuthErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthErr) {
      // Fallback: manually delete from profiles if auth delete had error
      await admin.from('profiles').delete().eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      message: `User ${userId} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

