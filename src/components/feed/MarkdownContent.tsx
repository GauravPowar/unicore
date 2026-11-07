// ============================================================
// MarkdownContent – renders Markdown + LaTeX (KaTeX)
// Client Component (react-markdown requires client context)
// ============================================================
'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={`prose-researchsetu text-sm leading-relaxed ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Open links in new tab
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Prevent images from breaking layout
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ''}
              className="rounded-lg max-w-full h-auto my-2"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

