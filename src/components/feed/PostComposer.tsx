// ============================================================
// PostComposer – full featured post composer
// Markdown + KaTeX preview, post type selector, image upload
// ============================================================
'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { MarkdownContent } from '@/components/feed/MarkdownContent';
import { wordCount } from '@/lib/validators';
import { POST_TYPE_CONFIG } from '@/lib/utils';
import { OFFICIAL_FORUMS } from '@/lib/constants';
import { uploadPostMedia } from '@/lib/supabase/storage';
import type { PostType } from '@/types';
import {
  Eye,
  Edit3,
  Image as ImageIcon,
  X,
  ChevronDown,
  Upload,
} from 'lucide-react';

const MAX_WORDS = 300;
const POST_TYPES: PostType[] = ['thought', 'question', 'visual_abstract', 'collab_pitch'];

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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const words = wordCount(content);
  const overLimit = words > MAX_WORDS;
  const canSubmit = content.trim().length > 0 && !overLimit && !isSubmitting;

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
                  ? cfg.color + ' ring-1 ring-current'
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
            value={forumId}
            onChange={(e) => setForumId(e.target.value)}
            className="appearance-none text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-2 pr-6 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">General Feed</option>
            {OFFICIAL_FORUMS.map((f) => (
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
        <div className="ml-auto pb-2 flex items-center gap-1 text-xs">
          <span className={overLimit ? 'text-red-500 font-semibold' : 'text-slate-400'}>
            {words}
          </span>
          <span className="text-slate-300 dark:text-slate-600">/ {MAX_WORDS}</span>
        </div>
      </div>

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
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
          title="Attach images (or drag & drop)"
        >
          <ImageIcon className="w-4 h-4" />
          {isUploading ? 'Uploading…' : 'Image'}
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

