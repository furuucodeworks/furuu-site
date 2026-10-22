/**
 * CMSのJSONを、画面が使う素の値へそろえる。
 * ここではHTMLを描画しない。本文の無害化は html.ts、通信は public.ts / draft.ts。
 */

export type CmsErrorReason = 'config' | 'unavailable'

export type CmsListResult<T> =
  | { status: 'ready'; items: T[]; truncated: boolean }
  | { status: 'empty' }
  | { status: 'error'; reason: CmsErrorReason }

export type CategoryItem = {
  id: string
  name: string
}

export type PostCard = {
  id: string
  title: string
  href: string | null
  dateLabel: string
  excerpt: string
  imageUrl: string | null
  categoryName: string | null
  slugNote: 'ok' | 'invalid' | 'duplicate'
}

export type ParsedPost = {
  id: string
  title: string
  slug: string | null
  publishedAt: string | null
  dateLabel: string
  excerpt: string
  imageUrl: string | null
  categoryId: string | null
  categoryName: string | null
  body: string
}

export type ArticleModel = {
  title: string
  categoryName: string | null
  dateLabel: string
  excerpt: string
  imageUrl: string | null
  body: string
  href: string | null
  slugNote: PostCard['slugNote']
}

export type NewsItem = {
  id: string
  title: string
  body: string
  dateLabel: string
  iso: string | null
  linkUrl: string | null
  preview?: boolean
}

export type SlugLookup =
  | { status: 'ready'; article: ArticleModel }
  | { status: 'missing' }
  | { status: 'duplicate' }
  | { status: 'error'; reason: CmsErrorReason }

/** 要件の6分類。CMSの作成順が逆だったため、表示順だけここで固定する。APIの作り直しはしない。 */
const CATEGORY_ORDER = [
  'コーヒー',
  '商品づくり',
  'Web・EC',
  'マーケティング・発信',
  '実験と改善',
  'FURUU COFFEEの日々',
]

const CATEGORY_RANK = new Map(CATEGORY_ORDER.map((name, index) => [name, index]))

export function isContentId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)
}

export function isDraftKey(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(value)
}

/**
 * 詳細URLに使ってよい slug。
 * 区切り文字や空白を拒む。日本語のまとまりは許可する（CMSの入力を壊さないため）。
 */
export function isSafeSlug(slug: string): boolean {
  if (slug.length < 1 || slug.length > 80) return false
  if (slug.normalize('NFC') !== slug) return false
  if (hasUnsafeSlugChar(slug)) return false
  if (
    slug.includes('..') ||
    slug.startsWith('.') ||
    slug.endsWith('.') ||
    slug.startsWith('-') ||
    slug.endsWith('-') ||
    slug.startsWith('_') ||
    slug.endsWith('_')
  ) {
    return false
  }
  return /^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u.test(slug)
}

export function cmsProblemMessage(
  subject: '記事' | 'お知らせ' | 'カテゴリー',
  reason: CmsErrorReason,
): string {
  if (reason === 'config') return `${subject}を表示する設定が未完了です。`
  return `${subject}を読み込めませんでした。時間をおいて、ページを開き直してください。`
}

export function formatCmsDate(value: string | null): string {
  if (!value) return '日付未設定'
  const time = Date.parse(value)
  if (Number.isNaN(time)) return '日付未設定'
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(time)
}

export function formatDateTimeJst(epochMs: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(epochMs)
}

export function compareIsoDesc(a: string | null, b: string | null): number {
  return timeValue(b) - timeValue(a)
}

function timeValue(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY
  const time = Date.parse(value)
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2000 || hasControlOrSpace(trimmed)) return null
  try {
    const url = new URL(trimmed)
    if (url.username || url.password) return null
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.href
  } catch {
    return null
  }
}

export function safeHttpsUrl(value: unknown): string | null {
  const url = safeHttpUrl(value)
  if (!url?.startsWith('https://')) return null
  return url
}

export function safeLinkHref(value: unknown): string | null {
  const httpUrl = safeHttpUrl(value)
  if (httpUrl) return httpUrl
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2000 || hasControlOrSpace(trimmed)) return null
  try {
    const url = new URL(trimmed)
    if (url.username || url.password) return null
    if (url.protocol !== 'mailto:') return null
    return url.href
  } catch {
    return null
  }
}

export function sortCategories<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aRank = CATEGORY_RANK.get(a.name) ?? CATEGORY_ORDER.length
    const bRank = CATEGORY_RANK.get(b.name) ?? CATEGORY_ORDER.length
    if (aRank !== bRank) return aRank - bRank
    return a.name.localeCompare(b.name, 'ja')
  })
}

export function readTotalList(data: unknown): { contents: unknown[]; totalCount: number } | null {
  if (!isRecord(data) || !Array.isArray(data.contents) || typeof data.totalCount !== 'number') {
    return null
  }
  return { contents: data.contents, totalCount: data.totalCount }
}

export function mapCategoryList(data: unknown): CmsListResult<CategoryItem> {
  const list = readTotalList(data)
  if (!list) return { status: 'error', reason: 'unavailable' }
  const items: CategoryItem[] = []
  for (const entry of list.contents) {
    const category = readCategory(entry)
    if (category) items.push(category)
  }
  if (list.contents.length > 0 && items.length === 0) {
    return { status: 'error', reason: 'unavailable' }
  }
  if (items.length === 0) return { status: 'empty' }
  return {
    status: 'ready',
    items: sortCategories(items),
    truncated: list.totalCount > list.contents.length,
  }
}

