/**
 * 記事詳細の見た目。公開ページと本人用プレビューで同じレイアウトを使う。
 * 本文はここで許可したHTMLだけに作り直してから出す。CMSの原文は渡さない。
 */
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ArticleModel } from '@/lib/cms/content'
import { MAX_RICH_TEXT_CHARS, sanitizeRichText } from '@/lib/cms/html'

export function ArticleScreen({ article }: { article: ArticleModel }) {
  const body =
    article.body.length > MAX_RICH_TEXT_CHARS ? null : sanitizeRichText(article.body)

  return (
    <div className="page-blog">
      <article className="section cms-article">
        <p className="eyebrow">BLOG</p>
        <p className="article-category">
          {article.categoryName ?? 'カテゴリー未設定'} / {article.dateLabel}
        </p>
        <h1>{article.title}</h1>
        {article.excerpt ? <p className="cms-excerpt">{article.excerpt}</p> : null}
        {article.imageUrl ? (
          <img className="cms-eyecatch" src={article.imageUrl} alt={article.title} />
        ) : null}
        {article.body.length > MAX_RICH_TEXT_CHARS ? (
          <p>この記事は長すぎるため、表示を止めています。</p>
        ) : body ? (
          <div className="cms-body" dangerouslySetInnerHTML={{ __html: body }} />
        ) : (
          <p>本文はまだありません。</p>
        )}
        {article.slugNote === 'invalid' ? (
          <p className="cms-note">この記事のURL（slug）では、公開ページのアドレスを作れません。</p>
        ) : null}
        <Link className="text-link" href="/blog" prefetch={false}>
          記事一覧へ戻る <ArrowRight size={18} />
        </Link>
      </article>
    </div>
  )
}
