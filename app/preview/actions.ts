'use server'

/**
 * プレビューのログイン、対象の保存、終了。
 * 合言葉と draftKey は POST の本体だけで受け、URL にもログにも残さない。
 * Cookie は httpOnly。JavaScript から読めないようにし、APIキーは入れない。
 * Path は /preview だけ。公開ページのリクエストへ下書き情報を付けない。
 * SameSite=Lax。別サイトからの勝手な送信でログインさせない。
 * Secure は本番だけ。ローカルの http では付かない（付けると保存されない）。
 */
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { readPreviewPassword } from '@/lib/cms/config'
import { loadPreviewAccess, PREVIEW_SESSION_COOKIE, PREVIEW_TARGET_COOKIE } from '@/lib/cms/preview-access'
import {
  PREVIEW_SESSION_MS,
  issueSessionToken,
  issueTargetToken,
  passwordMatches,
  readPreviewTargetInput,
} from '@/lib/cms/preview-token'

const MAX_ATTEMPTS = 8
const BLOCK_MS = 15 * 60 * 1000

const attempts = new Map<string, { count: number; blockedUntil: number }>()

/**
 * 合言葉の試行は、このサーバープロセスの中だけ数える。
 * 公開環境ではインスタンスごとに別カウントになるため、総当たりを完全には止めない。
 * 見直す条件: プレビューをインターネットへ出す前。合言葉の長さとセットで確認する。
 */

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/preview',
    maxAge,
  }
}

export async function loginPreview(formData: FormData) {
  const secret = readPreviewPassword()
  if (!secret) redirect('/preview')

  const key = await rateKey()
  const now = Date.now()
  pruneAttempts(now)
  const current = attempts.get(key)
  if (current && current.blockedUntil > now) redirect('/preview?notice=blocked')

  const password = readText(formData.get('password'))
  const matched = await passwordMatches(password, secret)
  if (!matched) {
    const previous = current && current.blockedUntil === 0 ? current.count : 0
    const count = previous + 1
    attempts.set(key, {
      count,
      blockedUntil: count >= MAX_ATTEMPTS ? now + BLOCK_MS : 0,
    })
    redirect(count >= MAX_ATTEMPTS ? '/preview?notice=blocked' : '/preview?notice=mismatch')
  }

  attempts.delete(key)
  const issued = await issueSessionToken(secret, now)
  const store = await cookies()
  store.set(PREVIEW_SESSION_COOKIE, issued.token, cookieOptions(Math.floor(PREVIEW_SESSION_MS / 1000)))
  store.set(PREVIEW_TARGET_COOKIE, '', cookieOptions(0))
  redirect('/preview')
}

export async function savePreviewTarget(formData: FormData) {
  const secret = readPreviewPassword()
  const access = await loadPreviewAccess()
  if (!secret || access.status !== 'active') redirect('/preview?notice=expired')

  const kindValue = readText(formData.get('kind'))
  const kind = kindValue === 'posts' || kindValue === 'news' ? kindValue : null
  const target = readPreviewTargetInput(readText(formData.get('contentId')), readText(formData.get('draftKey')))
  if (!kind || !target) redirect('/preview?notice=invalid')

  const token = await issueTargetToken(secret, access.exp, { kind, ...target })
  if (!token) redirect('/preview?notice=invalid')

  const remaining = Math.max(1, Math.floor((access.exp - Date.now()) / 1000))
  const store = await cookies()
  store.set(PREVIEW_TARGET_COOKIE, token, cookieOptions(remaining))
  redirect(kind === 'posts' ? '/preview/post' : '/preview/news')
}

export async function clearPreviewTarget() {
  const access = await loadPreviewAccess()
  if (access.status !== 'active') redirect('/preview?notice=expired')
  const store = await cookies()
  store.set(PREVIEW_TARGET_COOKIE, '', cookieOptions(0))
  redirect('/preview?notice=switched')
}

export async function endPreview() {
  const store = await cookies()
  store.set(PREVIEW_SESSION_COOKIE, '', cookieOptions(0))
  store.set(PREVIEW_TARGET_COOKIE, '', cookieOptions(0))
  redirect('/preview?notice=ended')
}

function readText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : ''
}

async function rateKey(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const raw = forwarded || headerList.get('x-real-ip') || 'local'
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const bytes = new Uint8Array(digest)
  return [...bytes].slice(0, 8).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function pruneAttempts(now: number) {
  if (attempts.size < 100) return
  for (const [key, value] of attempts) {
    if (value.blockedUntil !== 0 && value.blockedUntil <= now) attempts.delete(key)
  }
}
