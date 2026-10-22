/**
 * プレビュー中だけ出す帯。
 * 公開ページのキャッシュとは別ルートで、検索向けの印も middleware 側で付ける。
 * 終了すると合言葉のCookieも消える。対象の切り替えは下書きの指定だけ消す。
 */
import { clearPreviewTarget, endPreview } from '@/app/preview/actions'

export function PreviewBar({ expLabel }: { expLabel: string }) {
  return (
    <div className="preview-bar">
      <p>
        下書きプレビューです。一般のページには出ていません。有効期限は{expLabel}までです。
      </p>
      <form action={clearPreviewTarget}>
        <button type="submit">対象を切り替える</button>
      </form>
      <form action={endPreview}>
        <button type="submit">プレビューを終了する</button>
      </form>
    </div>
  )
}
