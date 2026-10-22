/**
 * 本人用プレビューの合言葉と、下書き対象の署名。
 *
 * Cookieに合言葉もAPIキーも入れない。入れるのは有効期限とHMACだけ。
 * 下書き対象は別Cookieで、同じく署名する。期限はログインと同じ時刻で切る。
 * 署名が合わない・期限切れの値は、無ログインとして捨てる。
 *
 * 有効期限は2時間。確認には足りて、置き忘れても半日残らない長さ。
 * 見直す条件: 長い原稿の確認で足りないとき。延ばしても8時間以内に留める。
 */
import { formatDateTimeJst, isContentId, isDraftKey } from './content.ts'

export const PREVIEW_SESSION_MS = 2 * 60 * 60 * 1000

export type PreviewTarget = {
  kind: 'posts' | 'news'
  contentId: string
  draftKey: string
  exp: number
}

export type PreviewAccess =
  | { status: 'unconfigured' }
  | { status: 'anonymous'; reason: 'none' | 'expired' | 'invalid' }
  | { status: 'active'; exp: number; expLabel: string; target: PreviewTarget | null }

type SessionPayload = { purpose: 'session'; exp: number }
type TargetPayload = {
  purpose: 'target'
  exp: number
  kind: 'posts' | 'news'
  contentId: string
  draftKey: string
}

export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(`furuu-preview\0${input}`)),
    crypto.subtle.digest('SHA-256', encoder.encode(`furuu-preview\0${expected}`)),
  ])
  return fixedEqual(new Uint8Array(left), new Uint8Array(right))
}

export async function issueSessionToken(
  secret: string,
  now: number,
): Promise<{ token: string; exp: number }> {
  const exp = now + PREVIEW_SESSION_MS
  const token = await signToken(secret, { purpose: 'session', exp })
  return { token, exp }
}

export async function issueTargetToken(
  secret: string,
  exp: number,
  target: { kind: 'posts' | 'news'; contentId: string; draftKey: string },
): Promise<string | null> {
  if (!isContentId(target.contentId) || !isDraftKey(target.draftKey)) return null
  return signToken(secret, {
    purpose: 'target',
    exp,
    kind: target.kind,
    contentId: target.contentId,
    draftKey: target.draftKey,
  })
}

export async function resolvePreviewAccess(input: {
  secret: string | null
  sessionToken: string | null
  targetToken: string | null
  now: number
}): Promise<PreviewAccess> {
  if (!input.secret) return { status: 'unconfigured' }
  const session = await readSession(input.sessionToken, input.secret, input.now)
  if (session.status !== 'active') return { status: 'anonymous', reason: session.reason }
  const target = await readTarget(input.targetToken, input.secret, input.now, session.exp)
  return {
    status: 'active',
    exp: session.exp,
    expLabel: formatDateTimeJst(session.exp),
    target,
  }
}

/**
 * 入力欄にIDとdraftKeyを分けて貼る想定。
 * プレビューURLをそのまま貼った場合だけ、サーバー側で値を取り出す。チャットには貼らせない。
 */
export function readPreviewTargetInput(
  contentIdRaw: string,
  draftKeyRaw: string,
): { contentId: string; draftKey: string } | null {
  if (contentIdRaw.length > 2000 || draftKeyRaw.length > 2000) return null
  const combined = `${contentIdRaw}\n${draftKeyRaw}`
  let contentId = contentIdRaw.trim()
  let draftKey = draftKeyRaw.trim()

  const keyMatch = combined.match(/[?&]draftKey=([^&\s#]+)/)
  if (keyMatch) {
    try {
      draftKey = decodeURIComponent(keyMatch[1])
    } catch {
      return null
    }
  }
  const idFromApi = combined.match(/\/(?:api\/v1|apis)\/(?:posts|news)\/([A-Za-z0-9_-]+)/)
  const idFromQuery = combined.match(/[?&](?:contentId|id)=([^&\s#]+)/)
  if (idFromApi) contentId = idFromApi[1]
  else if (idFromQuery) {
    try {
      contentId = decodeURIComponent(idFromQuery[1])
    } catch {
      return null
    }
  }

  if (!isContentId(contentId) || !isDraftKey(draftKey)) return null
  return { contentId, draftKey }
}

async function readSession(
  token: string | null,
  secret: string,
  now: number,
): Promise<{ status: 'active'; exp: number } | { status: 'anonymous'; reason: 'none' | 'expired' | 'invalid' }> {
  if (!token) return { status: 'anonymous', reason: 'none' }
  const payload = await verifyToken(token, secret)
  if (!payload || payload.purpose !== 'session' || typeof payload.exp !== 'number') {
    return { status: 'anonymous', reason: 'invalid' }
  }
  if (payload.exp <= now) return { status: 'anonymous', reason: 'expired' }
  return { status: 'active', exp: payload.exp }
}

async function readTarget(
  token: string | null,
  secret: string,
  now: number,
  sessionExp: number,
): Promise<PreviewTarget | null> {
  if (!token) return null
  const payload = await verifyToken(token, secret)
  if (!payload || payload.purpose !== 'target') return null
  const target = payload as Partial<TargetPayload>
  if (typeof target.exp !== 'number' || target.exp <= now || target.exp > sessionExp) return null
  if (target.kind !== 'posts' && target.kind !== 'news') return null
  if (typeof target.contentId !== 'string' || typeof target.draftKey !== 'string') return null
  if (!isContentId(target.contentId) || !isDraftKey(target.draftKey)) return null
  return {
    kind: target.kind,
    contentId: target.contentId,
    draftKey: target.draftKey,
    exp: target.exp,
  }
}

async function signToken(secret: string, payload: SessionPayload | TargetPayload): Promise<string> {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await hmac(secret, body)
  return `${body}.${signature}`
}

async function verifyToken(token: string, secret: string): Promise<Record<string, unknown> | null> {
  if (token.length > 4000) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  const expected = await hmac(secret, body)
  const left = base64UrlToBytes(signature)
  const right = base64UrlToBytes(expected)
  if (!left || !right || !fixedEqual(left, right)) return null
  const jsonBytes = base64UrlToBytes(body)
  if (!jsonBytes) return null
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(jsonBytes))
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return bytesToBase64Url(new Uint8Array(signature))
}

function fixedEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index += 1) diff |= left[index] ^ right[index]
  return diff === 0
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4)
  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    return null
  }
}
