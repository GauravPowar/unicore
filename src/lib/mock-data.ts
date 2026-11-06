// ============================================================
// ShodhConnect – Mock Data Provider
// Used when NEXT_PUBLIC_USE_MOCK_DATA=true or Supabase keys are absent.
// Provides realistic Indian researcher data for UI development/preview.
// ============================================================

import type { Profile, Forum, Post, Comment, Message } from '@/types';

// ── Profiles ─────────────────────────────────────────────────

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    full_name: 'Dr. Priya Subramaniam',
    institution: 'Indian Institute of Science, Bengaluru',
    department: 'Centre for Ecological Sciences',
    city_state: 'Bengaluru, Karnataka',
    bio: 'Evolutionary ecologist studying plant-pollinator networks in the Western Ghats using network theory and eDNA metabarcoding.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    orcid_id: '0000-0002-1825-0097',
    is_verified_researcher: true,
    collab_status: 'open_to_collab',
    skills_offered: ['Ecological Network Analysis', 'R', 'eDNA Metabarcoding', 'Field Ecology'],
    skills_needed: ['Machine Learning', 'Remote Sensing', 'Spatial Statistics'],
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-10-01T12:00:00Z',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    full_name: 'Arjun Mehta',
    institution: 'IIT Bombay',
    department: 'Department of Electrical Engineering',
    city_state: 'Mumbai, Maharashtra',
    bio: 'PhD candidate working on neuromorphic computing architectures inspired by insect vision. Bridging neuroscience and VLSI design.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
    orcid_id: '0000-0003-2048-7360',
    is_verified_researcher: true,
    collab_status: 'looking_for_coauthor',
    skills_offered: ['VLSI Design', 'Neuromorphic Computing', 'Python', 'MATLAB'],
    skills_needed: ['Computational Neuroscience', 'Wet Lab Validation', 'Electrophysiology'],
    created_at: '2024-07-20T09:00:00Z',
    updated_at: '2024-09-15T08:00:00Z',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    full_name: 'Dr. Kavitha Rajan',
    institution: 'TIFR Hyderabad',
    department: 'Department of Chemistry',
    city_state: 'Hyderabad, Telangana',
    bio: 'Synthetic chemist specialising in MOF-based drug delivery systems and porous materials for CO₂ capture. Mentor for early-career researchers.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kavitha',
    orcid_id: '0000-0001-5678-9012',
    is_verified_researcher: true,
    collab_status: 'offering_mentorship',
    skills_offered: ['Synthetic Chemistry', 'MOF Synthesis', 'XRD Characterisation', 'Grant Writing'],
    skills_needed: ['Computational Chemistry', 'DFT Calculations', 'Machine Learning for Materials'],
    created_at: '2024-06-01T07:00:00Z',
    updated_at: '2024-10-10T14:00:00Z',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    full_name: 'Dr. Rahul Krishnamurthy',
    institution: 'NCBS Bengaluru',
    department: 'Sivaraj Bhaskaran Lab',
    city_state: 'Bengaluru, Karnataka',
    bio: 'Structural biologist using cryo-EM to study membrane proteins involved in bacterial drug resistance.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
    orcid_id: null,
    is_verified_researcher: true,
    collab_status: 'open_to_collab',
    skills_offered: ['Cryo-EM', 'Protein Purification', 'Structure Determination'],
    skills_needed: ['Molecular Dynamics', 'Drug Docking', 'Machine Learning'],
    created_at: '2024-09-01T11:00:00Z',
    updated_at: '2024-10-05T10:00:00Z',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    full_name: 'Sneha Patel',
    institution: 'IIT Delhi',
    department: 'Department of Computer Science',
    city_state: 'New Delhi, Delhi',
    bio: 'AI researcher working on explainable ML for clinical diagnosis. Passionate about open-source and reproducible research.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha',
    orcid_id: '0000-0002-9999-1234',
    is_verified_researcher: true,
    collab_status: 'open_to_collab',
    skills_offered: ['Deep Learning', 'PyTorch', 'XAI', 'Clinical NLP'],
    skills_needed: ['Clinical Data Access', 'Medical Imaging', 'Biostatistics'],
    created_at: '2024-08-05T13:00:00Z',
    updated_at: '2024-10-15T09:00:00Z',
  },
];

// ── Forums ────────────────────────────────────────────────────

