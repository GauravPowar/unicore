// ============================================================
// ReportModal – Community Reporting Dialog
// Allows researchers to report inappropriate messages or posts
// ============================================================
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ReportCategory } from '@/lib/moderation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  targetType: 'message' | 'post' | 'comment';
  targetId: string;
  contentSnippet?: string;
  reportedUserName?: string;
}

const REPORT_CATEGORIES: Array<{ id: ReportCategory; label: string; desc: string }> = [
  {
    id: 'harassment',
    label: 'Harassment or Abusive Behavior',
    desc: 'Targeted insults, intimidation, threats, or hostile communication.',
  },
  {
    id: 'spam',
    label: 'Spam, Scams or Advertisements',
    desc: 'Unsolicited commercial marketing, crypto pitches, or repetitive link flooding.',
  },
  {
    id: 'academic_misconduct',
    label: 'Academic Misconduct or Fabricated Data',
    desc: 'Plagiarism, falsified citations, or deceptive research claims.',
  },
  {
    id: 'phishing',
    label: 'Phishing or Malicious Links',
    desc: 'Deceptive external URLs designed to steal credentials or compromise accounts.',
  },
  {
    id: 'inappropriate_media',
    label: 'Inappropriate Media or Hate Speech',
    desc: 'Explicit, offensive, or discriminatory imagery or figures.',
  },
];

export function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  targetType,
  targetId,
  contentSnippet,
  reportedUserName,
}: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('harassment');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          target_type: targetType,
          target_id: targetId,
          category: selectedCategory,
          details,
          content_snippet: contentSnippet,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 1800);
      } else {
        setError(data.error || 'Failed to submit report. Please try again.');
      }
    } catch {
      setError('Connection error. Could not send report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Report {targetType === 'message' ? 'Message' : targetType === 'post' ? 'Post' : 'Content'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Report Submitted
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thank you for keeping UniCore safe and respectful. Our moderation team has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {reportedUserName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reporting content associated with{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {reportedUserName}
                </span>
                .
              </p>
            )}

            {contentSnippet && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic line-clamp-3">
                &ldquo;{contentSnippet}&rdquo;
              </div>
            )}

            {/* Category Select */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Reporting
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedCategory === cat.id
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 dark:border-brand-500/50'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_cat"
                      checked={selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="mt-0.5 text-brand-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-slate-400">{cat.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Context (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help us understand the issue..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

