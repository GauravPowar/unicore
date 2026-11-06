// ============================================================
// FeedComposerStub – teaser composer card (Step 3 builds full)
// ============================================================
'use client';

import { PenLine } from 'lucide-react';

export function FeedComposerStub() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-dashed border-brand-300 dark:border-brand-700 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-colors group">
      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
        <PenLine className="w-4 h-4 text-brand-500" />
      </div>
      <span className="text-slate-400 dark:text-slate-500 text-sm group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
        Share a lab update, failed experiment insight, or collab pitch…
      </span>
    </div>
  );
}

