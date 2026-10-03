import type { Metadata } from 'next';
import { CoffeeProductList } from '@/components/coffee-product-list';
import { CoffeeStoreLink } from '@/components/coffee-store-link';
import { SiteFrame } from '@/components/site-frame';

/**
 * COFFEEページ。
 *
 * 差し替え:
 * - coffeePhotos … 写真
 * - brewSteps … 02 ドリップバッグの手順
 * - lib/coffee-products.ts … 03 販売商品と STORES 商品 URL
 * - lib/online-store.ts … 04 ストアトップ URL
 */
const coffeePhotos = {
  hero: {
    src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=85',
    alt: '植物のそばに並んだコーヒーのカップ',
    caption: 'FOR AN ORDINARY DAY.',
  },
  beans: {
    src: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=85',
    alt: '焙煎したコーヒー豆',
    caption: 'ROASTED BEANS.',
  },
  drip: {
    src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1400&q=85',
    alt: '木のテーブルに置かれた、淹れたあとのコーヒー',
    caption: 'A BREWED CUP.',
  },
} as const;

const brewSteps = [
  {
    index: '01',
    title: '準備する',
    body: 'カップを用意して、ドリップバッグをふちにのせます。',
  },
  {
    index: '02',
    title: '注ぐ',
    body: 'お湯を、中心へゆっくり注ぎます。湯量や待つ時間は、届いた商品の案内にあわせてください。',
  },
  {
    index: '03',
    title: '楽しむ',
    body: 'バッグを外して、そのまま一杯を。熱いうちでも、少し置いてからでも大丈夫です。',
  },
] as const;

const title = 'COFFEE | FURUU COFFEE';
const description =
  '豆から、ドリップバッグから。暮らしに合うコーヒーの楽しみ方を、FURUU COFFEEが紹介します。';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: ['/og.png'],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
  },
};

export default function CoffeePage() {
  return (
    <SiteFrame current="coffee">
      <div className="page-coffee">
        <section className="coffee-hero" aria-labelledby="coffee-page-title">
          <div className="coffee-hero-grid">
            <div className="coffee-copy">
              <p className="eyebrow">COFFEE</p>
              <h1 id="coffee-page-title">
                日々のコーヒーを、
                <br />
                自分のペースで。
              </h1>
              <p className="coffee-lead">
                豆から、ドリップバッグから。暮らしに合う楽しみ方を選ぶ。むずかしい知識は、いりません。
              </p>
            </div>
            <figure>
              <img src={coffeePhotos.hero.src} alt={coffeePhotos.hero.alt} />
              <figcaption>{coffeePhotos.hero.caption}</figcaption>
            </figure>
          </div>
        </section>

        <section
          id="coffee-beans"
          className="coffee-beans section"
          aria-labelledby="coffee-beans-title"
        >
          <div className="section-label">
            <span>01 / COFFEE BEANS</span>
            <span>コーヒー豆</span>
          </div>
          <h2 id="coffee-beans-title">
            挽く香りから、
            <br />
            淹れる時間を。
          </h2>
          <div className="coffee-feature">
            <div className="coffee-copy">
              <p>
                袋を開けて、豆を挽く。それだけで、部屋に香りが広がります。お湯を注いで、カップがいっぱいになるのを待つ時間も、コーヒーの楽しさです。
              </p>
              <p>
                濃さや温度は、その日の気分で大丈夫です。正しく淹れることより、また飲みたいと思えることを大切にしています。
              </p>
            </div>
            <figure>
              <img src={coffeePhotos.beans.src} alt={coffeePhotos.beans.alt} />
              <figcaption>{coffeePhotos.beans.caption}</figcaption>
            </figure>
          </div>
        </section>

        <section
          id="drip-bag"
          className="drip-section section"
          aria-labelledby="drip-bag-title"
        >
          <div className="section-label">
            <span>02 / DRIP BAG</span>
            <span>ドリップバッグ</span>
          </div>
          <h2 id="drip-bag-title">
            手軽に淹れて、
            <br />
            どこでも一杯。
          </h2>
          <div className="coffee-feature">
            <div className="coffee-copy">
              <p>
                ドリップバッグは、カップにのせてお湯を注ぐだけで淹れられます。朝の忙しい時間や、仕事の合間、出かけ先でも、ほぼ同じ手順で一杯になります。
              </p>
              <p>
                道具を増やしたくない日は、こちらをどうぞ。味の細かな調整より、すぐ飲めることを優先した飲み方です。
              </p>
            </div>
            <figure>
              <img src={coffeePhotos.drip.src} alt={coffeePhotos.drip.alt} />
              <figcaption>{coffeePhotos.drip.caption}</figcaption>
            </figure>
          </div>
          <ol className="brew-steps">
            {brewSteps.map((step) => (
              <li key={step.index}>
                <span className="step-index">{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="coffee-products"
          className="coffee-products section"
          aria-labelledby="coffee-products-title"
        >
          <div className="section-label">
            <span>03 / OUR COFFEE</span>
            <span>商品</span>
          </div>
          <h2 id="coffee-products-title">
            届けている、
            <br />
            コーヒー。
          </h2>
          <p className="coffee-products-lead">
            いま取り扱っているコーヒーです。豆のまま、粉、ドリップバッグから、お好みの形態でオンラインストアをご利用ください。
          </p>
          <CoffeeProductList />
        </section>

        <section
          className="coffee-store section"
          aria-labelledby="coffee-store-title"
        >
          <div className="section-label">
            <span>04 / ONLINE STORE</span>
            <span>購入する</span>
          </div>
          <h2 id="coffee-store-title">
            まだ決めきれない方も、
            <br />
            ストアへ。
          </h2>
          <p>
            銘柄や形態まで決まらないときは、オンラインストアで一覧からお選びください。
          </p>
          <CoffeeStoreLink />
        </section>
      </div>
    </SiteFrame>
  );
}
