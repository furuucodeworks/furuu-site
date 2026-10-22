/**
 * プレビュー配下は検索と共有キャッシュに入れない。
 * 個別ページでも dynamic を指定し、ビルド結果へ下書きを残さない。
 */
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'プレビュー | FURUU COFFEE',
  robots: { index: false, follow: false },
}

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return children
}
