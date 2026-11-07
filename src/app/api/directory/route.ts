// ============================================================
// /api/directory – Enriched Researcher Directory Data
// Returns public profiles enriched with @username and @email_domain
// ============================================================
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Fetch profiles from database
    const { data: dbProfiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch auth users to get usernames & institutional email domains
    let authUserMap = new Map<string, { username?: string | null; emailDomain?: string | null }>();
    try {
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      (authUsers?.users || []).forEach((u) => {
        const emailParts = u.email ? u.email.split('@') : [];
        const domain = emailParts.length > 1 ? emailParts[1].toLowerCase().trim() : null;
        authUserMap.set(u.id, {
          username: u.user_metadata?.username || null,
          emailDomain: domain,
        });
      });
    } catch (err) {
      console.warn('Could not list auth users for directory enrichment:', err);
    }

    const enrichedProfiles: Profile[] = (dbProfiles || []).map((p) => {
      const authInfo = authUserMap.get(p.id);
      return {
        ...p,
        username: p.username || authInfo?.username || null,
        email_domain: authInfo?.emailDomain || null,
      } as Profile;
    });

    return NextResponse.json({ profiles: enrichedProfiles });
  } catch (error) {
    console.error('Error fetching directory profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

