// ============================================================
// CreateForumModal – Modal dialog for researchers to create new forums
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Forum, ForumCategory } from '@/types';
import { X, Plus, Sparkles, Hash } from 'lucide-react';

const CATEGORIES: Array<{ value: ForumCategory; label: string }> = [
  { value: 'Niche Domain', label: 'Niche Domain' },
  { value: 'Wet-Meets-Dry-Lab', label: 'Wet-Meets-Dry-Lab' },
  { value: 'Grant Watch', label: 'Grant Watch' },
  { value: 'Protocol Troubleshooting', label: 'Protocol Troubleshooting' },
  { value: 'Career & Academia', label: 'Career & Academia' },
  { value: 'Open Science', label: 'Open Science' },
];

interface CreateForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForumCreated?: (forum: Forum) => void;
}

export function CreateForumModal({ isOpen, onClose, onForumCreated }: CreateForumModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ForumCategory>('Niche Domain');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to create a research forum.');
      window.location.href = '/login';
      return;
    }

    if (name.trim().length < 3) {
      setErrorMsg('Forum name must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/forums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create forum.');
        return;
      }

      onForumCreated?.(data.forum);
      onClose();
      router.push(`/forums/${data.forum.slug}`);
      router.refresh();
    } catch {
      setErrorMsg('Network error while creating forum.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Create a Specialized Forum
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Forum Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quantum Computing & Information"
              className="w-full text-sm px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {slug && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                <Hash className="w-3 h-3 text-slate-400" />
                Slug: /forums/{slug}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Disciplinary Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ForumCategory)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Scope &amp; Mission Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what kind of research questions, techniques, assays, or collaborative pitches belong in this space..."
              className="w-full text-xs px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Forum
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
