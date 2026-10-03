/**
 * COFFEE ページ 03 セクションの販売商品。
 *
 * 差し替え:
 * - name / description / taste / image … 商品紹介とカード写真
 * - storeUrls … 形態ごとの STORES 商品ページ URL（空なら準備中案内）
 *
 * 価格・在庫・内容量はここには書きません。正はオンラインストア側です。
 */
export const coffeeFormats = [
  { id: 'wholeBean', label: '豆のまま' },
  { id: 'ground', label: '粉にする' },
  { id: 'dripBag', label: 'ドリップバッグ' },
] as const;

export type CoffeeFormatId = (typeof coffeeFormats)[number]['id'];

export type CoffeeProduct = {
  name: string;
  description: string;
  taste: string;
  image: {
    src: string;
    alt: string;
  };
  storeUrls: Record<CoffeeFormatId, string>;
};

export const coffeeProducts: CoffeeProduct[] = [
  {
    name: 'まいにちブレンド',
    description:
      '朝の一杯にも、仕事の合間にも。くせを強くしすぎず、毎日でも飲みやすいことを想定した仮の紹介です。',
    taste: 'おだやかな苦みと、香ばしさ',
    image: {
      src: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85',
      alt: '焙煎したコーヒー豆',
    },
    storeUrls: {
      wholeBean: '',
      ground: '',
      dripBag: '',
    },
  },
  {
    name: 'ひと息の深煎り',
    description:
      '少ししっかりした苦みがほしい日のための仮の紹介です。午後の休憩や、食後の一杯をイメージしています。',
    taste: '香ばしさの残る、しっかりめの苦み',
    image: {
      src: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=85',
      alt: '袋から取り出したコーヒー豆',
    },
    storeUrls: {
      wholeBean: '',
      ground: '',
      dripBag: '',
    },
  },
];

export function coffeeProductUrlsPending(product: CoffeeProduct) {
  return coffeeFormats.every(({ id }) => !product.storeUrls[id].trim());
}
