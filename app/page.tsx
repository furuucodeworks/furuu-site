'use client';

import { ArrowRight, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteFrame, useSiteNotice } from '@/components/site-frame';

const photos = {
  hero: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=85',
  beans:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85',
  cup: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
  work: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85',
};

export default function Home() {
  return (
    <SiteFrame>
      <HomeMain />
    </SiteFrame>
  );
}

function HomeMain() {
  const { openPreview } = useSiteNotice();

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
            <a className="text-link" href="/about">
              私たちが大切にしていること <ArrowRight size={18} />
            </a>
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
              <a
                className="round-arrow"
                href="/coffee#coffee-beans"
                aria-label="コーヒー豆の紹介を見る"
              >
                <ArrowUpRight size={16} />
              </a>
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
              <a
                className="round-arrow"
                href="/coffee#drip-bag"
                aria-label="ドリップバッグの紹介を見る"
              >
                <ArrowUpRight size={16} />
              </a>
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
          <img src={photos.cup} alt="コーヒーとともに過ごす時間" />
          <div>
            <span className="article-category">
              FURUU COFFEEの日々 / 最初の記事
            </span>
            <h2>
              「何も考えなくていい、コーヒー。」
              <br />
              を作るために。
            </h2>
            <p>
              私が考え、取り組んでいくこと。
              <br />
              この場所から、FURUU COFFEEの記録をはじめます。
            </p>
            <span className="coming">COMING SOON — ただいま執筆準備中</span>
          </div>
        </div>
        <div className="categories">
          <p className="categories-label">CATEGORY</p>
          <div className="category-list">
            <span>コーヒー</span>
            <span>商品づくり</span>
            <span>Web・EC</span>
            <span>マーケティング・発信</span>
            <span>実験と改善</span>
            <span>FURUU COFFEEの日々</span>
          </div>
        </div>
      </section>
      <section className="news section">
        <div className="news-body">
          <div className="section-label">
            <span>04 / NEWS</span>
            <span>お知らせ</span>
          </div>
          <p>新商品や営業・発送に関するお知らせをこちらからお届けします。</p>
        </div>
      </section>
    </>
  );
}