export const MOCK_FORUMS: Forum[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'computational-biology',
    name: 'Computational Biology & Bioinformatics',
    description: 'From sequence analysis and structural prediction to multi-omics pipelines.',
    category: 'Wet-Meets-Dry-Lab',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'climate-earth-science',
    name: 'Climate Science & Earth Systems',
    description: 'Atmospheric modelling, monsoon dynamics, and remote sensing.',
    category: 'Niche Domain',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'grant-watch-india',
    name: 'Grant Watch India',
    description: 'DST, DBT, SERB, CSIR, ICMR funding opportunities and application tips.',
    category: 'Grant Watch',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'protocol-troubleshooting',
    name: 'Protocol Troubleshooting',
    description: 'Stuck on a Western blot? Post your protocol issues and crowdsource solutions.',
    category: 'Protocol Troubleshooting',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    slug: 'materials-nanoscience',
    name: 'Materials Science & Nanoscience',
    description: 'Synthesis, characterisation, and applications of advanced materials.',
    category: 'Niche Domain',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    slug: 'open-science-india',
    name: 'Open Science & Reproducibility',
    description: 'Pre-registration, open data, preprints, and research integrity.',
    category: 'Open Science',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// ── Posts ─────────────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    author_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    forum_id: '11111111-1111-1111-1111-111111111111',
    title: 'Calculating pollination network robustness with extinction cascades',
    content_markdown: `## Network Robustness in Plant-Pollinator Systems

Running simulated extinction cascades on our Western Ghats dataset. The robustness metric $R$ is defined as:

$$R = \\frac{1}{S} \\sum_{k=1}^{S} \\phi(k)$$

where $S$ is the number of species and $\\phi(k)$ is the fraction of species surviving after the $k$-th extinction event.

We observed a **secondary extinction threshold** at ~40% primary extinctions — consistent with Memmott *et al.* (2004) but with a sharper cliff in monsoon-dependent networks.

\`\`\`r
library(bipartite)
robustness(web, wipe.out.completeloss = TRUE, details = TRUE)
\`\`\`

Anyone else seeing bifurcation behaviour in Ghats networks?`,
    media_urls: [],
    post_type: 'question',
    upvotes_count: 14,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[0],
    forum: MOCK_FORUMS[0],
  },
  {
    id: 'post-2',
    author_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    forum_id: '55555555-5555-5555-5555-555555555555',
    title: 'Collab pitch: Neuromorphic vision chip + materials characterisation',
    content_markdown: `## Looking for a Materials Co-Investigator 🔬

We have a **working 65nm CMOS prototype** of a bio-inspired motion-detection chip. Power consumption:

$$P = C_{dyn} \\cdot V_{dd}^2 \\cdot f + V_{dd} \\cdot I_{static}$$

At $V_{dd} = 0.6\\,\\text{V}$, we hit **12 μW** per pixel column — but we need **phase-change materials** (GST or VO₂) for adaptive synaptic weights.

**What I need:**
- GST/VO₂ thin-film deposition expertise (PVD/ALD)
- Access to a probe station for in-situ resistance measurements
- Co-authorship on Nature Electronics target submission

DM me if this sounds interesting!`,
    media_urls: [],
    post_type: 'collab_pitch',
    upvotes_count: 27,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[1],
    forum: MOCK_FORUMS[4],
  },
  {
    id: 'post-3',
    author_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    forum_id: '33333333-3333-3333-3333-333333333333',
    title: 'SERB CRG 2025 — Key dates and common pitfalls',
    content_markdown: `## SERB Core Research Grant (CRG) 2025

The next CRG cycle opens **15 January 2025**. Based on three successful applications, here are the patterns:

### Common Pitfalls
1. **Objectives vs. Deliverables confusion** — reviewers want SMART milestones
2. **Budget justification** — itemise *everything*; a vague "consumables: ₹5 lakh" gets flagged
3. **Preliminary data** — if you don't have any, cite collaborative data with explicit permission

### Pro Tips
- Write the **National Importance** section first
- Keep the PI CV to published work from the last 5 years only

Happy to review drafts for early-career researchers. DM me.`,
    media_urls: [],
    post_type: 'thought',
    upvotes_count: 41,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[2],
    forum: MOCK_FORUMS[2],
  },
  {
    id: 'post-4',
    author_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    forum_id: '44444444-4444-4444-4444-444444444444',
    title: 'eDNA extraction from monsoon soil samples — persistent inhibition issue',
    content_markdown: `## Protocol SOS: Humic Acid Inhibition in Monsoon Soil eDNA

Collecting soil samples during peak monsoon = fantastic species diversity + wrecked DNA extractions.

**Problem:** PCR inhibition from humic acids even after:
- PowerSoil Pro Kit (Qiagen)
- 1:10 and 1:100 dilution series
- OneStep PCR Inhibitor Removal Kit

**Current yield:** ~8 ng/μL post-cleanup but A260/A230 still around **0.9** (should be >1.8).

\`\`\`
Sample → Bead beating (30s, 6 m/s) → PowerSoil Pro → Inhibitor removal → 1:5 dilution → qPCR
\`\`\`

Still seeing late Ct values (~35) for positive control. Any suggestions? PVP in the lysis buffer?`,
    media_urls: [],
    post_type: 'question',
    upvotes_count: 8,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[0],
    forum: MOCK_FORUMS[3],
  },
  {
    id: 'post-5',
    author_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    forum_id: null,
    title: null,
    content_markdown: `Three years ago I failed to get a single MOF crystal suitable for SCXRD. Today our paper on adaptive pore MOFs for CO₂ capture just accepted in *JACS*. 🎉

Failed experiments are data. Failed experiments are data. Failed experiments are data.

To every PhD student stuck in that valley — the other side exists. Keep going. 🙏

*(And yes, the breakthrough came from a "control" sample I almost threw away.)*`,
    media_urls: [],
    post_type: 'thought',
    upvotes_count: 89,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[2],
    forum: null,
  },
];

