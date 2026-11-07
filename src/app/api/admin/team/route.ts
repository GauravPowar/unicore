// ============================================================
// /api/admin/team – Admin Team Management
// Decoupled from personal accounts
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    const admin = createAdminClient();
    const {
      data: { users },
      error: usersError,
    } = await admin.auth.admin.listUsers();

    if (usersError || !users) {
      return NextResponse.json({ error: 'Could not fetch users' }, { status: 500 });
    }

    // Fetch all profiles for metadata
    const { data: profiles } = await admin.from('profiles').select('*');
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Identify admins by role or metadata (zero personal IDs hardcoded)
    const adminList = users
      .filter(
        (u) =>
          u.user_metadata?.is_admin === true ||
          u.app_metadata?.role === 'admin'
      )
      .map((u) => {
        const prof = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          full_name: prof?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0],
          avatar_url: prof?.avatar_url || null,
          institution: prof?.institution || 'ResearchSetu Team',
          department: prof?.department || null,
          isRootAdmin: false,
          role: 'Admin Team Member',
        };
      });

    // All registered researchers for the "Add Admin" selector
    const candidates = users.map((u) => {
      const prof = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        full_name: prof?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0],
        avatar_url: prof?.avatar_url || null,
        institution: prof?.institution || null,
        department: prof?.department || null,
        isAdmin: adminList.some((a) => a.id === u.id),
      };
    });

    return NextResponse.json({
      admins: adminList,
      candidates,
      isCallerAdmin: auth.isAdmin,
    });
  } catch (error) {
    console.error('Error fetching admin team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin team members can add new admins' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    const admin = createAdminClient();
    const {
      data: { user: targetUser },
      error: fetchErr,
    } = await admin.auth.admin.getUserById(targetUserId);

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Grant Admin rights
    await admin.auth.admin.updateUserById(targetUserId, {
      user_metadata: {
        ...targetUser.user_metadata,
        is_admin: true,
      },
      app_metadata: {
        ...targetUser.app_metadata,
        role: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Granted admin privileges to ${targetUser.email || targetUserId}`,
    });
  } catch (error) {
    console.error('Error adding admin member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin team members can revoke admins' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const admin = createAdminClient();
    const {
      data: { user: targetUser },
      error: fetchErr,
    } = await admin.auth.admin.getUserById(targetUserId);

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Revoke Admin rights
    await admin.auth.admin.updateUserById(targetUserId, {
      user_metadata: {
        ...targetUser.user_metadata,
        is_admin: false,
      },
      app_metadata: {
        ...targetUser.app_metadata,
        role: 'authenticated',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Revoked admin privileges from ${targetUser.email || targetUserId}`,
    });
  } catch (error) {
    console.error('Error removing admin member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
