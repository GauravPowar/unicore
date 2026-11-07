// ============================================================
// ResearchSetu – Forum Icon Mappings
// ============================================================
import React from 'react';
import {
  MessageSquare,
  FlaskConical,
  Globe,
  TrendingUp,
  Wrench,
  BookOpen,
  FileSearch,
  Megaphone,
  Atom,
  Dna,
  Cpu,
  Layers,
} from 'lucide-react';

export const FORUM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'general': MessageSquare,
  'computational-biology': FlaskConical,
  'climate-earth-science': Globe,
  'grant-watch-india': TrendingUp,
  'protocol-troubleshooting': Wrench,
  'materials-nanoscience': BookOpen,
  'open-science-india': FileSearch,
  'team-updates': Megaphone,
  'physics': Atom,
  'genomics': Dna,
  'ai-computing': Cpu,
  'interdisciplinary': Layers,
};

export function getForumIcon(slug: string): React.ComponentType<{ className?: string }> {
  return FORUM_ICONS[slug] || BookOpen;
}

