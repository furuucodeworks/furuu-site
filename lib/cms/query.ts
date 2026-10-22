/**
 * 公開取得用のクエリ。
 * draftKey はここへ入れない。下書きURLは draft.ts だけが組み立てる。
 */
import { isContentId, isSafeSlug } from './content.ts'

export function postsQuery(options: {
  limit: number
  categoryId?: string | null
  slug?: string | null
  includeBody: boolean
}): Record<string, string> | null {
  if (options.slug && !isSafeSlug(options.slug)) return null
  if (options.categoryId && !isContentId(options.categoryId)) return null
  const fields = options.includeBody
    ? 'id,title,slug,publishedDate,excerpt,eyecatch,body,category'
    : 'id,title,slug,publishedDate,excerpt,eyecatch,category'
  const query: Record<string, string> = {
    limit: String(clampLimit(options.limit)),
    orders: '-publishedDate',
    depth: '1',
    fields,
  }
  if (options.slug) query.filters = `slug[equals]${options.slug}`
  else if (options.categoryId) query.filters = `category[equals]${options.categoryId}`
  return query
}

export function newsQuery(limit: number): Record<string, string> {
  return {
    limit: String(clampLimit(limit)),
    orders: '-date',
    fields: 'id,date,title,body,linkUrl',
  }
}

export function categoriesQuery(): Record<string, string> {
  return { limit: '20', fields: 'id,name' }
}

export function draftFields(endpoint: 'posts' | 'news'): Record<string, string> {
  if (endpoint === 'posts') {
    return {
      depth: '1',
      fields: 'id,title,slug,publishedDate,excerpt,eyecatch,body,category',
    }
  }
  return { fields: 'id,date,title,body,linkUrl' }
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 1
  return Math.min(100, Math.max(1, Math.floor(limit)))
}
