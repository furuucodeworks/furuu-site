"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Menu, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { codeWorksUrl } from "@/lib/code-works";
import { furuuTopLabel, furuuTopUrl } from "@/lib/furuu-top";

const photos = {
  hero: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=85",
  beans:
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85",
  cup: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85",
  work: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85",
};
const nav = [
  ["ABOUT", "about"],
  ["COFFEE", "coffee"],
  ["BLOG", "blog"],
  ["CONTACT", "contact"],
] as const;
const codeWorksHref = codeWorksUrl.trim();
const furuuTopHref = furuuTopUrl.trim();

function DestinationEntry({
  href,
  className,
  children,
  onOpen,
  onNavigate,
}: {
  href: string;
  className: string;
  children: ReactNode;
  onOpen: (trigger: HTMLElement) => void;
  onNavigate?: () => void;
}) {
  if (href) {
    return (
      <a className={className} href={href} onClick={onNavigate}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={(event) => {
        onNavigate?.();
        onOpen(event.currentTarget);
      }}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<"preview" | "works" | "top" | null>(
    null,
  );
  const noticeTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openPreview = (trigger: HTMLElement) => {
    returnFocus.current = trigger;
    setNotice("preview");
  };

  const openWorks = (trigger: HTMLElement) => {
    setMenu(false);
    returnFocus.current = trigger;
    setNotice("works");
  };

  const openTop = (trigger: HTMLElement) => {
    returnFocus.current = trigger;
    setNotice("top");
  };

  const closeNotice = () => setNotice(null);

  useEffect(() => {
    if (!notice) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = returnFocus.current;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-notice-close]")?.focus();

    const closeFromDialog = () => setNotice(null);
    const onCancel = (event: Event) => {
      event.preventDefault();
      closeFromDialog();
    };
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) closeFromDialog();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeFromDialog();
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
      else document.querySelector<HTMLElement>(".mobile-menu")?.focus();
    };
  }, [notice]);

  return (
    <>
      <header className="header">
        <a href="/" className="brand-logo" aria-label="FURUU COFFEE トップへ">
          <span className="brand-logo-mark" aria-hidden="true" />
        </a>
        <nav aria-label="メインナビゲーション">
          {nav.map(([label, id]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
          <DestinationEntry
            href={codeWorksHref}
            className="works-link"
            onOpen={openWorks}
          >
            WEB DESIGN
          </DestinationEntry>
        </nav>
        <Button
          className="store-link"
          variant="ghost"
          onClick={(event) => openPreview(event.currentTarget)}
        >
          ONLINE STORE <ArrowUpRight size={15} />
        </Button>
        <Button
          className="mobile-menu"
          variant="ghost"
          aria-label={menu ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menu}
          aria-controls="mobile-navigation"
          onClick={() => setMenu((open) => !open)}
        >
          {menu ? <X /> : <Menu />}
        </Button>
      </header>
      {menu && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="モバイルナビゲーション"
        >
          {nav.map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
          <DestinationEntry
            href={codeWorksHref}
            className="works-link"
            onNavigate={() => setMenu(false)}
            onOpen={openWorks}
          >
            WEB DESIGN
          </DestinationEntry>
        </nav>
      )}
      <main>
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
              <a className="text-link" href="#blog">
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
                <Button
                  variant="outline"
                  className="round-arrow"
                  aria-label="コーヒー豆の案内"
                  onClick={(event) => openPreview(event.currentTarget)}
                >
                  <ArrowUpRight />
                </Button>
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
                <Button
                  variant="outline"
                  className="round-arrow"
                  aria-label="ドリップバッグの案内"
                  onClick={(event) => openPreview(event.currentTarget)}
                >
                  <ArrowUpRight />
                </Button>
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
            コーヒー <span>商品づくり</span> Web・EC{" "}
            <span>マーケティング・発信</span> 実験と改善{" "}
            <span>FURUU COFFEEの日々</span>
          </div>
        </section>
        <section className="news section">
          <div className="news-body">
            <div className="section-label">
              <span>04 / NEWS</span>
              <span>お知らせ</span>
            </div>
            <p>
              新商品や出店、営業・発送に関するお知らせを、こちらからお届けします。
            </p>
          </div>
        </section>
        <footer id="contact">
          <div className="footer-links">
            <p>何も考えなくていい、コーヒー。</p>
            <DestinationEntry
              href={furuuTopHref}
              className="footer-top footer-entry works-link"
              onOpen={openTop}
            >
              {furuuTopLabel}
            </DestinationEntry>
            <DestinationEntry
              href={codeWorksHref}
              className="footer-works footer-entry works-link"
              onOpen={openWorks}
            >
              WEB DESIGN <span className="works-sep">/</span>{" "}
              <br className="footer-works-break" />
              <span className="works-name">FURUU CODE WORKS</span>
            </DestinationEntry>
          </div>
          <div className="footer-right">
            <p>商品・卸販売・出店などのご相談</p>
            <Button
              variant="ghost"
              className="contact-button"
              onClick={(event) => openPreview(event.currentTarget)}
            >
              CONTACT <ArrowUpRight />
            </Button>
            <small>© FURUU COFFEE</small>
          </div>
        </footer>
      </main>
      {notice && (
        <dialog
          className="notice"
          aria-labelledby={noticeTitleId}
          ref={dialogRef}
        >
          {notice === "works" ? (
            <>
              <p className="eyebrow">FURUU CODE WORKS</p>
              <h2 id={noticeTitleId}>紹介ページは準備中です。</h2>
              <p>FURUU CODE WORKSの紹介ページは準備中です。</p>
            </>
          ) : notice === "top" ? (
            <>
              <p className="eyebrow">FURUU</p>
              <h2 id={noticeTitleId}>共通TOPは準備中です。</h2>
              <p>FURUUの共通TOPは準備中です。</p>
            </>
          ) : (
            <>
              <p className="eyebrow">DESIGN PREVIEW</p>
              <h2 id={noticeTitleId}>ここから、つながる。</h2>
              <p>
                このページはデザインの試作です。
                <br />
                購入先・お問い合わせ先は、本制作時に設定します。
              </p>
            </>
          )}
          <Button data-notice-close onClick={closeNotice}>
            {notice === "preview" ? "デザインに戻る" : "閉じる"} <X size={16} />
          </Button>
        </dialog>
      )}
    </>
  );
}
