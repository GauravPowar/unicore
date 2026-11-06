-- =============================================================
-- ShodhConnect – Seed Data
-- Run AFTER 001_initial_schema.sql
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- FORUMS (6 Indian interdisciplinary forums)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.forums (id, slug, name, description, category) VALUES

  ('11111111-1111-1111-1111-111111111111',
   'computational-biology',
   'Computational Biology & Bioinformatics',
   'From sequence analysis and structural prediction to multi-omics pipelines. A space where wet-lab biologists and computer scientists meet.',
   'Wet-Meets-Dry-Lab'),

  ('22222222-2222-2222-2222-222222222222',
   'climate-earth-science',
   'Climate Science & Earth Systems',
   'Atmospheric modelling, monsoon dynamics, ocean-atmosphere coupling, and remote sensing. Indian climate researchers welcome.',
   'Niche Domain'),

  ('33333333-3333-3333-3333-333333333333',
   'grant-watch-india',
   'Grant Watch India',
   'DST, DBT, SERB, CSIR, ICMR, and international funding opportunities. Share calls, deadlines, and application tips.',
   'Grant Watch'),

  ('44444444-4444-4444-4444-444444444444',
   'protocol-troubleshooting',
   'Protocol Troubleshooting',
   'Stuck on a Western blot? PCR artefacts ruining your day? Post your protocol issues and crowdsource solutions from across India.',
   'Protocol Troubleshooting'),

  ('55555555-5555-5555-5555-555555555555',
   'materials-nanoscience',
   'Materials Science & Nanoscience',
   'Synthesis, characterisation, and applications of advanced materials. Covers 2D materials, perovskites, MOFs, and nanomedicine.',
   'Niche Domain'),

  ('66666666-6666-6666-6666-666666666666',
   'open-science-india',
   'Open Science & Reproducibility',
   'Pre-registration, open data, preprints, code sharing, and research integrity in the Indian academic context.',
   'Open Science');


-- ─────────────────────────────────────────────────────────────
-- SAMPLE PROFILES (3 fictional Indian researchers)
-- Note: These are seed profiles without auth.users rows.
--       In production, profiles are auto-created by the trigger.
--       Use service-role key when seeding outside trigger context.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (
  id, full_name, institution, department, city_state,
  bio, avatar_url, orcid_id, is_verified_researcher,
  collab_status, skills_offered, skills_needed
) VALUES

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Dr. Priya Subramaniam',
   'Indian Institute of Science, Bengaluru',
   'Centre for Ecological Sciences',
   'Bengaluru, Karnataka',
   'Evolutionary ecologist studying plant-pollinator networks in the Western Ghats using network theory and eDNA metabarcoding. Open to collaborations bridging field ecology with computational approaches.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
   '0000-0002-1825-0097',
   true,
   'open_to_collab',
   ARRAY['Ecological Network Analysis', 'R', 'eDNA Metabarcoding', 'Field Ecology'],
   ARRAY['Machine Learning', 'Remote Sensing', 'Spatial Statistics']),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Arjun Mehta',
   'IIT Bombay',
   'Department of Electrical Engineering',
   'Mumbai, Maharashtra',
   'PhD candidate working on neuromorphic computing architectures inspired by insect vision systems. Bridging neuroscience and VLSI design. Looking for co-authors on a Nature Electronics submission.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun',
   '0000-0003-2048-7360',
   true,
   'looking_for_coauthor',
   ARRAY['VLSI Design', 'Neuromorphic Computing', 'Python', 'MATLAB', 'Circuit Simulation'],
   ARRAY['Computational Neuroscience', 'Wet Lab Validation', 'Electrophysiology']),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Dr. Kavitha Rajan',
   'TIFR Hyderabad',
   'Department of Chemistry',
   'Hyderabad, Telangana',
   'Synthetic chemist specialising in MOF-based drug delivery systems and porous materials for CO₂ capture. Mentor for early-career researchers from underrepresented backgrounds.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=kavitha',
   '0000-0001-5678-9012',
   true,
   'offering_mentorship',
   ARRAY['Synthetic Chemistry', 'MOF Synthesis', 'XRD Characterisation', 'Drug Delivery', 'Grant Writing'],
   ARRAY['Computational Chemistry', 'DFT Calculations', 'Machine Learning for Materials']);


