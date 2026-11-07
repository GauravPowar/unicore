// ============================================================
// PostComposer – full featured post composer
// Markdown + KaTeX preview, post type selector, image upload,
// LaTeX math quick-toolbar, and Crossref DOI citation embedder
// ============================================================
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { wordCount } from '@/lib/validators';
import { POST_TYPE_CONFIG } from '@/lib/utils';
import { OFFICIAL_FORUMS } from '@/lib/constants';
import { uploadPostMedia } from '@/lib/supabase/storage';
import type { PostType, Forum } from '@/types';
import {
  Eye,
  Edit3,
  Image as ImageIcon,
  X,
  ChevronDown,
  Upload,
  BookOpen,
  Sigma,
  Search,
  Check,
} from 'lucide-react';

const MAX_WORDS = 300;
const POST_TYPES: PostType[] = ['thought', 'question', 'visual_abstract', 'collab_pitch'];

const MATH_SYMBOLS = [
  { label: 'a/b', insert: '$\\frac{a}{b}$ ' },
  { label: '∑', insert: '$\\sum_{i=1}^{n} $ ' },
  { label: '∫', insert: '$\\int_{a}^{b} f(x)\\,dx$ ' },
  { label: '√x', insert: '$\\sqrt{x}$ ' },
  { label: '∇', insert: '$\\nabla$ ' },
  { label: 'α', insert: '$\\alpha$ ' },
  { label: 'β', insert: '$\\beta$ ' },
  { label: 'Δ', insert: '$\\Delta$ ' },
  { label: '→', insert: '$\\rightarrow$ ' },
  { label: '±', insert: '$\\pm$ ' },
  { label: '≈', insert: '$\\approx$ ' },
];

interface PostComposerProps {
  onPost?: (data: {
    content_markdown: string;
    post_type: PostType;
    forum_id?: string;
    title?: string;
    media_urls: string[];
  }) => void;
  defaultForumId?: string;
}

