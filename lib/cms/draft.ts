/**
 * 下書きの取得。公開ページからは import しない。
 *
 * 公開APIは下書きを返さない。修正中の公開記事も、draftKey なしでは公開版のまま。
 * ここでだけ contentId と draftKey を付ける。結果は共有キャッシュへ入れない。
 * プレビュー画面は、署名付きCookieにある値だけを渡す。URLのクエリは見ない。
 */
import { readCmsConfig } from './config.ts'
import {
  type ArticleModel,
  type NewsItem,
  isContentId,
  isDraftKey,
  readNews,
  readPost,
  toArticle,
} from './content.ts'
import { draftFields } from './query.ts'
import { buildContentsUrl } from './url.ts'

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export type DraftResult<T> =
  | { status: 'ready'; item: T }
  | { status: 'not-found' }
  | { status: 'error'; reason: 'config' | 'unavailable' }

type Deps = { fetchImpl?: FetchLike }

export async function getDraftPost(
  contentId: string,
  draftKey: string,
  deps?: Deps,
): Promise<DraftResult<ArticleModel>> {
  const data = await fetchDraft('posts', contentId, draftKey, deps)
  if (!data.ok) return data.status === 'not-found' ? data : { status: 'error', reason: data.reason }
  const post = readPost(data.data)
  if (!post) return { status: 'error', reason: 'unavailable' }
  return { status: 'ready', item: toArticle(post, post.slug ? 'ok' : 'invalid') }
}

export async function getDraftNews(
  contentId: string,
  draftKey: string,
  deps?: Deps,
): Promise<DraftResult<NewsItem>> {
  const data = await fetchDraft('news', contentId, draftKey, deps)
  if (!data.ok) return data.status === 'not-found' ? data : { status: 'error', reason: data.reason }
  const news = readNews(data.data)
  if (!news) return { status: 'error', reason: 'unavailable' }
  return { status: 'ready', item: news }
}

async function fetchDraft(
  endpoint: 'posts' | 'news',
  contentId: string,
  draftKey: string,
  deps?: Deps,
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; status: 'not-found' }
  | { ok: false; status: 'error'; reason: 'config' | 'unavailable' }
> {
  if (!isContentId(contentId) || !isDraftKey(draftKey)) return { ok: false, status: 'not-found' }
  const config = readCmsConfig()
  if (!config) return { ok: false, status: 'error', reason: 'config' }

  let url: string
  try {
    url = buildContentsUrl({
      serviceDomain: config.serviceDomain,
      endpoint,
      query: draftFields(endpoint),
      mode: 'draft',
      contentId,
      draftKey,
    })
  } catch {
    return { ok: false, status: 'not-found' }
  }

  try {
    const response = await (deps?.fetchImpl ?? fetch)(url, {
      headers: { 'X-MICROCMS-API-KEY': config.apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 404) return { ok: false, status: 'not-found' }
    if (!response.ok) {
      console.error(`microCMS draft ${endpoint} unavailable`)
      return { ok: false, status: 'error', reason: 'unavailable' }
    }
    return { ok: true, data: (await response.json()) as unknown }
  } catch {
    console.error(`microCMS draft ${endpoint} unavailable`)
    return { ok: false, status: 'error', reason: 'unavailable' }
  }
}
