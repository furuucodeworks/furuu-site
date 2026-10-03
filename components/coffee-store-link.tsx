'use client';

import { ArrowUpRight } from 'lucide-react';
import { useSiteNotice } from '@/components/site-frame';
import { onlineStoreUrl } from '@/lib/online-store';

/**
 * 04 向け：まだ決まらない方のオンラインストア入口。
 * URL は lib/online-store.ts の onlineStoreUrl を使います。
 */
export function CoffeeStoreLink() {
  const { openPreview } = useSiteNotice();
  const href = onlineStoreUrl.trim();

  if (href) {
    return (
      <a
        className="coffee-store-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="オンラインストアで商品一覧を見る"
      >
        ONLINE STORE
        <ArrowUpRight size={18} aria-hidden />
      </a>
    );
  }

  return (
    <button
      type="button"
      className="coffee-store-link"
      aria-haspopup="dialog"
      aria-label="オンラインストア（準備中の案内を表示）"
      onClick={(event) => openPreview(event.currentTarget)}
    >
      ONLINE STORE
      <ArrowUpRight size={18} aria-hidden />
    </button>
  );
}
