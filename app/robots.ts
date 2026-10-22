import type { MetadataRoute } from 'next'

/**
 * プレビューだけを検索対象から外す。公開ページの許可範囲は変えない。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/preview',
    },
  }
}
