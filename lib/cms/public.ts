/**
 * 公開中の記事・お知らせ・カテゴリーだけを取得する。
 *
 * 下書き用の draftKey は引数に持たない。URL組み立てでも公開モードは draftKey を拒否する。
 * 同じリクエスト内の重複（記事詳細の metadata と本文）は React の cache でまとめる。
 * これはリクエストをまたいで本文を残すキャッシュではない。
 *
 * 通信失敗・JSON不正は error。totalCount 0 は empty。混ぜない。
 * 失敗した結果はキャッシュしない。
 */
import { cache } from 'react'
import { PUBLIC_CMS_CACHE_TTL_MS, ResponseCache } from './cache-policy.ts'
import { readCmsConfig } from './config.ts'
import {
  type CategoryItem,
  type CmsErrorReason,
  type CmsListResult,
  type NewsItem,
  type PostCard,
  type SlugLookup,
  isSafeSlug,
  mapCategoryList,
  mapNewsList,
  mapPostList,
  postsToListResult,
  toArticle,
} from './content.ts'
import { categoriesQuery, newsQuery, postsQuery } from './query.ts'
import { buildContentsUrl } from './url.ts'

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

type Deps = {
  fetchImpl?: FetchLike
  cacheStore?: ResponseCache
}

type JsonResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: CmsErrorReason | 'not-found' }

const sharedCache = new ResponseCache(PUBLIC_CMS_CACHE_TTL_MS)

export async function getCategories(deps?: Deps): Promise<CmsListResult<CategoryItem>> {
  const result = await fetchPublicJson({
    endpoint: 'categories',
    query: categoriesQuery(),
    deps,
  })
  if (!result.ok) return { status: 'error', reason: result.reason === 'config' ? 'config' : 'unavailable' }
  return mapCategoryList(result.data)
}

export async function getPublishedPosts(
  options: { limit: number; categoryId?: string | null },
  deps?: Deps,
): Promise<CmsListResult<PostCard>> {
  const query = postsQuery({ limit: options.limit, categoryId: options.categoryId, includeBody: false })
  if (!query) return { status: 'error', reason: 'unavailable' }
  const result = await fetchPublicJson({ endpoint: 'posts', query, deps })
  if (!result.ok) return { status: 'error', reason: result.reason === 'config' ? 'config' : 'unavailable' }
  return postsToListResult(mapPostList(result.data))
}

const HOME_NEWS_LIMIT = 3

/**
 * プレビューは同じIDの公開版を下書きで最大1件だけ置き換える。
 * 日付降順なら、表示3件の次点を足した4件で、繰り上がりを含めて上位3件を判定できる。
 * 取得クエリはTOPと同じ新しい順10件のままにし、プレビューへ渡すときだけ4件にする。
 */
const PREVIEW_NEWS_CANDIDATE_LIMIT = HOME_NEWS_LIMIT + 1

export async function getPublishedNews(deps?: Deps): Promise<CmsListResult<NewsItem>> {
  return loadPublishedNews(HOME_NEWS_LIMIT, deps)
}

export async function getPublishedNewsForPreview(deps?: Deps): Promise<CmsListResult<NewsItem>> {
  return loadPublishedNews(PREVIEW_NEWS_CANDIDATE_LIMIT, deps)
}

async function loadPublishedNews(limit: number, deps?: Deps): Promise<CmsListResult<NewsItem>> {
  const result = await fetchPublicJson({ endpoint: 'news', query: newsQuery(10), deps })
  if (!result.ok) return { status: 'error', reason: result.reason === 'config' ? 'config' : 'unavailable' }
  const mapped = mapNewsList(result.data)
  if (mapped.status !== 'ready') return mapped
  return { status: 'ready', items: mapped.items.slice(0, limit), truncated: mapped.truncated }
}

/**
 * 公開記事を slug で1件決める。
 * 0件は missing（詳細では404にし、本文を出さない）。
 * 2件以上は duplicate（どちらを出すか決めず、本文を出さない）。
 */
export async function lookupPublishedPost(slug: string, deps?: Deps): Promise<SlugLookup> {
  if (!isSafeSlug(slug)) return { status: 'missing' }
  const query = postsQuery({ limit: 2, slug, includeBody: true })
  if (!query) return { status: 'missing' }
  const result = await fetchPublicJson({ endpoint: 'posts', query, deps })
  if (!result.ok) return { status: 'error', reason: result.reason === 'config' ? 'config' : 'unavailable' }
  const mapped = mapPostList(result.data)
  if (!mapped) return { status: 'error', reason: 'unavailable' }
  if (mapped.posts.length === 0) return { status: 'missing' }
  if (mapped.posts.length > 1 || mapped.truncated) return { status: 'duplicate' }
  return { status: 'ready', article: toArticle(mapped.posts[0], 'ok') }
}

export const getPublishedPostBySlug = cache((slug: string) => lookupPublishedPost(slug))

export async function fetchPublicJson(options: {
  endpoint: 'posts' | 'news' | 'categories'
  query: Record<string, string>
  deps?: Deps
}): Promise<JsonResult> {
  const config = readCmsConfig()
  if (!config) return { ok: false, reason: 'config' }

  let url: string
  try {
    url = buildContentsUrl({
      serviceDomain: config.serviceDomain,
      endpoint: options.endpoint,
      query: options.query,
      mode: 'public',
    })
  } catch {
    return { ok: false, reason: 'unavailable' }
  }

  const cacheStore = options.deps?.cacheStore ?? sharedCache
  const cached = cacheStore.get(url)
  if (cached !== undefined) {
    try {
      return { ok: true, data: JSON.parse(cached) as unknown }
    } catch {
      return { ok: false, reason: 'unavailable' }
    }
  }

  const fetched = await requestJson(url, config.apiKey, options.deps?.fetchImpl ?? fetch)
  if (!fetched.ok) {
    console.error(`microCMS public ${options.endpoint} ${fetched.reason}`)
    return fetched
  }
  cacheStore.set(url, JSON.stringify(fetched.data))
  return fetched
}

async function requestJson(url: string, apiKey: string, fetchImpl: FetchLike): Promise<JsonResult> {
  try {
    const response = await fetchImpl(url, {
      headers: { 'X-MICROCMS-API-KEY': apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 404) return { ok: false, reason: 'not-found' }
    if (!response.ok) return { ok: false, reason: 'unavailable' }
    return { ok: true, data: (await response.json()) as unknown }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}
