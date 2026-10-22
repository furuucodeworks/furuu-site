/**
 * 記事の下書きを、公開詳細と同じレイアウトで見る。
 * 対象は署名付きCookieだけ。クエリの draftKey は読まない。
 */
import { redirect } from 'next/navigation'
import { ArticleScreen } from '@/components/article-screen'
import { PreviewBar } from '@/components/preview-bar'
import { SiteFrame } from '@/components/site-frame'
import { getDraftPost } from '@/lib/cms/draft'
import { loadPreviewAccess } from '@/lib/cms/preview-access'

export const dynamic = 'force-dynamic'

export default async function PreviewPostPage() {
  const access = await loadPreviewAccess()
  if (access.status === 'unconfigured') redirect('/preview')
  if (access.status !== 'active') redirect('/preview?notice=expired')
  if (access.target?.kind !== 'posts') redirect('/preview?notice=target')

  const draft = await getDraftPost(access.target.contentId, access.target.draftKey)

  return (
    <SiteFrame current="blog">
      <PreviewBar expLabel={access.expLabel} />
      {draft.status === 'ready' ? (
        <ArticleScreen article={draft.item} />
      ) : (
        <div className="page-blog">
          <section className="section">
            <h1>下書きを表示できません。</h1>
            <p>
              {draft.status === 'not-found'
                ? 'コンテンツID、draftKey、対象が記事かどうかを確認してください。値は再入力してください。'
                : draft.reason === 'config'
                  ? 'CMSの接続設定が未完了です。'
                  : 'CMSへ接続できませんでした。時間をおいて、もう一度開いてください。'}
            </p>
          </section>
        </div>
      )}
    </SiteFrame>
  )
}