export function mapPostList(data: unknown): { posts: ParsedPost[]; truncated: boolean } | null {
  const list = readTotalList(data)
  if (!list) return null
  const posts: ParsedPost[] = []
  for (const entry of list.contents) {
    const post = readPost(entry)
    if (post) posts.push(post)
  }
  if (list.contents.length > 0 && posts.length === 0) return null
  posts.sort((a, b) => compareIsoDesc(a.publishedAt, b.publishedAt))
  return { posts, truncated: list.totalCount > list.contents.length }
}

export function toPostCards(posts: ParsedPost[]): PostCard[] {
  const counts = new Map<string, number>()
  for (const post of posts) {
    if (!post.slug) continue
    counts.set(post.slug, (counts.get(post.slug) ?? 0) + 1)
  }
  return posts.map((post) => {
    const slugNote = slugNoteFor(post.slug, counts)
    return {
      id: post.id,
      title: post.title,
      href: slugNote === 'ok' && post.slug ? `/blog/${encodeURIComponent(post.slug)}` : null,
      dateLabel: post.dateLabel,
      excerpt: post.excerpt,
      imageUrl: post.imageUrl,
      categoryName: post.categoryName,
      slugNote,
    }
  })
}

export function toArticle(post: ParsedPost, slugNote: PostCard['slugNote']): ArticleModel {
  return {
    title: post.title,
    categoryName: post.categoryName,
    dateLabel: post.dateLabel,
    excerpt: post.excerpt,
    imageUrl: post.imageUrl,
    body: post.body,
    href: slugNote === 'ok' && post.slug ? `/blog/${encodeURIComponent(post.slug)}` : null,
    slugNote,
  }
}

export function readPost(data: unknown): ParsedPost | null {
  if (!isRecord(data) || typeof data.id !== 'string' || !isContentId(data.id)) return null
  const slug = typeof data.slug === 'string' && isSafeSlug(data.slug.trim()) ? data.slug.trim() : null
  const publishedAt = typeof data.publishedDate === 'string' ? data.publishedDate : null
  const category = readCategory(data.category)
  const imageUrl = readImageUrl(data.eyecatch)
  const excerpt = typeof data.excerpt === 'string' ? data.excerpt.trim().slice(0, 2000) : ''
  const body = typeof data.body === 'string' ? data.body : ''
  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : '（無題）'
  return {
    id: data.id,
    title,
    slug,
    publishedAt,
    dateLabel: formatCmsDate(publishedAt),
    excerpt,
    imageUrl,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    body,
  }
}

export function mapNewsList(data: unknown): CmsListResult<NewsItem> {
  const list = readTotalList(data)
  if (!list) return { status: 'error', reason: 'unavailable' }
  const items: NewsItem[] = []
  for (const entry of list.contents) {
    const news = readNews(entry)
    if (news) items.push(news)
  }
  if (list.contents.length > 0 && items.length === 0) {
    return { status: 'error', reason: 'unavailable' }
  }
  if (items.length === 0) return { status: 'empty' }
  items.sort((a, b) => compareIsoDesc(a.iso, b.iso))
  return {
    status: 'ready',
    items,
    truncated: list.totalCount > list.contents.length,
  }
}

export function readNews(data: unknown): NewsItem | null {
  if (!isRecord(data) || typeof data.id !== 'string' || !isContentId(data.id)) return null
  const iso = typeof data.date === 'string' ? data.date : null
  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : '（無題）'
  const body = typeof data.body === 'string' ? data.body.trim().slice(0, 20_000) : ''
  return {
    id: data.id,
    title,
    body,
    dateLabel: formatCmsDate(iso),
    iso,
    linkUrl: safeHttpUrl(data.linkUrl),
  }
}

/**
 * 下書きのお知らせを、公開中の一覧へ日付順で差し込む。
 * 同じIDの公開版があるときは下書き側を使う（プレビューは修正版を見るため）。
 * 呼び出し側は日付降順の公開4件を渡す。置換で除かれるのは最大1件なので、次点まで判定できる。
 * 上位3件に入らない古い日付は、公開後のTOPにも出ない。
 */
export function mergePreviewNews(
  published: NewsItem[],
  draft: NewsItem,
): { items: NewsItem[]; included: boolean } {
  const rest = published.filter((item) => item.id !== draft.id)
  const ranked = [...rest, { ...draft, preview: true }].sort((a, b) => compareIsoDesc(a.iso, b.iso))
  const items = ranked.slice(0, 3)
  return { items, included: items.some((item) => item.preview) }
}

export function postsToListResult(
  mapped: { posts: ParsedPost[]; truncated: boolean } | null,
): CmsListResult<PostCard> {
  if (!mapped) return { status: 'error', reason: 'unavailable' }
  if (mapped.posts.length === 0) return { status: 'empty' }
  return { status: 'ready', items: toPostCards(mapped.posts), truncated: mapped.truncated }
}

function slugNoteFor(
  slug: string | null,
  counts: Map<string, number>,
): PostCard['slugNote'] {
  if (!slug) return 'invalid'
  if ((counts.get(slug) ?? 0) > 1) return 'duplicate'
  return 'ok'
}

function readCategory(value: unknown): CategoryItem | null {
  const record = Array.isArray(value) ? value[0] : value
  if (!isRecord(record) || typeof record.id !== 'string' || !isContentId(record.id)) return null
  if (typeof record.name !== 'string') return null
  const name = record.name.trim()
  if (!name || name.length > 80) return null
  return { id: record.id, name }
}

function readImageUrl(value: unknown): string | null {
  if (!isRecord(value)) return null
  return safeHttpsUrl(value.url)
}

function hasUnsafeSlugChar(slug: string): boolean {
  if (/[/\\?#%\s]/u.test(slug)) return true
  for (let index = 0; index < slug.length; index += 1) {
    if (slug.charCodeAt(index) <= 0x1f) return true
  }
  return false
}

function hasControlOrSpace(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) <= 0x20) return true
  }
  return false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
