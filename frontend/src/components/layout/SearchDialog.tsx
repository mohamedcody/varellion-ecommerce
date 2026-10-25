'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowLeft, Watch, Wallet, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Dialog } from '@/components/ui/Dialog';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  { label: 'ساعة رجالية كلاسيك جلد طبيعي', category: 'watches', href: '/products?search=classic-watch' },
  { label: 'محفظة كروت جلد طبيعي بحماية RFID', category: 'leather-goods', href: '/products?search=rfid-wallet' },
  { label: 'ساعة كرونوغراف ستانلس ستيل مقاومة للماء', category: 'watches', href: '/products?search=chronograph' },
  { label: 'حامل بطاقات ذكي ألومنيوم وجلد', category: 'leather-goods', href: '/products?search=cardholder' },
  { label: 'أزرار أكمام وإكسسوارات بدل رجالية', category: 'accessories', href: '/products?search=cufflinks' },
];

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredSearches = query.trim()
    ? POPULAR_SEARCHES.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : POPULAR_SEARCHES;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="p-0 overflow-hidden max-w-xl">
      <div className="border-b border-border p-4 bg-card">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) {
              router.push(`/products?search=${encodeURIComponent(query.trim())}`);
              onClose();
            }
          }}
          className="flex items-center gap-3"
          role="search"
        >
          <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن ساعة، محفظة، إكسسوار معين…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            spellCheck={false}
            autoComplete="off"
            aria-label="البحث عن منتجات VARELLION"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
              aria-label="مسح نص البحث"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </form>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{query ? 'نتائج مقترحة' : 'عمليات البحث الأكثر شيوعاً في مصر'}</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>منتجات أصلية 100%</span>
          </span>
        </div>

        <ul className="space-y-1" role="list">
          {filteredSearches.map((item, index) => (
            <li key={index}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  {item.category === 'watches' ? (
                    <Watch className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
                  ) : (
                    <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </div>
                <ArrowLeft
                  className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
          {filteredSearches.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              لا توجد نتائج مطابقة لـ &ldquo;{query}&rdquo;. جرب كلمات أخرى مثل &ldquo;ساعة&rdquo; أو &ldquo;محفظة&rdquo;.
            </div>
          )}
        </ul>
      </div>

      <div className="border-t border-border/80 bg-muted/40 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>اضغط <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">ESC</kbd> للإغلاق</span>
        <Link
          href="/products"
          onClick={onClose}
          className="font-medium text-primary hover:underline"
        >
          عرض الكتالوج بالكامل
        </Link>
      </div>
    </Dialog>
  );
}