// ── Comments ──────────────────────────────────────────────────

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    post_id: 'post-1',
    author_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    parent_comment_id: null,
    content_markdown: `Really interesting! Have you tried computing the second derivative $\\frac{d^2\\phi}{dk^2}$ to quantify the sharpness of that cliff? Could give a single scalar for comparing networks across seasons.`,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[1],
    replies: [
      {
        id: 'comment-2',
        post_id: 'post-1',
        author_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        parent_comment_id: 'comment-1',
        content_markdown: `That's a great idea! The curvature approach would work well. I'll compute it tonight and post results. Thanks Arjun!`,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        author: MOCK_PROFILES[0],
        replies: [],
      },
    ],
  },
  {
    id: 'comment-3',
    post_id: 'post-3',
    author_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    parent_comment_id: null,
    content_markdown: `Dr. Rajan, would you be willing to review a first-time CRG application from a faculty member at a Tier-3 institution? This kind of mentorship is rare and genuinely needed.`,
    created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    author: MOCK_PROFILES[1],
    replies: [],
  },
];

// ── Messages ──────────────────────────────────────────────────

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    receiver_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    content: 'Hi Dr. Subramaniam! Loved your post on network robustness. Would you be open to a quick coffee chat about collaboration?',
    media_url: null,
    is_read: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sender: MOCK_PROFILES[1],
    receiver: MOCK_PROFILES[0],
  },
  {
    id: 'msg-2',
    sender_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    receiver_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    content: 'Sure Arjun! Happy to chat. What timezone are you in? I\'m in IST and usually free after 5pm.',
    media_url: null,
    is_read: false,
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    sender: MOCK_PROFILES[0],
    receiver: MOCK_PROFILES[1],
  },
];

// ── Data Access Helpers ───────────────────────────────────────

export const mockData = {
  getProfiles: () => MOCK_PROFILES,
  getForums: () => MOCK_FORUMS,
  getPosts: () => MOCK_POSTS,
  getPostsByForum: (forumId: string) =>
    MOCK_POSTS.filter((p) => p.forum_id === forumId),
  getPostById: (id: string) => MOCK_POSTS.find((p) => p.id === id),
  getCommentsByPost: (postId: string) =>
    MOCK_COMMENTS.filter((c) => c.post_id === postId && !c.parent_comment_id),
  getForumBySlug: (slug: string) => MOCK_FORUMS.find((f) => f.slug === slug),
  getProfileById: (id: string) => MOCK_PROFILES.find((p) => p.id === id),
  getMessages: (userId: string) =>
    MOCK_MESSAGES.filter(
      (m) => m.sender_id === userId || m.receiver_id === userId
    ),
};

/** Returns true if the app should use mock data instead of live Supabase. */
export function useMockData(): boolean {
  const flag = process.env.NEXT_PUBLIC_USE_MOCK_DATA;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use mock if flag is explicitly "true" OR if Supabase URL is missing
  return flag === 'true' || !url || url.includes('your-project-id');
}
