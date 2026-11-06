// ============================================================
// ShareModal – 1-Click Viral Sharing for Academic Circles
// WhatsApp, Copy Link, LinkedIn, and X (Twitter)
// ============================================================
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Share2,
  Copy,
  Check,
  X,
  MessageCircle,
  Users,
} from 'lucide-react';

interface ShareModalProps {
  url?: string;
  text?: string;
}

export function ShareModal({
  url,
  text = 'Explore UniCore: A new academic platform connecting researchers across India with LaTeX micro-thoughts, niche lab forums, and collaboration matching.',
}: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== 'undefined' ? window.location.origin : 'https://unicore-phi.vercel.app');

  const fullShareText = `${text}\n\n👉 Join & explore: ${shareUrl}`;

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-xs bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share with Circle
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5 z-10">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Share UniCore
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invite colleagues, lab mates, and fellow researchers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold transition-colors gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-xs font-semibold transition-colors gap-1.5"
              >
                <span className="w-4 h-4 font-bold text-blue-600 flex items-center justify-center text-xs">
                  in
                </span>
                <span>LinkedIn</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors gap-1.5"
              >
                <span className="w-4 h-4 font-bold flex items-center justify-center text-xs">
                  𝕏
                </span>
                <span>Twitter / X</span>
              </a>
            </div>

            {/* Copy Link Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 font-mono truncate focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 shrink-0 px-3.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Preview text */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                &ldquo;{text}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
