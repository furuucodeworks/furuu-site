/**
 * 公開記事の詳細。slug が不正・存在しないときは本文を出さず 404。
 * 同じ slug が複数あるときは、どちらの本文も出さない。
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleScreen } from '@/components/article-screen'
import { SiteFrame } from '@/components/site-frame'
import { getPublishedPostBySlug } from '@/lib/cms/public'

export const dynamic = 'force-dynamic'

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const lookup = await getPublishedPostBySlug(slug)
  if (lookup.status === 'missing') notFound()
  if (lookup.status !== 'ready') {
    return {
      title: '記事 | FURUU COFFEE',
      robots: { index: false, follow: false },
    }
  }
  const description = lookup.article.excerpt || 'FURUU COFFEEの記事です。'
  const title = `${lookup.article.title} | FURUU COFFEE`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: lookup.article.imageUrl ? [lookup.article.imageUrl] : ['/og.png'],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const lookup = await getPublishedPostBySlug(slug)
  if (lookup.status === 'missing') notFound()

  return (
    <SiteFrame current="blog">
      {lookup.status === 'error' ? (
        <ArticleProblem
          title="記事を読み込めませんでした。"
          body="通信の失敗です。記事がない状態とは別です。時間をおいて、もう一度開いてください。"
        />
      ) : lookup.status === 'duplicate' ? (
        <ArticleProblem
          title="この記事は表示できません。"
          body="同じURLの記事が複数あるため、本文を出していません。microCMSでslugを別々にしてください。"
        />
      ) : (
        <ArticleScreen article={lookup.article} />
      )}
    </SiteFrame>
  )
}

function ArticleProblem({ title, body }: { title: string; body: string }) {
  return (
    <div className="page-blog">
      <section className="section">
        <p className="eyebrow">BLOG</p>
        <h1>{title}</h1>
        <p>{body}</p>
        <Link className="text-link" href="/blog" prefetch={false}>
          記事一覧へ戻る
        </Link>
      </section>
    </div>
  )
}
