'use client';

import { ArrowUpRight } from 'lucide-react';
import { useSiteNotice } from '@/components/site-frame';

export function CoffeeFormatLink({
  href,
  productName,
  formatLabel,
}: {
  href: string;
  productName: string;
  formatLabel: string;
}) {
  const { openPreview } = useSiteNotice();
  const storeHref = href.trim();
  const ariaLabel = `${productName}（${formatLabel}）— オンラインストアで見る`;

  if (storeHref) {
    return (
      <a
        className="coffee-format-link"
        href={storeHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
      >
        {formatLabel}
        <ArrowUpRight size={15} aria-hidden />
      </a>
    );
  }

  return (
    <button
      type="button"
      className="coffee-format-link"
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      onClick={(event) => openPreview(event.currentTarget)}
    >
      {formatLabel}
      <ArrowUpRight size={15} aria-hidden />
    </button>
  );
}
