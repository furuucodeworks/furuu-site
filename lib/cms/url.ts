/**
 * microCMS のURL組み立て。
 * 公開モードは draftKey を拒否する。サービスID以外のホストへは繋がない。
 */
import { isContentId, isDraftKey } from './content.ts'

export function cmsHost(serviceDomain: string): string {
  return `${serviceDomain}.microcms.io`
}

export function buildContentsUrl(options: {
  serviceDomain: string
  endpoint: 'posts' | 'news' | 'categories'
  query: Record<string, string>
  mode: 'public' | 'draft'
  contentId?: string
  draftKey?: string
}): string {
  const hasDraftKey = Object.keys(options.query).some((key) => key.toLowerCase() === 'draftkey')
  if (options.mode === 'public' && (hasDraftKey || options.draftKey || options.contentId)) {
    throw new Error('公開取得に下書き用の指定は使えません')
  }
  if (options.mode === 'draft') {
    if (!options.contentId || !options.draftKey) {
      throw new Error('下書き取得には対象の指定が必要です')
    }
    if (!isContentId(options.contentId) || !isDraftKey(options.draftKey)) {
      throw new Error('下書き取得の対象が不正です')
    }
    if (options.endpoint === 'categories') {
      throw new Error('カテゴリーに下書き取得はありません')
    }
  }

  const path =
    options.mode === 'draft'
      ? `/api/v1/${options.endpoint}/${encodeURIComponent(options.contentId ?? '')}`
      : `/api/v1/${options.endpoint}`
  const url = new URL(`https://${cmsHost(options.serviceDomain)}${path}`)
  for (const [key, value] of Object.entries(options.query)) {
    url.searchParams.set(key, value)
  }
  if (options.mode === 'draft' && options.draftKey) {
    url.searchParams.set('draftKey', options.draftKey)
  }
  return url.toString()
}
