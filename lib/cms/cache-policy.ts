/**
 * 公開CMSレスポンスのプロセス内キャッシュ。
 *
 * TTL は 0。成功結果も次のリクエストへ持ち越さない。
 * 理由: 非公開にした記事の本文が、メモリや共有キャッシュに残って詳細URLで読めるのを防ぐ。
 * 取得失敗のときは保存しない。期限切れを返すメソッドも置かない。
 * 障害時に「直前まで公開だった本文」へ戻さないため。
 *
 * ページ自体も Cache-Control: private, no-store にする（proxy.ts）。
 * 反映は再読み込み・新規アクセスのたびにCMSへ取りに行く。手動ビルドは不要。
 *
 * 見直す条件: 公開環境で microCMS Hobby の転送量（20GB/月）に近づいたとき。
 * その場合も保持は60秒以内にし、失敗時に期限切れの本文を返さない。
 * Webhook で消せるようにするなら、消すまで古い本文が残らないことを先に確認する。
 */
export const PUBLIC_CMS_CACHE_TTL_MS = 0

type Entry = {
  expiresAt: number
  value: string
}

export class ResponseCache {
  private readonly entries = new Map<string, Entry>()
  private readonly ttlMs: number
  private readonly now: () => number

  constructor(ttlMs: number, now: () => number = Date.now) {
    this.ttlMs = ttlMs
    this.now = now
  }

  get(key: string): string | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: string): void {
    if (this.ttlMs <= 0) return
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs })
  }
}
