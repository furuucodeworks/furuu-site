'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { codeWorksUrl } from '@/lib/code-works';
import { furuuTopLabel, furuuTopUrl } from '@/lib/furuu-top';

const nav = [
  ['ABOUT', 'about'],
  ['COFFEE', 'coffee'],
  ['BLOG', 'blog'],
  ['CONTACT', 'contact'],
] as const;

type SectionId = (typeof nav)[number][1];

const codeWorksHref = codeWorksUrl.trim();
const furuuTopHref = furuuTopUrl.trim();

const SiteNoticeContext = createContext<{
  openPreview: (trigger: HTMLElement) => void;
} | null>(null);

export function useSiteNotice() {
  const context = useContext(SiteNoticeContext);
  if (!context) {
    throw new Error('useSiteNotice must be used within SiteFrame');
  }
  return context;
}

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

type CurrentPage = 'about' | 'coffee';

function sectionHref(id: SectionId, current?: CurrentPage) {
  if (id === 'about') return '/about';
  if (id === 'coffee') return '/coffee';
  if (current) return `/#${id}`;
  return `#${id}`;
}

export function SiteFrame({
  children,
  current,
}: {
  children: ReactNode;
  current?: CurrentPage;
}) {
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<'preview' | 'works' | 'top' | null>(
    null,
  );
  const noticeTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openPreview = useCallback((trigger: HTMLElement) => {
    returnFocus.current = trigger;
    setNotice('preview');
  }, []);

  const openWorks = (trigger: HTMLElement) => {
    setMenu(false);
    returnFocus.current = trigger;
    setNotice('works');
  };

  const openTop = (trigger: HTMLElement) => {
    returnFocus.current = trigger;
    setNotice('top');
  };

  const closeNotice = () => setNotice(null);

  useEffect(() => {
    if (!notice) return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = returnFocus.current;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-notice-close]')?.focus();

    const closeFromDialog = () => setNotice(null);
    const onCancel = (event: Event) => {
      event.preventDefault();
      closeFromDialog();
    };
    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) closeFromDialog();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeFromDialog();
    };

    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
      else document.querySelector<HTMLElement>('.mobile-menu')?.focus();
    };
  }, [notice]);

  return (
    <SiteNoticeContext.Provider value={{ openPreview }}>
      <header className="header">
        <a href="/" className="brand-name" aria-label="FURUU COFFEE トップへ">
          FURUU COFFEE
        </a>
        <nav aria-label="メインナビゲーション">
          {nav.map(([label, id]) => (
            <a
              key={id}
              href={sectionHref(id, current)}
              aria-current={current === id ? 'page' : undefined}
            >
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
          aria-label={menu ? 'メニューを閉じる' : 'メニューを開く'}
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
            <a
              key={id}
              href={sectionHref(id, current)}
              aria-current={current === id ? 'page' : undefined}
              onClick={() => setMenu(false)}
            >
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
        {children}
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
              WEB DESIGN <span className="works-sep">/</span>{' '}
              <br className="footer-works-break" />
              <span className="works-name">FURUU CODE WORKS</span>
            </DestinationEntry>
          </div>
          <div
            className="footer-brand"
            role="img"
            aria-label="FURUU COFFEE ロゴ"
          >
            <span className="brand-logo-mark" aria-hidden="true" />
          </div>
        </footer>
      </main>
      {notice && (
        <dialog
          className="notice"
          aria-labelledby={noticeTitleId}
          ref={dialogRef}
        >
          {notice === 'works' ? (
            <>
              <p className="eyebrow">FURUU CODE WORKS</p>
              <h2 id={noticeTitleId}>紹介ページは準備中です。</h2>
              <p>FURUU CODE WORKSの紹介ページは準備中です。</p>
            </>
          ) : notice === 'top' ? (
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
            {notice === 'preview' ? 'デザインに戻る' : '閉じる'} <X size={16} />
          </Button>
        </dialog>
      )}
    </SiteNoticeContext.Provider>
  );
}
