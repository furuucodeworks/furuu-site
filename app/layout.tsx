import type { Metadata } from 'next';
import './globals.css';
const title='FURUU COFFEE | 何も考えなくていい、コーヒー。';
const description='気軽に飲めるコーヒーと、自分に戻るひとときを。FURUU COFFEEのデザインプレビュー。';
export const metadata: Metadata = {metadataBase:new URL('https://furuu-coffee-design.furuu-code-works.chatgpt.site'),title,description,openGraph:{title,description,images:['/og.png'],locale:'ja_JP',type:'website'},twitter:{card:'summary_large_image',title,description,images:['/og.png']}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ja"><body>{children}</body></html>}
