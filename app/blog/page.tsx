/**
 * 公開記事の一覧。searchParams の category は公開カテゴリーIDだけを使う。
 * 下書きの取得関数はここから呼ばない。
 */
import type { Metadata } from 'next'
import { SiteFrame } from '@/components/site-frame'
import { BlogList } from '@/components/blog-list'
import { isContentId } from '@/lib/cms/content'
import { getCategories, getPublishedPosts } from '@/lib/cms/public'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BLOG | FURUU COFFEE',
  description: 'FURUU COFFEEの公開記事です。',
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const requested = firstValue(params.category)
  const categories = await getCategories()
  const known =
    categories.status === 'ready' ? categories.items.some((item) => item.id === requested) : false
  const missingCategory = Boolean(requested) && (categories.status === 'ready' ? !known : !isContentId(requested ?? ''))
  const categoryId =
    requested && !missingCategory && isContentId(requested) ? requested : null
  const posts = missingCategory
    ? { status: 'empty' as const }
    : await getPublishedPosts({ limit: 100, categoryId })

  return (
    <SiteFrame current="blog">
      <BlogList
        posts={posts}
        categories={categories}
        activeCategoryId={categoryId}
        missingCategory={missingCategory}
      />
    </SiteFrame>
  )
}

function firstValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  return raw
}
