// ============================================================
// /directory – Researcher Directory (Server Component)
// Live Supabase integration with zero mock data
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DirectoryClient } from '@/components/directory/DirectoryClient';
import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Researcher Directory | ResearchSetu',
  description: 'Discover verified faculty, postdocs, and PhD researchers across Indian institutions',
};

export default async function DirectoryPage() {
  let profiles: Profile[] = [];

  try {
    const admin = createAdminClient();
    const { data: dbProfiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbProfiles) {
      try {
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
        const userMap = new Map((authUsers?.users || []).map((u) => [u.id, u]));

        profiles = dbProfiles.map((p) => {
          const authUser = userMap.get(p.id);
          const emailParts = authUser?.email ? authUser.email.split('@') : [];
          const domain = emailParts.length > 1 ? emailParts[1].toLowerCase().trim() : null;
          return {
            ...p,
            username: p.username || authUser?.user_metadata?.username || null,
            email_domain: domain,
          } as Profile;
        });
      } catch {
        profiles = dbProfiles as Profile[];
      }
    }
  } catch (err) {
    console.error('Error loading live profiles:', err);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-brand-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Researcher Directory
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Find collaborators across Indian universities, IITs, IISc, CSIR labs, and institutes.
        </p>
      </div>

      <DirectoryClient profiles={profiles} />
    </div>
  );
}
