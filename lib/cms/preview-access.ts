/**
 * プレビューCookieの読み取り。公開ページでは呼ばない。
 * 値の検証は preview-token.ts。ここではリクエストからの取り出しだけを行う。
 */
import { cookies } from 'next/headers'
import { readPreviewPassword } from './config.ts'
import { type PreviewAccess, resolvePreviewAccess } from './preview-token.ts'

export const PREVIEW_SESSION_COOKIE = 'furuu_preview_session'
export const PREVIEW_TARGET_COOKIE = 'furuu_preview_target'

export async function loadPreviewAccess(now = Date.now()): Promise<PreviewAccess> {
  const store = await cookies()
  return resolvePreviewAccess({
    secret: readPreviewPassword(),
    sessionToken: store.get(PREVIEW_SESSION_COOKIE)?.value ?? null,
    targetToken: store.get(PREVIEW_TARGET_COOKIE)?.value ?? null,
    now,
  })
}
