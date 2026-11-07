// ============================================================
// /api/forums – Create & List Specialized Forums
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ForumCategory } from '@/types';

const VALID_CATEGORIES: ForumCategory[] = [
  'Niche Domain',
  'Wet-Meets-Dry-Lab',
  'Grant Watch',
  'Protocol Troubleshooting',
  'Career & Academia',
  'Open Science',
];

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: forums, error } = await admin
      .from('forums')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ forums });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch forums';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to create an interdisciplinary forum.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, category, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Forum name must be at least 3 characters.' },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const cleanSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const admin = createAdminClient();

    // Check if slug already exists
    const { data: existing } = await admin
      .from('forums')
      .select('id, slug')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `A forum with the URL "/forums/${cleanSlug}" already exists.` },
        { status: 400 }
      );
    }

    const newForum = {
      id: crypto.randomUUID(),
      slug: cleanSlug,
      name: name.trim(),
      description: description?.trim() || null,
      category,
    };

    const { data: created, error: insertError } = await admin
      .from('forums')
      .insert(newForum)
      .select()
      .single();

    if (insertError) {
      console.error('Forum insertion error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ forum: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Forum creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
