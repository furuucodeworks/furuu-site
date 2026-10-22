/**
 * microCMS リッチエディタのHTMLを、許可した要素だけ作り直して表示する。
 *
 * 見出し・太字・リンク・画像に加え、エディタが出す段落・リスト・引用・図も残す。
 * script やイベント属性、javascript: URL は子の文字も含めて捨てる。
 * 正規表現での置換は崩れたタグをすり抜けるため、パーサで一度分解してから許可分だけ連結する。
 *
 * 画像は https のみ。リンクは http / https / mailto のみ。
 * 認証情報付きURL（user:pass@host）は拒む。
 */
import { Parser } from 'htmlparser2'
import { safeHttpsUrl, safeLinkHref } from './content.ts'

/** 無料公開環境の処理時間を守る暫定上限。超えた本文は描画しない。長い記事が必要になったら分割を検討する。 */
export const MAX_RICH_TEXT_CHARS = 200_000

const ALLOW_TAGS = new Set([
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'strong',
  'b',
  'em',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'img',
  'figure',
  'figcaption',
])

/** 中の文字まで出してはいけない要素。span や div はここへ入れず、タグだけ外して中身を残す。 */
const SKIP_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'noscript',
  'template',
  'textarea',
  'title',
  'form',
  'button',
  'input',
  'select',
  'option',
  'video',
  'audio',
  'canvas',
  'link',
  'meta',
  'base',
])

type Frame = { tag: string; mode: 'allow' | 'unwrap' | 'skip' | 'void' }

export function sanitizeRichText(input: unknown): string {
  if (typeof input !== 'string' || input.length === 0 || input.length > MAX_RICH_TEXT_CHARS) return ''
  const stack: Frame[] = []
  let html = ''

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        const tag = name.toLowerCase()
        const parent = stack.at(-1)
        if (parent?.mode === 'skip' || SKIP_TAGS.has(tag)) {
          stack.push({ tag, mode: 'skip' })
          return
        }
        if (!ALLOW_TAGS.has(tag)) {
          stack.push({ tag, mode: 'unwrap' })
          return
        }
        if (tag === 'br') {
          html += '<br />'
          stack.push({ tag, mode: 'void' })
          return
        }
        if (tag === 'img') {
          const src = safeHttpsUrl(attribs.src)
          if (!src) {
            stack.push({ tag, mode: 'void' })
            return
          }
          html += `<img src="${escapeAttr(src)}" alt="${escapeAttr(attribs.alt ?? '')}" />`
          stack.push({ tag, mode: 'void' })
          return
        }
        if (tag === 'a') {
          const href = safeLinkHref(attribs.href)
          if (!href) {
            stack.push({ tag, mode: 'unwrap' })
            return
          }
          const external = href.startsWith('http://') || href.startsWith('https://')
          const extra = external ? ' target="_blank" rel="noopener noreferrer"' : ''
          html += `<a href="${escapeAttr(href)}"${extra}>`
          stack.push({ tag, mode: 'allow' })
          return
        }
        html += `<${tag}>`
        stack.push({ tag, mode: 'allow' })
      },
      ontext(text) {
        if (stack.at(-1)?.mode === 'skip') return
        html += escapeText(text)
      },
      onclosetag() {
        const frame = stack.pop()
        if (frame?.mode === 'allow') html += `</${frame.tag}>`
      },
    },
    { decodeEntities: true },
  )

  parser.write(input)
  parser.end()
  return html
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}
