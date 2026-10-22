'use client'

/**
 * 既存TOPの並びと余白を保ったまま、新着記事とお知らせだけCMSの公開データに差し替える。
 * 取得はサーバー側。このファイルはクリックやメニューのためだけにクライアントで動く。
 * APIキーも下書きもここには来ない。
 */
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteFrame, useSiteNotice } from '@/components/site-frame'
import {
  cmsProblemMessage,
  type CategoryItem,
  type CmsListResult,
  type NewsItem,
  type PostCard,
} from '@/lib/cms/content'

const photos = {
  hero: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=85',
  beans:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85',
  cup: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
  work: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85',
}

export function HomeMain({
  posts,
  news,
  categories,
  newsOutsidePreview,
}: {
  posts: CmsListResult<PostCard>
  news: CmsListResult<NewsItem>
  categories: CmsListResult<CategoryItem>
  newsOutsidePreview?: NewsItem | null
}) {
  const { openPreview } = useSiteNotice()
  const latest = posts.status === 'ready' ? posts.items[0] : null

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A QUIET MOMENT, EVERY DAY.</p>
          <h1>
            何も考えなくていい、
            <br />
            コーヒー。
          </h1>
          <p className="hero-desc">
            一杯を淹れる。ひと息つく。
            <br />
            いつもの日々に、自分に戻る時間を。
          </p>
        </div>
        <figure className="hero-photo">
          <img src={photos.hero} alt="自然光の中に置かれた一杯のコーヒー" />
          <figcaption>GOOD COFFEE. SIMPLE PLEASURES.</figcaption>
        </figure>
        <div className="hero-bottom">
          <a href="#about">SCROLL TO EXPLORE ↓</a>
        </div>
        <Button
          className="circle-store"
          onClick={(event) => openPreview(event.currentTarget)}
        >
          <ShoppingBag size={23} />
          <span>
            ONLINE
            <br />
            STORE
          </span>
          <small>コーヒーを選ぶ ↗</small>
        </Button>
      </section>
      <section id="about" className="about section">
        <div className="section-label">
          <span>01 / ABOUT US</span>
          <span>私たちについて</span>
        </div>
        <div className="about-grid">
          <div>
            <h2>
              おいしい、の先に。
              <br />
              何もしない時間を。
            </h2>
            <p>
              むずかしい知識も、特別な理由もいらない。
              <br />
              ただ、自然に「おいしい」と思えること。
            </p>
            <p>
              FURUU COFFEEが届けたいのは、
              <br />
              気軽に飲めるコーヒーと、
              <br />
              あふれる思考が、ふっとほどけるひとときです。
            </p>
            <Link className="text-link" href="/about" prefetch={false}>
              私たちが大切にしていること <ArrowRight size={18} />
            </Link>
          </div>
          <figure>
            <img src={photos.cup} alt="コーヒーのある日常の風景" />
            <figcaption>A LITTLE PAUSE IN YOUR DAY.</figcaption>
          </figure>
        </div>
      </section>
      <section id="coffee" className="coffee section">
        <div className="section-label">
          <span>02 / OUR COFFEE</span>
          <span>日々に寄り添うコーヒー</span>
        </div>
        <div className="section-heading">
          <h2>
            今日の気分で、
            <br />
            いつもの一杯を。
          </h2>
          <p>
            豆から、ドリップバッグから。
            <br />
            あなたの暮らしに合う楽しみ方で。
          </p>
        </div>
        <div className="products">
          <article>
            <div className="product-image">
              <img src={photos.beans} alt="焙煎したコーヒー豆" />
              <span>01</span>
            </div>
            <div className="product-title">
              <h3>
                COFFEE BEANS<small>コーヒー豆</small>
              </h3>
              <Link
                className="round-arrow"
                href="/coffee#coffee-beans"
                aria-label="コーヒー豆の紹介を見る"
                prefetch={false}
              >
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <p>豆を挽く香りから、楽しむ時間。</p>
          </article>
          <article>
            <div className="product-image">
              <img src={photos.work} alt="カップに注がれたコーヒー" />
              <span>02</span>
            </div>
            <div className="product-title">
              <h3>
                DRIP BAG<small>ドリップバッグ</small>
              </h3>
              <Link
                className="round-arrow"
                href="/coffee#drip-bag"
                aria-label="ドリップバッグの紹介を見る"
                prefetch={false}
              >
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <p>忙しい日にも、ひと息つける一杯を。</p>
          </article>
        </div>
      </section>
      <section id="blog" className="blog section">
        <div className="section-label">
          <span>03 / BLOG</span>
          <span>考えたこと、試したこと。</span>
        </div>
        <div className="journal-grid">
          {latest?.imageUrl ? (
            <img src={latest.imageUrl} alt={latest.title} />
          ) : posts.status === 'ready' ? (
            <div className="cms-photo-fallback" aria-hidden="true" />
          ) : (
            <img src={photos.cup} alt="コーヒーとともに過ごす時間" />
          )}
          <div>
            {posts.status === 'error' ? (
              <>
                <h2>新着記事を読み込めませんでした。</h2>
                <p>{cmsProblemMessage('記事', posts.reason)}</p>
              </>
            ) : latest ? (
              <>
                <span className="article-category">
                  {latest.categoryName ?? 'カテゴリー未設定'} / {latest.dateLabel}
                </span>
                <h2>
                  {latest.href ? (
                    <Link href={latest.href} prefetch={false}>
                      {latest.title}
                    </Link>
                  ) : (
                    latest.title
                  )}
                </h2>
                {latest.excerpt ? <p>{latest.excerpt}</p> : null}
                {latest.slugNote !== 'ok' ? (
                  <span className="coming">この記事はURLの問題で詳細を開けません。</span>
                ) : null}
                {latest.href ? (
                  <Link className="text-link" href={latest.href} prefetch={false}>
                    記事を読む <ArrowRight size={18} />
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <h2>公開中の記事はまだありません。</h2>
                <p>記事を公開すると、ここに新しいものから表示します。</p>
              </>
            )}
            <Link className="text-link" href="/blog" prefetch={false}>
              記事一覧を見る <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="categories">
          <p className="categories-label">CATEGORY</p>
          {categories.status === 'error' ? (
            <p>{cmsProblemMessage('カテゴリー', categories.reason)}</p>
          ) : categories.status === 'empty' ? (
            <p>カテゴリーはまだありません。</p>
          ) : (
            <div className="category-list">
              {categories.items.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog?category=${encodeURIComponent(category.id)}`}
                  prefetch={false}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="news section">
        <div className="news-body">
          <div className="section-label">
            <span>04 / NEWS</span>
            <span>お知らせ</span>
          </div>
          <div className="news-entries">
            {news.status === 'error' ? (
              <p>{cmsProblemMessage('お知らせ', news.reason)}</p>
            ) : news.status === 'empty' ? (
              <p>公開中のお知らせはまだありません。</p>
            ) : (
              news.items.map((item) => <NewsEntry key={item.id} item={item} />)
            )}
            {newsOutsidePreview ? (
              <div>
                <p className="cms-note">
                  このお知らせは日付が古いため、公開後のTOPの3件には入りません。
                </p>
                <NewsEntry item={{ ...newsOutsidePreview, preview: true }} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}

function NewsEntry({ item }: { item: NewsItem }) {
  return (
    <article>
      <p className="news-date">
        {item.dateLabel}
        {item.preview ? <span className="news-preview-mark">プレビュー</span> : null}
      </p>
      <h3>
        {item.linkUrl ? (
          <a href={item.linkUrl} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>
      {item.body ? <p className="news-text">{item.body}</p> : null}
    </article>
  )
}

export function HomePage(props: {
  posts: CmsListResult<PostCard>
  news: CmsListResult<NewsItem>
  categories: CmsListResult<CategoryItem>
  newsOutsidePreview?: NewsItem | null
}) {
  return (
    <SiteFrame>
      <HomeMain {...props} />
    </SiteFrame>
  )
}
