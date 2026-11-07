// ============================================================
// /api/profile/[id] – Fetch & Update Individual Researcher Profile
// Returns public profile data and custom links for the specified user ID
// Supports PATCH to allow researchers to update name, handle, bio, etc.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    let targetId = id;
    const isUUID = id.length === 36 && id.includes('-');
    if (!isUUID) {
      const cleanLower = decodeURIComponent(id).replace(/^@/, '').toLowerCase().trim();
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const matched = (authUsers?.users || []).find(
        (u) => u.user_metadata?.username?.toLowerCase() === cleanLower
      );
      if (matched) {
        targetId = matched.id;
      }
    }

    // 1. Fetch profile from database
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Fetch target user's metadata from auth to get their specific links & username
    let links = null;
    let username = profile.username;

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(targetId);
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

export async function PATCH(req: NextRequest, { params }: ProfileParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Resolve targetId (UUID or username)
    let targetId = id;
    const isUUID = id.length === 36 && id.includes('-');
    if (!isUUID) {
      const cleanLower = decodeURIComponent(id).replace(/^@/, '').toLowerCase().trim();
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const matched = (authUsers?.users || []).find(
        (u) => u.user_metadata?.username?.toLowerCase() === cleanLower
      );
      if (matched) {
        targetId = matched.id;
      }
    }

    // Ensure user can only edit their own profile
    if (user.id !== targetId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      full_name,
      username,
      avatar_url,
      bio,
      institution,
      department,
      city_state,
      collab_status,
      skills_offered,
      skills_needed,
      links,
    } = body;

    // Validate full_name if provided
    if (full_name !== undefined) {
      if (typeof full_name !== 'string' || !full_name.trim()) {
        return NextResponse.json(
          { error: 'Full name cannot be empty' },
          { status: 400 }
        );
      }
      if (full_name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Full name must be at least 2 characters' },
          { status: 400 }
        );
      }
    }

    // Prepare profile updates
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) profileUpdates.full_name = full_name.trim();
    if (avatar_url !== undefined) profileUpdates.avatar_url = avatar_url?.trim() || null;
    if (bio !== undefined) profileUpdates.bio = bio?.trim() || null;
    if (institution !== undefined) profileUpdates.institution = institution?.trim() || null;
    if (department !== undefined) profileUpdates.department = department?.trim() || null;
    if (city_state !== undefined) profileUpdates.city_state = city_state?.trim() || null;
    if (collab_status !== undefined) profileUpdates.collab_status = collab_status;
    if (skills_offered !== undefined) profileUpdates.skills_offered = skills_offered;
    if (skills_needed !== undefined) profileUpdates.skills_needed = skills_needed;

    let cleanUsername: string | undefined = undefined;
    if (username !== undefined) {
      cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      profileUpdates.username = cleanUsername || null;
    }

    // 1. Update public.profiles table
    const { data: updatedProfile, error: profileError } = await admin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', targetId)
      .select('*')
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 2. Update auth.users metadata
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(targetId);
      const existingMeta = authUser?.user?.user_metadata || {};
      const newMeta = {
        ...existingMeta,
        ...(full_name !== undefined ? { full_name: full_name.trim(), name: full_name.trim() } : {}),
        ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
        ...(avatar_url !== undefined ? { avatar_url: avatar_url?.trim() || null } : {}),
        ...(institution !== undefined ? { institution: institution?.trim() || null } : {}),
        ...(department !== undefined ? { department: department?.trim() || null } : {}),
        ...(links !== undefined ? { links } : {}),
      };

      await admin.auth.admin.updateUserById(targetId, {
        user_metadata: newMeta,
      });
    } catch (metaErr) {
      console.warn('Could not sync user_metadata in auth:', metaErr);
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedProfile,
        links: links || null,
        username: cleanUsername || updatedProfile.username,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

