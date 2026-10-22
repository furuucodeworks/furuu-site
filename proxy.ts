/**
 * 公開ページとプレビューの応答ヘッダ。
 *
 * ファイル名が proxy なのは、今の vinext がキャッシュ制御の入口を proxy と呼ぶため。
 * middleware という名前だとビルドのたびに非推奨の警告が出る。動きは同じで、ページの前にヘッダを付ける。
 *
 * 公開HTMLも private, no-store。
 * ブラウザやCDNが記事本文を保持すると、非公開のあとも詳細URLに本文が残る。
 * 反映は次のアクセスでCMSを読み直す。手動ビルドは要らない。
 *
 * プレビューは加えて noindex と Referrer-Policy。
 * 下書きのアドレスが検索や外部リンクの参照元に出ないようにする。
 * draftKey はURLに載せないが、プレビューだと分かるURL自体も残さない。
 *
 * 見直す条件: 公開環境の転送量が Hobby の 20GB/月に近づいたとき。
 * そのときも、消せるまで古い本文が残るキャッシュにはしない。
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('CDN-Cache-Control', 'no-store')

  if (pathname === '/preview' || pathname.startsWith('/preview/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Referrer-Policy', 'no-referrer')
  }

  return response
}

export const config = {
  matcher: ['/', '/blog', '/blog/:path*', '/preview', '/preview/:path*'],
}
