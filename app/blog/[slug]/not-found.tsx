import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFrame } from '@/components/site-frame'

export const metadata: Metadata = {
  title: '記事が見つかりません | FURUU COFFEE',
  robots: { index: false, follow: false },
}

export default function BlogArticleNotFound() {
  return (
    <SiteFrame current="blog">
      <div className="page-blog">
        <section className="section">
          <p className="eyebrow">BLOG</p>
          <h1>記事は見つかりません。</h1>
          <p>公開を終了したか、アドレスが違います。本文は表示していません。</p>
          <Link className="text-link" href="/blog" prefetch={false}>
            記事一覧へ戻る
          </Link>
        </section>
      </div>
    </SiteFrame>
  )
}