export function PostComposer({ onPost, defaultForumId }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState<PostType>('thought');
  const [forumId, setForumId] = useState(defaultForumId ?? '');
  const [forums, setForums] = useState<Forum[]>(OFFICIAL_FORUMS);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMathToolbar, setShowMathToolbar] = useState(false);

  // DOI citation state
  const [showDoiInput, setShowDoiInput] = useState(false);
  const [doiValue, setDoiValue] = useState('');
  const [isFetchingDoi, setIsFetchingDoi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/forums')
      .then((r) => r.json())
      .then((d) => {
        if (d.forums?.length) setForums(d.forums);
      })
      .catch(() => {});
  }, []);

  const words = wordCount(content);
  const overLimit = words > MAX_WORDS;
  const canSubmit = content.trim().length > 0 && !overLimit && !isSubmitting;

  // Insert snippet at cursor in textarea
  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) {
      setContent((prev) => prev + snippet);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = content.slice(0, start) + snippet + content.slice(end);
    setContent(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  // Crossref DOI resolver
  const handleFetchDoi = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = doiValue.trim();
    if (!raw) return;
    const cleanDoi = raw.replace(/^https?:\/\/doi\.org\//i, '').trim();

    setIsFetchingDoi(true);
    try {
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`);
      if (res.ok) {
        const json = await res.json();
        const item = json.message;
        const paperTitle = item.title?.[0] || 'Untitled Paper';
        const authors =
          item.author
            ?.slice(0, 3)
            .map((a: { family?: string }) => a.family)
            .filter(Boolean)
            .join(', ') || 'Authors';
        const year = item.issued?.['date-parts']?.[0]?.[0] || 'Year';
        const journal = item['container-title']?.[0] || '';
        const citation = `\n\n> 📄 **${paperTitle}**\n> *${authors} et al. (${year})${journal ? ` — ${journal}` : ''}*\n> [doi.org/${cleanDoi}](https://doi.org/${cleanDoi})\n\n`;

        insertSnippet(citation);
        setDoiValue('');
        setShowDoiInput(false);
      } else {
        alert('Could not locate paper with that DOI. Please verify the DOI code.');
      }
    } catch {
      alert('Network error while querying Crossref API.');
    } finally {
      setIsFetchingDoi(false);
    }
  };

  // ── Image upload handler ───────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = imageFiles.map((file) => uploadPostMedia(file));
      const urls = await Promise.all(uploadPromises);
      setMediaUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error('Failed to upload media:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      onPost?.({
        content_markdown: content,
        post_type: postType,
        forum_id: forumId || undefined,
        title: title.trim() || undefined,
        media_urls: mediaUrls,
      });
      // Reset
      setContent('');
      setTitle('');
      setMediaUrls([]);
      setPreviewMode(false);
      setShowDoiInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedConfig = POST_TYPE_CONFIG[postType];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* ── Type selector bar ────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
        {POST_TYPES.map((type) => {
          const cfg = POST_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => setPostType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                postType === type
                  ? cfg.color + ' ring-1 ring-current font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        })}

        {/* Forum selector */}
        <div className="ml-auto relative shrink-0">
          <select
            value={forumId || '00000000-0000-0000-0000-000000000000'}
            onChange={(e) => setForumId(e.target.value)}
            className="appearance-none text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-2 pr-6 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {forums
              .filter((f) => f.slug !== 'team-updates' && f.id !== '77777777-7777-7777-7777-777777777777')
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Title (for question / collab_pitch) ──────────── */}
      {(postType === 'question' || postType === 'collab_pitch') && (
        <input
          type="text"
          placeholder={
            postType === 'question'
              ? 'What is your research question?'
              : 'Give your collab pitch a headline…'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 bg-transparent border-b border-slate-100 dark:border-slate-800 focus:outline-none"
        />
      )}

      {/* ── Editor / Preview toggle ───────────────────────── */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-3">
        <button
          onClick={() => setPreviewMode(false)}
          className={`flex items-center gap-1.5 pb-2 text-xs font-medium border-b-2 transition-colors ${
            !previewMode
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Write
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          className={`flex items-center gap-1.5 pb-2 text-xs font-medium border-b-2 transition-colors ${
            previewMode
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>

        {/* Quick Math Toolbar toggle */}
        {!previewMode && (
          <button
            type="button"
            onClick={() => setShowMathToolbar((prev) => !prev)}
            className={`flex items-center gap-1 pb-2 text-xs font-medium transition-colors ${
              showMathToolbar
                ? 'text-brand-600 dark:text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Toggle LaTeX equation shortcuts"
          >
            <Sigma className="w-3.5 h-3.5" />
            LaTeX Bar
          </button>
        )}

        <div className="ml-auto pb-2 flex items-center gap-1 text-xs">
          <span className={overLimit ? 'text-red-500 font-semibold' : 'text-slate-400'}>
            {words}
          </span>
          <span className="text-slate-300 dark:text-slate-600">/ {MAX_WORDS}</span>
        </div>
      </div>

      {/* ── LaTeX Quick-Insert Toolbar ────────────────────── */}
      {showMathToolbar && !previewMode && (
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-medium mr-1 shrink-0">Insert:</span>
          {MATH_SYMBOLS.map((sym) => (
            <button
              key={sym.label}
              type="button"
              onClick={() => insertSnippet(sym.insert)}
              className="px-2 py-0.5 rounded text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 transition-colors shrink-0"
              title={`Insert ${sym.insert}`}
            >
              {sym.label}
            </button>
          ))}
        </div>
      )}

      {/* ── DOI Citation Fetcher Input ────────────────────── */}
      {showDoiInput && !previewMode && (
        <form
          onSubmit={handleFetchDoi}
          className="flex items-center gap-2 p-3 bg-brand-50/50 dark:bg-brand-950/20 border-b border-brand-100 dark:border-brand-900/40"
        >
          <BookOpen className="w-4 h-4 text-brand-500 shrink-0" />
          <input
            type="text"
            value={doiValue}
            onChange={(e) => setDoiValue(e.target.value)}
            placeholder="Paste paper DOI (e.g. 10.1038/s41586-021-03819-2 or https://doi.org/...)"
            className="flex-1 text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isFetchingDoi}
            className="text-xs shrink-0"
          >
            <Search className="w-3 h-3 mr-1" /> Embed Citation
          </Button>
          <button
            type="button"
            onClick={() => setShowDoiInput(false)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ── Textarea / Preview ────────────────────────────── */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative ${isDragging ? 'ring-2 ring-inset ring-brand-400 bg-brand-50 dark:bg-brand-900/10' : ''}`}
      >
        {previewMode ? (
          <div className="min-h-[140px] px-4 py-3">
            {content.trim() ? (
              <MarkdownContent content={content} />
            ) : (
              <p className="text-slate-400 italic text-sm">Nothing to preview yet…</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Share a lab update, failed experiment, or insight… Markdown and $\\LaTeX$ supported.

Example: The network robustness $R = \\frac{1}{S}\\sum_k \\phi(k)$ showed a sharp threshold at ~40% extinction.`}
            rows={6}
            className="w-full px-4 py-3 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none font-mono leading-relaxed"
          />
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-brand-500">
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Drop images here</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Media preview ─────────────────────────────────── */}
      {mediaUrls.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative group w-24 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <button
                onClick={() => removeMedia(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom toolbar ────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        {/* Image upload trigger */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
          title="Attach figures, gels, or diagrams"
        >
          <ImageIcon className="w-4 h-4" />
          {isUploading ? 'Uploading…' : 'Figure'}
        </button>

        {/* Cite DOI trigger */}
        <button
          type="button"
          onClick={() => setShowDoiInput((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          title="Embed paper citation by DOI"
        >
          <BookOpen className="w-4 h-4" />
          Cite DOI
        </button>

        <span className="text-xs text-slate-300 dark:text-slate-700 mx-1">|</span>

        <span className="text-xs text-slate-400">
          Markdown &amp; <span className="font-mono">$LaTeX$</span> supported
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!canSubmit}
          >
            {selectedConfig.icon} Post
          </Button>
        </div>
      </div>
    </div>
  );
}
