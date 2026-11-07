// ============================================================
// /api/admin/reports – Admin Content Reports & Moderation Queue
// Decoupled admin authorization
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ContentReport } from '@/lib/moderation';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

    const allReports: ContentReport[] = [];
    const userMap = new Map((authData?.users || []).map((u) => [u.id, u]));

    (authData?.users || []).forEach((u) => {
      const reports = (u.app_metadata?.reports_received as ContentReport[]) || [];
      allReports.push(...reports);
    });

    // Fetch profiles for names
    const { data: profiles } = await admin.from('profiles').select('id, full_name, avatar_url, username');
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Enrich reports with user details
    const enrichedReports = allReports.map((rep) => {
      const reportedUser = userMap.get(rep.reported_user_id);
      const reportedProfile = profileMap.get(rep.reported_user_id);
      const reporterProfile = profileMap.get(rep.reporter_id);

      return {
        ...rep,
        reportedUser: {
          id: rep.reported_user_id,
          name: reportedProfile?.full_name || reportedUser?.email || 'Unknown',
          email: reportedUser?.email || null,
          username: reportedProfile?.username || null,
          avatar_url: reportedProfile?.avatar_url || null,
        },
        reporter: {
          id: rep.reporter_id,
          name: reporterProfile?.full_name || 'Researcher',
          avatar_url: reporterProfile?.avatar_url || null,
        },
      };
    });

    // Sort newest reports first
    enrichedReports.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ reports: enrichedReports });
  } catch (error) {
    console.error('Error fetching admin reports:', error);
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
    const { reportId, reportedUserId, action } = body;

    if (!reportId || !reportedUserId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: userResp } = await admin.auth.admin.getUserById(reportedUserId);

    if (!userResp?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = userResp.user;
    const existingReports = (targetUser.app_metadata?.reports_received as ContentReport[]) || [];

    const updatedReports = existingReports.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status: action === 'dismiss' ? ('dismissed' as const) : ('action_taken' as const),
        };
      }
      return r;
    });

    await admin.auth.admin.updateUserById(reportedUserId, {
      app_metadata: {
        ...targetUser.app_metadata,
        reports_received: updatedReports,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report marked as ${action === 'dismiss' ? 'Dismissed' : 'Action Taken'}`,
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

