/**
 * お知らせの下書きを、TOPのお知らせ欄と同じ位置で見る。
 * 日付降順の公開4件を受け取り、同じIDを下書きで置き換えてから上位3件を表示する。
 * 公開取得には draftKey を渡さない。
 */
import { redirect } from 'next/navigation'
import { HomeMain } from '@/components/home-main'
import { PreviewBar } from '@/components/preview-bar'
import { SiteFrame } from '@/components/site-frame'
import { mergePreviewNews } from '@/lib/cms/content'
import { getDraftNews } from '@/lib/cms/draft'
import { loadPreviewAccess } from '@/lib/cms/preview-access'
import { getCategories, getPublishedNewsForPreview, getPublishedPosts } from '@/lib/cms/public'

export const dynamic = 'force-dynamic'

export default async function PreviewNewsPage() {
  const access = await loadPreviewAccess()
  if (access.status === 'unconfigured') redirect('/preview')
  if (access.status !== 'active') redirect('/preview?notice=expired')
  if (access.target?.kind !== 'news') redirect('/preview?notice=target')

  const [posts, news, categories, draft] = await Promise.all([
    getPublishedPosts({ limit: 5 }),
    getPublishedNewsForPreview(),
    getCategories(),
    getDraftNews(access.target.contentId, access.target.draftKey),
  ])

  if (draft.status !== 'ready') {
    return (
      <SiteFrame>
        <PreviewBar expLabel={access.expLabel} />
        <div className="page-blog">
          <section className="section">
            <h1>下書きを表示できません。</h1>
            <p>
              {draft.status === 'not-found'
                ? 'コンテンツID、draftKey、対象がお知らせかどうかを確認してください。'
                : draft.reason === 'config'
                  ? 'CMSの接続設定が未完了です。'
                  : 'CMSへ接続できませんでした。時間をおいて、もう一度開いてください。'}
            </p>
          </section>
        </div>
      </SiteFrame>
    )
  }

  const published = news.status === 'ready' ? news.items : []
  const merged = mergePreviewNews(published, draft.item)

  return (
    <SiteFrame>
      <PreviewBar expLabel={access.expLabel} />
      {news.status === 'error' ? (
        <p className="cms-note preview-inline-note">
          公開中のお知らせは読み込めませんでした。下書きだけを仮に置いています。
        </p>
      ) : null}
      <HomeMain
        posts={posts}
        news={{ status: 'ready', items: merged.items, truncated: false }}
        categories={categories}
        newsOutsidePreview={merged.included ? null : draft.item}
      />
    </SiteFrame>
  )
}
