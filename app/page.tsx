/**
 * TOPはリクエストのたびに公開CMSを読む。
 * ビルド時のHTMLへ記事を焼き付けない。非公開後の再読み込みで古い本文を残さないため。
 */
import { HomePage } from '@/components/home-main'
import { getCategories, getPublishedNews, getPublishedPosts } from '@/lib/cms/public'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const [posts, news, categories] = await Promise.all([
    getPublishedPosts({ limit: 5 }),
    getPublishedNews(),
    getCategories(),
  ])

  return <HomePage posts={posts} news={news} categories={categories} />
}
