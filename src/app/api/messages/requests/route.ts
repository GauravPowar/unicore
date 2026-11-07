// ============================================================
// /api/messages/requests – Server-side Message Request Management
// Reliably persists Accept and Decline state using Supabase Admin
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ accepted: [], ignored: [] });
    }

    const accepted: string[] = (user.user_metadata?.accepted_requests as string[]) || [];
    const ignored: string[] = (user.user_metadata?.ignored_requests as string[]) || [];

    return NextResponse.json({ accepted, ignored });
  } catch (error) {
    console.error('Error fetching message requests state:', error);
    return NextResponse.json({ accepted: [], ignored: [] }, { status: 500 });
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

    const body = await req.json();
    const { action, partnerId } = body;

    if (!action || !partnerId) {
      return NextResponse.json({ error: 'Missing action or partnerId' }, { status: 400 });
    }

    const admin = createAdminClient();
    const currentAccepted: string[] = (user.user_metadata?.accepted_requests as string[]) || [];
    const currentIgnored: string[] = (user.user_metadata?.ignored_requests as string[]) || [];

    let updatedAccepted = currentAccepted;
    let updatedIgnored = currentIgnored;

    if (action === 'accept') {
      updatedAccepted = Array.from(new Set([...currentAccepted, partnerId]));
      updatedIgnored = currentIgnored.filter((id) => id !== partnerId);
    } else if (action === 'decline') {
      updatedIgnored = Array.from(new Set([...currentIgnored, partnerId]));
      updatedAccepted = currentAccepted.filter((id) => id !== partnerId);
    }

    // Persist to user metadata using admin client
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        accepted_requests: updatedAccepted,
        ignored_requests: updatedIgnored,
      },
    });

    return NextResponse.json({
      success: true,
      accepted: updatedAccepted,
      ignored: updatedIgnored,
    });
  } catch (error) {
    console.error('Error modifying message request state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
