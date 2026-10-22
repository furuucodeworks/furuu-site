/**
 * microCMS と本人用プレビューの設定を、サーバーの環境変数から読む。
 *
 * ブラウザへ渡さないため、変数名に VITE_ や NEXT_PUBLIC_ は付けない。
 * 値そのものはログにもエラー文言にも出さない。未設定は「設定未完了」として扱い、
 * 公開0件とは区別する。
 */

export type CmsConfig = {
  serviceDomain: string
  apiKey: string
}

const SERVICE_DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

function readSecret(name: string): string | null {
  const value = process.env[name]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 500 || /[\r\n\s]/.test(trimmed)) return null
  return trimmed
}

export function readCmsConfig(): CmsConfig | null {
  if (typeof window !== 'undefined') {
    throw new Error('CMSの設定はサーバーでのみ読めます')
  }

  const serviceDomain = readSecret('MICROCMS_SERVICE_DOMAIN')
  const apiKey = readSecret('MICROCMS_API_KEY')
  if (!serviceDomain || !apiKey) return null
  if (!SERVICE_DOMAIN_PATTERN.test(serviceDomain)) return null
  return { serviceDomain, apiKey }
}

/**
 * プレビュー用の合言葉。
 * 12文字未満は未設定と同じにする。公開URLから下書きを守る最低限の長さ。
 * 見直す条件: プレビューをインターネットへ出す前に、より長い合言葉へ替える。
 */
export function readPreviewPassword(): string | null {
  if (typeof window !== 'undefined') {
    throw new Error('プレビューの合言葉はサーバーでのみ読めます')
  }
  const password = readSecret('PREVIEW_PASSWORD')
  if (!password || password.length < 12) return null
  return password
}
