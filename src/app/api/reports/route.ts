// ============================================================
// /api/reports – Community Content Reporting & Abuse Submission
// Allows researchers to report abusive messages, spam, or misconduct
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ContentReport } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Please sign in to submit a report' }, { status: 401 });
    }

    const body = await req.json();
    const {
      reported_user_id,
      target_type,
      target_id,
      category,
      details,
      content_snippet,
    } = body;

    if (!reported_user_id || !target_type || !target_id || !category) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReport: ContentReport = {
      id: reportId,
      reporter_id: currentUser.id,
      reported_user_id,
      target_type,
      target_id,
      category,
      details: details?.trim() || '',
      content_snippet: content_snippet?.trim()?.slice(0, 300) || '',
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    const admin = createAdminClient();

    // 1. Fetch reported user's auth record to append report
    const { data: reportedUserResp } = await admin.auth.admin.getUserById(reported_user_id);
    if (reportedUserResp?.user) {
      const existingReports = (reportedUserResp.user.app_metadata?.reports_received as ContentReport[]) || [];
      await admin.auth.admin.updateUserById(reported_user_id, {
        app_metadata: {
          ...reportedUserResp.user.app_metadata,
          reports_received: [newReport, ...existingReports],
        },
      });
    }

    // 2. Fetch reporter to record that report was filed
    const existingFiled = (currentUser.user_metadata?.reports_filed as string[]) || [];
    await admin.auth.admin.updateUserById(currentUser.id, {
      user_metadata: {
        ...currentUser.user_metadata,
        reports_filed: [reportId, ...existingFiled],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report received. Our moderation team has been notified.',
      reportId,
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

