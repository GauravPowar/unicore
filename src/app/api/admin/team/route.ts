// ============================================================
// /api/admin/team – Admin Team Management
// Allows Root Admin (Gaurav Sunil Powar) and designated Admins
// to add and remove members of the Core Admin Team
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const ROOT_ADMIN_IDS = ['8d3cc26d-be9a-49ae-a394-b7a4914a8911'];
export const ROOT_ADMIN_EMAILS = ['24078@iiserbpr.ac.in'];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const {
      data: { users },
      error: usersError,
    } = await admin.auth.admin.listUsers();

    if (usersError || !users) {
      return NextResponse.json({ error: 'Could not fetch users' }, { status: 500 });
    }

    // Determine if caller is an admin
    const isCallerAdmin = user
      ? ROOT_ADMIN_IDS.includes(user.id) ||
        ROOT_ADMIN_EMAILS.includes(user.email || '') ||
        user.user_metadata?.is_admin === true ||
        user.app_metadata?.role === 'admin'
      : false;

    // Fetch all profiles for metadata
    const { data: profiles } = await admin.from('profiles').select('*');
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Identify admins
    const adminList = users
      .filter(
        (u) =>
          ROOT_ADMIN_IDS.includes(u.id) ||
          ROOT_ADMIN_EMAILS.includes(u.email || '') ||
          u.user_metadata?.is_admin === true ||
          u.app_metadata?.role === 'admin'
      )
      .map((u) => {
        const prof = profileMap.get(u.id);
        const isRoot = ROOT_ADMIN_IDS.includes(u.id) || ROOT_ADMIN_EMAILS.includes(u.email || '');
        return {
          id: u.id,
          email: u.email,
          full_name: prof?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0],
          avatar_url: prof?.avatar_url || null,
          institution: prof?.institution || 'Core Development Team',
          department: prof?.department || null,
          isRootAdmin: isRoot,
          role: isRoot ? 'Lead Admin & Founder' : 'Admin Team Member',
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
      isCallerAdmin,
    });
  } catch (error) {
    console.error('Error fetching admin team:', error);
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
        { error: 'Forbidden: Only admins can manage team permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    // Prevent removing Root Admin
    if (ROOT_ADMIN_IDS.includes(targetUserId)) {
      return NextResponse.json(
        { error: 'Cannot remove Root Lead Admin from Admin Team' },
        { status: 400 }
      );
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
        role: 'user',
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

