// ============================================================
// /api/profile/[id] – Fetch Individual Researcher Profile & Links
// Returns public profile data and custom links for the specified user ID
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ProfileParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: ProfileParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch profile from database
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch target user's metadata from auth to get their specific links & username
    let links = null;
    let username = profile.username;

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(id);
      if (authUser?.user) {
        links = authUser.user.user_metadata?.links || null;
        if (!username) {
          username = authUser.user.user_metadata?.username || null;
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      profile: {
        ...profile,
        links,
        username,
      },
    });
  } catch (error) {
    console.error('Error fetching profile API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

