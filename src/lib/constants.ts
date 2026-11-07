// ============================================================
// ResearchSetu – Core Constants
// ============================================================
import type { Forum } from '@/types';

export const OFFICIAL_FORUMS: Forum[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    slug: 'general',
    name: 'General Discussion & Micro-Thoughts',
    description: 'Interdisciplinary micro-thoughts, general queries, and community announcements across all disciplines.',
    category: 'Career & Academia',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'computational-biology',
    name: 'Computational Biology & Bioinformatics',
    description: 'Sequence analysis, structural prediction, and multi-omics pipelines.',
    category: 'Wet-Meets-Dry-Lab',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'climate-earth-science',
    name: 'Climate Science & Earth Systems',
    description: 'Atmospheric modelling, monsoon dynamics, and remote sensing.',
    category: 'Niche Domain',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'grant-watch-india',
    name: 'Grant Watch India',
    description: 'DST, DBT, SERB, CSIR, ICMR, and international funding opportunities.',
    category: 'Grant Watch',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'protocol-troubleshooting',
    name: 'Protocol Troubleshooting',
    description: 'Troubleshoot assays, PCR, blots, and crowdsource solutions.',
    category: 'Protocol Troubleshooting',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    slug: 'materials-nanoscience',
    name: 'Materials Science & Nanoscience',
    description: 'Synthesis, characterisation, perovskites, and 2D materials.',
    category: 'Niche Domain',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    slug: 'open-science-india',
    name: 'Open Science & Reproducibility',
    description: 'Preprints, open data, and research integrity in India.',
    category: 'Open Science',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    slug: 'team-updates',
    name: 'ResearchSetu Team Updates',
    description: 'Official broadcast channel for new platform features, releases, and announcements.',
    category: 'Career & Academia',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const ROOT_ADMIN_IDS: string[] = (process.env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
export const ROOT_ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

