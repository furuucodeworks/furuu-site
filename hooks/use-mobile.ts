import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

function subscribeMobile(onStoreChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  const onChange = () => {
    onStoreChange();
  };
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function readIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  // サーバーとハイドレーションの最初は false。以前の初期値 undefined を !! したときと同じ。
  // 幅の変化は matchMedia の change だけで受け、解除時に購読を外す。
  return React.useSyncExternalStore(subscribeMobile, readIsMobile, () => false);
}
