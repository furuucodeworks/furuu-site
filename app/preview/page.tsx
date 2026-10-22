/**
 * 本人用プレビューの入口。
 * 合言葉が未設定のあいだは入力欄を出さない。値は .env.local へ本人が書き、チャットには貼らない。
 * ログイン後の draftKey も、この画面の入力欄からサーバーへ POST する。アドレスには出さない。
 */
import Link from 'next/link'
import { SiteFrame } from '@/components/site-frame'
import { loginPreview, savePreviewTarget } from '@/app/preview/actions'
import { loadPreviewAccess } from '@/lib/cms/preview-access'

export const dynamic = 'force-dynamic'

const notices: Record<string, string> = {
  mismatch: '合言葉が違います。',
  expired: '有効期限が切れたので、もう一度合言葉を入力してください。',
  ended: 'プレビューを終了しました。',
  blocked: '試行が続いたため、しばらく合言葉を受け付けません。',
  invalid: 'コンテンツIDとdraftKeyを確認してください。値はこの画面に残していません。',
  switched: '対象を解除しました。別の下書きを入力できます。',
  target: '先に、確認する記事かお知らせを指定してください。',
}

export default async function PreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : {}
  const notice = readNotice(params.notice)
  const access = await loadPreviewAccess()
  const message =
    notices[notice ?? ''] ??
    (access.status === 'anonymous' && access.reason === 'expired' ? notices.expired : null)

  return (
    <SiteFrame>
      <div className="page-blog">
        <section className="section preview-panel">
          <p className="eyebrow">PREVIEW</p>
          <h1>下書きを確認する</h1>
          {message ? <p className="cms-note">{message}</p> : null}
          {access.status === 'unconfigured' ? <SetupGuide /> : null}
          {access.status === 'anonymous' ? <LoginForm /> : null}
          {access.status === 'active' ? <TargetForm expLabel={access.expLabel} contentId={access.target?.contentId ?? null} kind={access.target?.kind ?? null} /> : null}
        </section>
      </div>
    </SiteFrame>
  )
}

function SetupGuide() {
  return (
    <div className="cms-copy">
      <p>プレビュー用の合言葉が未設定です。一般のページからは下書きを読めません。</p>
      <ol>
        <li>このPCの .env.local に、PREVIEW_PASSWORD を1行追加する。12文字以上。</li>
        <li>値はチャットや画面共有に貼らない。</li>
        <li>開発サーバーを止めて、もう一度起動する。</li>
        <li>このページを開き直すと、合言葉の入力欄が出ます。</li>
      </ol>
    </div>
  )
}

function LoginForm() {
  return (
    <form className="preview-form" action={loginPreview}>
      <label htmlFor="preview-password">合言葉</label>
      <input
        id="preview-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={12}
      />
      <button type="submit">プレビューを始める</button>
    </form>
  )
}

function TargetForm({
  expLabel,
  contentId,
  kind,
}: {
  expLabel: string
  contentId: string | null
  kind: 'posts' | 'news' | null
}) {
  return (
    <>
      <p className="cms-copy">有効期限は{expLabel}までです。過ぎたら、もう一度合言葉が必要です。</p>
      {contentId && kind ? (
        <p className="cms-copy">
          いまの対象は{kind === 'posts' ? '記事' : 'お知らせ'}（{contentId}）です。{' '}
          <Link href={kind === 'posts' ? '/preview/post' : '/preview/news'} prefetch={false}>
            プレビューを開く
          </Link>
        </p>
      ) : null}
      <form className="preview-form" action={savePreviewTarget}>
        <fieldset>
          <legend>対象</legend>
          <label>
            <input type="radio" name="kind" value="posts" defaultChecked /> 記事
          </label>
          <label>
            <input type="radio" name="kind" value="news" /> お知らせ
          </label>
        </fieldset>
        <label htmlFor="preview-content-id">コンテンツID</label>
        <input
          id="preview-content-id"
          name="contentId"
          type="text"
          autoComplete="off"
          spellCheck={false}
          required
          maxLength={2000}
        />
        <label htmlFor="preview-draft-key">draftKey</label>
        <input
          id="preview-draft-key"
          name="draftKey"
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          maxLength={2000}
        />
        <div className="cms-copy">
          <p>microCMSの編集画面から、この欄へ直接貼ってください。チャットには貼らないでください。</p>
          <ol>
            <li>記事なら posts、お知らせなら news を選ぶ。</li>
            <li>編集画面のアドレス末尾がコンテンツIDです。</li>
            <li>プレビュー用URLに含まれる draftKey の値だけを、下の欄へ貼る。</li>
          </ol>
        </div>
        <button type="submit">この下書きを表示する</button>
      </form>
    </>
  )
}

function readNotice(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !(raw in notices)) return null
  return raw
}
