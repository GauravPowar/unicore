// ============================================================
// /api/account – User Account Deletion
// Permanently deletes user profile, posts, comments and auth account
// ============================================================
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Delete user posts & comments
    await admin.from('comments').delete().eq('author_id', user.id);
    await admin.from('posts').delete().eq('author_id', user.id);
    await admin.from('post_upvotes').delete().eq('user_id', user.id);
    await admin.from('messages').delete().eq('sender_id', user.id);
    await admin.from('messages').delete().eq('receiver_id', user.id);

    // 2. Delete profile
    await admin.from('profiles').delete().eq('id', user.id);

    // 3. Delete auth account
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.warn('Could not delete auth user:', deleteUserError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Account deletion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
