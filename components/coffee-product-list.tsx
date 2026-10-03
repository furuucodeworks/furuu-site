import {
  coffeeFormats,
  coffeeProducts,
  coffeeProductUrlsPending,
} from '@/lib/coffee-products';
import { CoffeeFormatLink } from '@/components/coffee-format-link';

export function CoffeeProductList() {
  return (
    <div className="coffee-product-list">
      {coffeeProducts.map((product) => (
        <article key={product.name} className="coffee-product-card">
          <figure className="coffee-product-card-image">
            <img src={product.image.src} alt={product.image.alt} />
          </figure>
          <div className="coffee-product-card-body">
            {coffeeProductUrlsPending(product) ? (
              <p className="coffee-pending">商品情報は準備中です</p>
            ) : null}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <dl className="coffee-specs">
              <div>
                <dt>味わいの目安</dt>
                <dd>{product.taste}</dd>
              </div>
            </dl>
            <div className="coffee-formats">
              <p className="coffee-formats-label">ご購入の形態</p>
              <ul>
                {coffeeFormats.map(({ id, label }) => (
                  <li key={id}>
                    <CoffeeFormatLink
                      href={product.storeUrls[id]}
                      productName={product.name}
                      formatLabel={label}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
