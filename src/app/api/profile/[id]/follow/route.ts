// ============================================================
// /api/profile/[id]/follow – Real Social Graph (Followers & Following)
// 100% Live Real User Data (Zero Mock Data)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface FollowParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: FollowParams) {
  try {
    const { id: targetProfileId } = await params;
    if (!targetProfileId) {
      return NextResponse.json({ error: 'Missing profile ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const {
      data: { users },
      error: usersErr,
    } = await admin.auth.admin.listUsers();

    if (usersErr || !users) {
      return NextResponse.json({ followersCount: 0, followingCount: 0, isFollowing: false });
    }

    const targetUser = users.find((u) => u.id === targetProfileId);
    const targetFollowing: string[] = (targetUser?.user_metadata?.following as string[]) || [];

    // Following count: how many people targetUser follows
    const followingCount = targetFollowing.length;

    // Followers count: how many registered users follow targetUser
    const followers = users.filter((u) => {
      const followingList: string[] = (u.user_metadata?.following as string[]) || [];
      return followingList.includes(targetProfileId);
    });
    const followersCount = followers.length;

    // Does the current logged in user follow targetUser?
    const currentFollowing: string[] = (currentUser?.user_metadata?.following as string[]) || [];
    const isFollowing = currentUser ? currentFollowing.includes(targetProfileId) : false;

    return NextResponse.json({
      followersCount,
      followingCount,
      isFollowing,
    });
  } catch (error) {
    console.error('Error in follow GET:', error);
    return NextResponse.json({ followersCount: 0, followingCount: 0, isFollowing: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: FollowParams) {
  try {
    const { id: targetProfileId } = await params;
    if (!targetProfileId) {
      return NextResponse.json({ error: 'Missing profile ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.id === targetProfileId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body; // 'follow' or 'unfollow'

    const admin = createAdminClient();
    const {
      data: { user: dbUser },
    } = await admin.auth.admin.getUserById(currentUser.id);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentFollowing: string[] = (dbUser.user_metadata?.following as string[]) || [];
    let updatedFollowing: string[];

    if (action === 'follow') {
      updatedFollowing = Array.from(new Set([...currentFollowing, targetProfileId]));
    } else {
      updatedFollowing = currentFollowing.filter((id) => id !== targetProfileId);
    }

    // Persist to user metadata
    await admin.auth.admin.updateUserById(currentUser.id, {
      user_metadata: {
        ...dbUser.user_metadata,
        following: updatedFollowing,
      },
    });

    // Recompute counts across all users
    const {
      data: { users },
    } = await admin.auth.admin.listUsers();

    const targetUser = users?.find((u) => u.id === targetProfileId);
    const targetFollowing: string[] = (targetUser?.user_metadata?.following as string[]) || [];
    const followingCount = targetFollowing.length;

    const followers = (users || []).filter((u) => {
      const fList: string[] = u.id === currentUser.id
        ? updatedFollowing
        : ((u.user_metadata?.following as string[]) || []);
      return fList.includes(targetProfileId);
    });
    const followersCount = followers.length;

    return NextResponse.json({
      success: true,
      followersCount,
      followingCount,
      isFollowing: action === 'follow',
    });
  } catch (error) {
    console.error('Error in follow POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
