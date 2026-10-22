/**
 * CMS連携の単体テスト。
 * 通信先は模擬。実在の microCMS に繋がった結果としては扱わない。
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { ResponseCache } from '../lib/cms/cache-policy.ts'
import {
  mapCategoryList,
  mapNewsList,
  mapPostList,
  mergePreviewNews,
  postsToListResult,
  readNews,
  safeHttpUrl,
  toPostCards,
} from '../lib/cms/content.ts'
import { getDraftPost } from '../lib/cms/draft.ts'
import { sanitizeRichText } from '../lib/cms/html.ts'
import {
  issueSessionToken,
  issueTargetToken,
  passwordMatches,
  readPreviewTargetInput,
  resolvePreviewAccess,
} from '../lib/cms/preview-token.ts'
import { getPublishedNews, getPublishedNewsForPreview, getPublishedPosts, lookupPublishedPost } from '../lib/cms/public.ts'
import { postsQuery } from '../lib/cms/query.ts'
import { buildContentsUrl } from '../lib/cms/url.ts'

void test('公開クエリに下書きパラメータを入れない', () => {
  const query = postsQuery({ limit: 10, includeBody: true })
  assert.ok(query)
  assert.equal(Object.hasOwn(query, 'draftKey'), false)
  assert.throws(() =>
    buildContentsUrl({
      serviceDomain: 'example-service',
      endpoint: 'posts',
      query: { draftKey: 'not-allowed-key' },
      mode: 'public',
    }),
  )
})

void test('公開取得のURLに draftKey が付かない', async () => {
  await withFakeCms(async () => {
    const urls: string[] = []
    const result = await getPublishedPosts(
      { limit: 5 },
      {
        fetchImpl: async (url) => {
          urls.push(url)
          return jsonResponse({ contents: [], totalCount: 0 })
        },
      },
    )
    assert.equal(result.status, 'empty')
    assert.equal(urls.length, 1)
    assert.equal(urls[0].includes('draftKey'), false)
    assert.equal(urls[0].startsWith('https://example-service.microcms.io/api/v1/posts'), true)
  })
})

void test('下書き取得だけが draftKey を付ける', async () => {
  await withFakeCms(async () => {
    const urls: string[] = []
    const result = await getDraftPost('post1234', 'draftkey1', {
      fetchImpl: async (url, init) => {
        urls.push(url)
        const headers = new Headers(init?.headers)
        assert.equal(headers.get('X-MICROCMS-API-KEY'), 'test-key-value')
        return jsonResponse({
          id: 'post1234',
          title: '下書き',
          slug: 'draft-post',
          publishedDate: '2026-10-16',
          excerpt: '紹介',
          body: '<p>本文</p>',
        })
      },
    })
    assert.equal(result.status, 'ready')
    assert.equal(urls.length, 1)
    assert.match(urls[0], /\/api\/v1\/posts\/post1234\?/)
    assert.match(urls[0], /draftKey=draftkey1/)
  })
})

void test('取得失敗は空一覧にしない。期限切れの本文も返さない', async () => {
  await withFakeCms(async () => {
    let now = 0
    const cacheStore = new ResponseCache(1000, () => now)
    let fail = false
    const fetchImpl = async () => {
      if (fail) return new Response('no', { status: 500 })
      return jsonResponse({
        contents: [postJson('post1234', 'public-post', '2026-10-16')],
        totalCount: 1,
      })
    }
    const first = await getPublishedPosts({ limit: 5 }, { fetchImpl, cacheStore })
    assert.equal(first.status, 'ready')
    fail = true
    now = 500
    const cached = await getPublishedPosts({ limit: 5 }, { fetchImpl, cacheStore })
    assert.equal(cached.status, 'ready')
    now = 2000
    const failed = await getPublishedPosts({ limit: 5 }, { fetchImpl, cacheStore })
    assert.equal(failed.status, 'error')
    if (failed.status === 'error') assert.equal(failed.reason, 'unavailable')
  })
})

void test('TTL 0 では成功結果を残さない', () => {
  const cacheStore = new ResponseCache(0)
  cacheStore.set('post', '{"title":"古い本文"}')
  assert.equal(cacheStore.get('post'), undefined)
})

void test('0件と不正データは区別する', () => {
  assert.equal(postsToListResult({ posts: [], truncated: false }).status, 'empty')
  assert.equal(postsToListResult(null)?.status, 'error')
  assert.equal(mapNewsList({ contents: [], totalCount: 0 }).status, 'empty')
  assert.equal(mapNewsList({ contents: [{ id: 'bad id' }], totalCount: 1 }).status, 'error')
})

void test('記事は新しい順、slugの重複は詳細URLにしない', () => {
  const mapped = mapPostList({
    totalCount: 3,
    contents: [
      postJson('aaaaaaa1', 'older-post', '2026-10-01'),
      postJson('aaaaaaa2', 'same-slug', '2026-10-03'),
      postJson('aaaaaaa3', 'same-slug', '2026-10-02'),
    ],
  })
  assert.ok(mapped)
  const cards = toPostCards(mapped.posts)
  assert.equal(cards[0].title, 'same-slug')
  assert.equal(cards[0].slugNote, 'duplicate')
  assert.equal(cards[0].href, null)
  assert.equal(cards[2].href, '/blog/older-post')
})

void test('存在しないslugと重複slugは本文を返さない', async () => {
  await withFakeCms(async () => {
    const missing = await lookupPublishedPost('../secret', {
      fetchImpl: async () => {
        throw new Error('不正なslugでは通信しない')
      },
    })
    assert.equal(missing.status, 'missing')

    const duplicate = await lookupPublishedPost('same-slug', {
      fetchImpl: async () =>
        jsonResponse({
          totalCount: 2,
          contents: [
            postJson('aaaaaaa2', 'same-slug', '2026-10-03', '<p>一方</p>'),
            postJson('aaaaaaa3', 'same-slug', '2026-10-02', '<p>他方</p>'),
          ],
        }),
    })
    assert.equal(duplicate.status, 'duplicate')
  })
})

void test('カテゴリーは要件の順に並べる', () => {
  const result = mapCategoryList({
    totalCount: 2,
    contents: [
      { id: 'cat00002', name: '商品づくり' },
      { id: 'cat00001', name: 'コーヒー' },
    ],
  })
  assert.equal(result.status, 'ready')
  if (result.status === 'ready') {
    assert.deepEqual(
      result.items.map((item) => item.name),
      ['コーヒー', '商品づくり'],
    )
  }
})

void test('お知らせの危険なURLはリンクにしない', () => {
  const news = readNews({
    id: 'news1234',
    date: '2026-10-16',
    title: 'お知らせ',
    body: '本文',
    linkUrl: 'javascript:alert(1)',
  })
  assert.ok(news)
  assert.equal(news.linkUrl, null)
  assert.equal(safeHttpUrl('https://example.com/item'), 'https://example.com/item')
})

void test('下書きお知らせは日付順の3件に入るときだけ差し込む', () => {
  const published = [0, 1, 2].map((index) => ({
    id: `news000${index}`,
    title: `公開${index}`,
    body: '本文',
    dateLabel: '日付',
    iso: `2026-10-1${index}`,
    linkUrl: null,
  }))
  const visible = mergePreviewNews(published, {
    id: 'newsdraft',
    title: '下書き',
    body: '新しい',
    dateLabel: '日付',
    iso: '2026-10-20',
    linkUrl: null,
  })
  assert.equal(visible.included, true)
  assert.equal(visible.items[0].title, '下書き')
  assert.equal(visible.items.some((item) => item.id === 'news0000'), false)

  const hidden = mergePreviewNews(published, {
    id: 'newsdraft',
    title: '古い下書き',
    body: '本文',
    dateLabel: '日付',
    iso: '2026-09-01',
    linkUrl: null,
  })
  assert.equal(hidden.included, false)
  assert.equal(
    hidden.items.some((item) => item.preview),
    false,
  )
})

void test('日付を古くした下書きのプレビューは繰り上がるお知らせを含む', async () => {
  await withPublishedNews(async ({ home, preview, urls }) => {
    const homeNews = await home()
    assert.equal(homeNews.status, 'ready')
    if (homeNews.status === 'ready') {
      assert.deepEqual(
        homeNews.items.map((item) => item.title),
        ['A', 'B', 'C'],
      )
    }

    const previewNews = await preview()
    assert.equal(previewNews.status, 'ready')
    if (previewNews.status !== 'ready') return
    assert.deepEqual(
      previewNews.items.map((item) => item.title),
      ['A', 'B', 'C', 'D'],
    )
    assert.equal(previewNews.items.length, 4)
    assert.equal(urls.length, 2)
    assert.equal(urls[0], urls[1])
    for (const url of urls) assertPublicNewsQuery(url)

    const merged = mergePreviewNews(previewNews.items, newsItem('newsa', 'Aの下書き', '2026-08-15'))
    assert.deepEqual(
      merged.items.map((item) => item.title),
      ['B', 'C', 'D'],
    )
    assert.equal(merged.included, false)
    assert.equal(
      merged.items.some((item) => item.id === 'newsa'),
      false,
    )
    assert.equal(new Set(merged.items.map((item) => item.id)).size, merged.items.length)
  })
})

void test('プレビューは同じIDの公開版と下書きを重ねない', async () => {
  await withPublishedNews(async ({ preview }) => {
    const previewNews = await preview()
    assert.equal(previewNews.status, 'ready')
    if (previewNews.status !== 'ready') return
    const merged = mergePreviewNews(previewNews.items, newsItem('newsa', 'Aの修正', '2026-10-04'))
    const same = merged.items.filter((item) => item.id === 'newsa')
    assert.equal(same.length, 1)
    assert.equal(same[0]?.preview, true)
    assert.equal(same[0]?.title, 'Aの修正')
    assert.deepEqual(
      merged.items.map((item) => item.id),
      ['newsa', 'newsb', 'newsc'],
    )
    assert.equal(merged.included, true)
  })
})

void test('未公開の新規下書きは日付に応じて上位3件に入る', async () => {
  await withPublishedNews(async ({ preview }) => {
    const previewNews = await preview()
    assert.equal(previewNews.status, 'ready')
    if (previewNews.status !== 'ready') return

    const visible = mergePreviewNews(previewNews.items, newsItem('newsnew1', '新規', '2026-10-05'))
    assert.equal(visible.included, true)
    assert.deepEqual(
      visible.items.map((item) => item.title),
      ['新規', 'A', 'B'],
    )
    assert.equal(visible.items.filter((item) => item.id === 'newsnew1').length, 1)
    assert.equal(new Set(visible.items.map((item) => item.id)).size, visible.items.length)

    const hidden = mergePreviewNews(previewNews.items, newsItem('newsnew1', '古い新規', '2026-08-15'))
    assert.equal(hidden.included, false)
    assert.deepEqual(
      hidden.items.map((item) => item.title),
      ['A', 'B', 'C'],
    )
    assert.equal(
      hidden.items.some((item) => item.id === 'newsnew1'),
      false,
    )
  })
})

void test('お知らせの公開取得は失敗と0件を区別する', async () => {
  await withFakeCms(async () => {
    for (const load of [getPublishedNews, getPublishedNewsForPreview]) {
      const failed = await load({
        fetchImpl: async () => new Response('no', { status: 500 }),
      })
      assert.equal(failed.status, 'error')
      if (failed.status === 'error') assert.equal(failed.reason, 'unavailable')

      const empty = await load({
        fetchImpl: async () => jsonResponse({ contents: [], totalCount: 0 }),
      })
      assert.equal(empty.status, 'empty')
    }
  })
})

void test('リッチテキストは見出しとリンクを残し、危険なHTMLを捨てる', () => {
  const html = sanitizeRichText(
    '<h2>見出し</h2><p><strong>太字</strong><a href="javascript:alert(1)">危険</a><a href="https://example.com/a">安全</a></p><img src="https://example.com/a.png" onerror="alert(1)" alt="豆"><script>alert(1)</script><iframe>隠し</iframe>',
  )
  assert.match(html, /<h2>見出し<\/h2>/)
  assert.match(html, /<strong>太字<\/strong>/)
  assert.equal(html.includes('javascript:'), false)
  assert.equal(html.includes('onerror'), false)
  assert.equal(html.includes('<script'), false)
  assert.equal(html.includes('alert(1)'), false)
  assert.equal(html.includes('隠し'), false)
  assert.match(html, /href="https:\/\/example.com\/a"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /src="https:\/\/example.com\/a.png"/)
})

void test('プレビューの合言葉と有効期限', async () => {
  const secret = 'preview-pass-12'
  assert.equal(await passwordMatches(secret, secret), true)
  assert.equal(await passwordMatches('wrong-password', secret), false)

  const issued = await issueSessionToken(secret, 1_000)
  const active = await resolvePreviewAccess({
    secret,
    sessionToken: issued.token,
    targetToken: null,
    now: 1_000,
  })
  assert.equal(active.status, 'active')

  const expired = await resolvePreviewAccess({
    secret,
    sessionToken: issued.token,
    targetToken: null,
    now: issued.exp,
  })
  assert.equal(expired.status, 'anonymous')
  if (expired.status === 'anonymous') assert.equal(expired.reason, 'expired')

  const tampered = `${issued.token.slice(0, -1)}${issued.token.endsWith('a') ? 'b' : 'a'}`
  const invalid = await resolvePreviewAccess({
    secret,
    sessionToken: tampered,
    targetToken: null,
    now: 1_000,
  })
  assert.equal(invalid.status, 'anonymous')
  if (invalid.status === 'anonymous') assert.equal(invalid.reason, 'invalid')

  const unconfigured = await resolvePreviewAccess({
    secret: null,
    sessionToken: issued.token,
    targetToken: null,
    now: 1_000,
  })
  assert.equal(unconfigured.status, 'unconfigured')
})

void test('下書き対象の署名が切れるとプレビューできない', async () => {
  const secret = 'preview-pass-12'
  const session = await issueSessionToken(secret, 1_000)
  const targetToken = await issueTargetToken(secret, session.exp, {
    kind: 'news',
    contentId: 'news1234',
    draftKey: 'draftkey1',
  })
  assert.ok(targetToken)
  const active = await resolvePreviewAccess({
    secret,
    sessionToken: session.token,
    targetToken,
    now: 1_000,
  })
  assert.equal(active.status, 'active')
  if (active.status === 'active') {
    assert.equal(active.target?.kind, 'news')
    assert.equal(active.target?.contentId, 'news1234')
    assert.notEqual(targetToken, 'draftkey1')
  }

  const expired = await resolvePreviewAccess({
    secret,
    sessionToken: session.token,
    targetToken,
    now: session.exp,
  })
  assert.equal(expired.status, 'anonymous')
})

void test('プレビューURLからIDとdraftKeyだけを取り出す', () => {
  const parsed = readPreviewTargetInput(
    'https://example.microcms.io/apis/posts/post1234',
    'https://example.com/preview?draftKey=draftkey1',
  )
  assert.deepEqual(parsed, { contentId: 'post1234', draftKey: 'draftkey1' })
  assert.equal(readPreviewTargetInput('bad id', 'short'), null)
})

function postJson(id: string, slug: string, publishedDate: string, body = '') {
  return { id, title: slug, slug, publishedDate, excerpt: '紹介', body }
}

const publishedNewsBody = {
  totalCount: 5,
  contents: [
    newsJson('newse', 'E', '2026-09-01'),
    newsJson('newsa', 'A', '2026-10-04'),
    newsJson('newsc', 'C', '2026-10-02'),
    newsJson('newsb', 'B', '2026-10-03'),
    newsJson('newsd', 'D', '2026-10-01'),
  ],
}

function newsJson(id: string, title: string, date: string) {
  return { id, title, date, body: '本文' }
}

function newsItem(id: string, title: string, iso: string) {
  return { id, title, body: '下書き', dateLabel: '日付', iso, linkUrl: null }
}

function assertPublicNewsQuery(url: string) {
  const parsed = new URL(url)
  assert.equal(parsed.pathname, '/api/v1/news')
  assert.equal(parsed.searchParams.get('limit'), '10')
  assert.equal(parsed.searchParams.get('orders'), '-date')
  assert.equal(parsed.searchParams.has('draftKey'), false)
}

async function withPublishedNews(
  run: (input: {
    home: () => ReturnType<typeof getPublishedNews>
    preview: () => ReturnType<typeof getPublishedNewsForPreview>
    urls: string[]
  }) => Promise<void>,
) {
  await withFakeCms(async () => {
    const urls: string[] = []
    const fetchImpl = async (url: string) => {
      urls.push(url)
      return jsonResponse(publishedNewsBody)
    }
    await run({
      home: () => getPublishedNews({ fetchImpl }),
      preview: () => getPublishedNewsForPreview({ fetchImpl }),
      urls,
    })
  })
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

async function withFakeCms(run: () => Promise<void>) {
  const previousDomain = process.env.MICROCMS_SERVICE_DOMAIN
  const previousKey = process.env.MICROCMS_API_KEY
  process.env.MICROCMS_SERVICE_DOMAIN = 'example-service'
  process.env.MICROCMS_API_KEY = 'test-key-value'
  try {
    await run()
  } finally {
    restoreEnv('MICROCMS_SERVICE_DOMAIN', previousDomain)
    restoreEnv('MICROCMS_API_KEY', previousKey)
  }
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
