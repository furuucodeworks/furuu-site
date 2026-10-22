import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SiteFrame } from '@/components/site-frame';

/**
 * ABOUTページの仮原稿。
 * プロフィール文はこのファイル内の見出しと段落を差し替えてください。
 * イラストを差し替えるときは public/about-profile.jpg を置き換えてください。
 * 仮であることは画面には出していません。
 */
const aboutPhotos = {
  profile: {
    src: '/about-profile.jpg',
    alt: 'コーヒーのマグを持ち、頭の上に猫が乗っているイラスト',
  },
  story: {
    src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1400&q=85',
    alt: '木のテーブルに置かれた一杯のコーヒー',
    caption: 'A CUP FOR AN ORDINARY DAY.',
  },
} as const;

const title = 'ABOUT | FURUU COFFEE';
const description =
  '何も考えなくていい、コーヒー。FURUU COFFEEが大切にしていることと、作り手の姿勢を紹介します。';

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

export default function AboutPage() {
  return (
    <SiteFrame current="about">
      <div className="page-about">
        <section className="about-hero" aria-labelledby="about-page-title">
          <p className="eyebrow">ABOUT</p>
          <h1 id="about-page-title">
            日常に、
            <br />
            自分に戻る時間を。
          </h1>
          <div className="about-profile">
            <img
              className="about-portrait"
              src={aboutPhotos.profile.src}
              alt={aboutPhotos.profile.alt}
            />
            <div className="about-copy">
              <h2 id="about-profile-title">コーヒーを届ける人です。</h2>
              <p>
                むずかしい肩書きはありません。気軽に飲めて、飲んだあとに少しほっとできる一杯を、毎日の基準にしています。
              </p>
              <p>
                頭の上の猫と、手元のコーヒー。この絵のように、力を抜いて過ごせる時間を大切にしています。
              </p>
            </div>
          </div>
        </section>

        <section
          className="about-story section"
          aria-labelledby="about-story-title"
        >
          <div className="section-label">
            <span>01 / OUR STORY</span>
            <span>ブランドについて</span>
          </div>
          <h2 id="about-story-title">
            何も考えなくていい、
            <br />
            コーヒー。
          </h2>
          <div className="story-grid">
            <div className="about-copy">
              <p>
                淹れ方を究めることより、いつもの場所で手に取れることを大切にしています。豆のまま楽しむ日も、すぐに淹れたい日も、どちらも同じように気持ちのよい時間であってほしい。
              </p>
              <p>
                届けたいのは、気軽に飲めるコーヒーと、あふれる思考がふっとほどけるひとときです。説明を覚える前に、まず一杯を味わえること。その積み重ねが、FURUU
                COFFEEの輪郭だと考えています。
              </p>
            </div>
            <figure>
              <img src={aboutPhotos.story.src} alt={aboutPhotos.story.alt} />
              <figcaption>{aboutPhotos.story.caption}</figcaption>
            </figure>
          </div>
        </section>

        <section
          className="about-values section"
          aria-labelledby="about-values-title"
        >
          <div className="section-label">
            <span>02 / OUR VALUES</span>
            <span>大切にしていること</span>
          </div>
          <h2 id="about-values-title">
            自然に、
            <br />
            また飲みたくなること。
          </h2>
          <div className="value-list">
            <article>
              <span className="value-index">01</span>
              <h3>自然においしいと思えること</h3>
              <p>
                言葉や数値より先に、飲んだ人がそのままおいしいと感じられることを大切にしています。
              </p>
            </article>
            <article>
              <span className="value-index">02</span>
              <h3>むずかしい知識がなくても楽しめること</h3>
              <p>
                道具や手順を覚えなくても、日常に取り入れられる形を選んでいます。知っている人だけのものにはしません。
              </p>
            </article>
            <article>
              <span className="value-index">03</span>
              <h3>日常に寄り添うこと</h3>
              <p>
                特別な日のごちそうではなく、朝や仕事の合間、何もしない午後にも置けるコーヒーでありたいと考えています。
              </p>
            </article>
          </div>
        </section>

        <section
          className="about-next section"
          aria-labelledby="about-next-title"
        >
          <div className="section-label">
            <span>03 / NEXT</span>
            <span>次のページへ</span>
          </div>
          <h2 id="about-next-title">
            コーヒーと、
            <br />
            日々の記録。
          </h2>
          <p>
            豆とドリップバッグは、コーヒーのページでご覧ください。考えたことや、試していることは、ブログの欄に残していきます。
          </p>
          <div className="about-next-links">
            <Link className="text-link" href="/coffee" prefetch={false}>
              コーヒーを見る <ArrowRight size={18} />
            </Link>
            {/* 公開記事の一覧。TOPの新着欄ではなく /blog を開く。 */}
            <Link className="text-link" href="/blog" prefetch={false}>
              ブログを見る <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
