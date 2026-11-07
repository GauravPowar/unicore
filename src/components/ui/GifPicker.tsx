// ============================================================
// GifPicker – Interactive GIF Search & Reaction Selector
// High-efficiency animated GIF support powered by Tenor / GIPHY CDN
// 0 bytes of Supabase storage used (saves storage limits!)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, X, Flame } from 'lucide-react';

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (url: string) => void;
}

// Curated high-relevance GIFs for scientific researchers & lab reactions
const CURATED_GIFS: Record<string, string[]> = {
  science: [
    'https://media.giphy.com/media/QC7UQbxq89MnL9r6AN/giphy.gif', // Science beaker explosion
    'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', // Microscope focus
    'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif', // Scientist thinking
    'https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif', // Bill Nye science
    'https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif', // DNA replication
    'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', // Chemical reaction
  ],
  coffee: [
    'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', // Coffee pouring
    'https://media.giphy.com/media/hPTZgtzfRIB5Nfb5rL/giphy.gif', // Coffee needed
    'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif', // Cat drinking coffee
    'https://media.giphy.com/media/oZEBLugoTq09A2WU8F/giphy.gif', // Morning coffee
  ],
  accepted: [
    'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', // Confetti celebrate
    'https://media.giphy.com/media/lMameLIF8ymIjqWQR4/giphy.gif', // Yes yes yes
    'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', // Success fist pump
    'https://media.giphy.com/media/DhstvI3CH03yOTXRdC/giphy.gif', // Party celebration
  ],
  coding: [
    'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif', // Fast typing hacker
    'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', // Code working
    'https://media.giphy.com/media/L3ERvA6jWCd0qO4NdX/giphy.gif', // Debugging
  ],
  eureka: [
    'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif', // Mind blown
    'https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif', // Lightbulb moment
    'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', // Mind exploded
  ],
};

const CATEGORIES = [
  { id: 'science', label: '🔬 Science & Lab' },
  { id: 'accepted', label: '🎉 Paper Accepted' },
  { id: 'coffee', label: '☕ PhD Coffee' },
  { id: 'eureka', label: '💡 Eureka!' },
  { id: 'coding', label: '💻 Coding / Data' },
];

export function GifPicker({ isOpen, onClose, onSelectGif }: GifPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('science');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live search via Giphy / Tenor public endpoints
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Use GIPHY public beta search API
        const endpoint = `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(
          searchQuery
        )}&limit=12&rating=g`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          const urls = (json.data || []).map(
            (item: any) =>
              item.images?.fixed_height?.url ||
              item.images?.downsized?.url ||
              item.images?.original?.url
          ).filter(Boolean);
          setSearchResults(urls);
        }
      } catch (err) {
        console.warn('GIF search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const currentGifs = searchQuery.trim()
    ? searchResults
    : CURATED_GIFS[activeCategory] || CURATED_GIFS.science;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-brand-500 text-white">
              GIF
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Insert Animated GIF
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search GIFs (e.g. PCR, microscope, eureka)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
        </div>

        {/* Category Pills (when not actively searching) */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* GIF Grid */}
        <div className="max-h-72 overflow-y-auto pr-1">
          {isSearching ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching GIFs...
            </div>
          ) : currentGifs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No GIFs found. Try another search keyword.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {currentGifs.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelectGif(url);
                    onClose();
                  }}
                  className="rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 hover:opacity-90 hover:ring-2 hover:ring-brand-500 transition-all cursor-pointer relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`GIF ${i}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                    Select GIF
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>Hosted on CDN (0 bytes Supabase storage used)</span>
          <span>Powered by GIPHY</span>
        </div>
      </div>
    </div>
  );
}