-- ─────────────────────────────────────────────────────────────
-- SAMPLE POSTS (5 posts across different types and forums)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.posts (
  id, author_id, forum_id, title,
  content_markdown, media_urls, post_type, upvotes_count
) VALUES

  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'Calculating pollination network robustness with extinction cascades',
   E'## Network Robustness in Plant-Pollinator Systems\n\nRunning simulated extinction cascades on our Western Ghats dataset. The robustness metric $R$ is defined as:\n\n$$R = \\frac{1}{S} \\sum_{k=1}^{S} \\phi(k)$$\n\nwhere $S$ is the number of species and $\\phi(k)$ is the fraction of species surviving after the $k$-th extinction event.\n\nWe observed a **secondary extinction threshold** at ~40% primary extinctions — consistent with Memmott *et al.* (2004) but with a sharper cliff in monsoon-dependent networks.\n\n```r\nlibrary(bipartite)\nrobustness(web, wipe.out.completeloss = TRUE, details = TRUE)\n```\n\nAnyone else seeing bifurcation behaviour in Ghats networks? Happy to share the adjacency matrices.',
   ARRAY[]::TEXT[],
   'question',
   14),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '55555555-5555-5555-5555-555555555555',
   'Collab pitch: Neuromorphic vision chip + materials characterisation',
   E'## Looking for a Materials Co-Investigator 🔬\n\nWe have a **working 65nm CMOS prototype** of a bio-inspired motion-detection chip modelled on the *Calliphora* fly optomotor response. Power consumption follows:\n\n$$P = C_{dyn} \\cdot V_{dd}^2 \\cdot f + V_{dd} \\cdot I_{static}$$\n\nAt $V_{dd} = 0.6\\,\\text{V}$, we hit **12 μW** per pixel column — but we need **phase-change materials** (GST or VO₂) for the adaptive synaptic weights.\n\n**What I need:**\n- Someone with GST/VO₂ thin-film deposition expertise (PVD/ALD)\n- Access to a probe station for in-situ resistance measurements\n- Co-authorship on Nature Electronics target submission (draft ready)\n\nDM me if this sounds interesting!',
   ARRAY[]::TEXT[],
   'collab_pitch',
   27),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff',
   'cccccccc-cccc-cccc-cccc-cccccccccccc',
   '33333333-3333-3333-3333-333333333333',
   'SERB CRG 2025 — Key dates and common pitfalls',
   E'## SERB Core Research Grant (CRG) 2025 — What You Need to Know\n\nThe next CRG cycle opens **15 January 2025**. Based on three successful CRG applications (and two rejections 😅), here are the patterns I''ve noticed:\n\n### Common Pitfalls\n1. **Objectives vs. Deliverables confusion** — reviewers want SMART milestones, not broad research questions\n2. **Budget justification** — itemise *everything*; a vague "consumables: ₹5 lakh" gets flagged every time\n3. **Preliminary data** — if you don''t have any, cite collaborative data with explicit permission\n\n### Pro Tips\n- Write the **National Importance** section first; it frames the whole proposal\n- Keep the PI CV to published work from the last 5 years only\n- Use the [ANRF portal](https://anrf.gov.in) for the new unified submission\n\nHappy to review drafts for early-career researchers from smaller institutions. DM me.',
   ARRAY[]::TEXT[],
   'thought',
   41),

  ('gggggggg-gggg-gggg-gggg-gggggggggggg',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '44444444-4444-4444-4444-444444444444',
   'eDNA extraction from monsoon soil samples — persistent inhibition issue',
   E'## Protocol SOS: Humic Acid Inhibition in Monsoon Soil eDNA\n\nCollecting soil samples from the Ghats during peak monsoon = fantastic species diversity + absolutely wrecked DNA extractions.\n\n**Problem:** PCR inhibition from humic acids even after:\n- PowerSoil Pro Kit (Qiagen)\n- 1:10 and 1:100 dilution series\n- OneStep PCR Inhibitor Removal Kit\n\n**Current yield:** ~8 ng/μL post-cleanup but A260/A230 still around **0.9** (should be >1.8).\n\n### What I''ve tried\n```\nSample → Bead beating (30s, 6 m/s) → PowerSoil Pro → Inhibitor removal → 1:5 dilution → qPCR\n```\n\nStill seeing late Ct values (~35) for positive control. Any suggestions? PVP in the lysis buffer? PVPP column? Switching to a different kit entirely?\n\n*Tagging anyone who has worked with waterlogged tropical soil eDNA.*',
   ARRAY[]::TEXT[],
   'question',
   8),

  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
   'cccccccc-cccc-cccc-cccc-cccccccccccc',
   NULL,
   NULL,
   E'Three years ago I failed to get a single MOF crystal suitable for SCXRD. Today our paper on adaptive pore MOFs for CO₂ capture just accepted in *JACS*. 🎉\n\nFailed experiments are data. Failed experiments are data. Failed experiments are data.\n\nTo every PhD student stuck in that valley — the other side exists. Keep going. 🙏\n\n*(And yes, the breakthrough came from a "control" sample I almost threw away.)*',
   ARRAY[]::TEXT[],
   'thought',
   89);


-- ─────────────────────────────────────────────────────────────
-- SAMPLE COMMENTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.comments (id, post_id, author_id, parent_comment_id, content_markdown) VALUES

  ('11112222-1111-1111-1111-111111111111',
   'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   NULL,
   E'Really interesting! Have you tried computing the second derivative $\\frac{d^2\\phi}{dk^2}$ to quantify the sharpness of that cliff? Could give a single scalar for comparing networks across seasons.'),

  ('22221111-2222-2222-2222-222222222222',
   'dddddddd-dddd-dddd-dddd-dddddddddddd',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11112222-1111-1111-1111-111111111111',
   E'That''s a great idea! The curvature approach would work well. I''ll compute it tonight and post results. Thanks Arjun!'),

  ('33331111-3333-3333-3333-333333333333',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   NULL,
   E'Dr. Rajan, would you be willing to review a first-time CRG application from a faculty member at a Tier-3 institution? This kind of mentorship is rare and genuinely needed.');
