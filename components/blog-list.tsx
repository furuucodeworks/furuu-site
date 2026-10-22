/**
 * 公開記事の一覧。画像・カテゴリー・日付・タイトル・紹介文を、新しい順で出す。
 * 絞り込みはカテゴリー1つ。「すべて」で解除する。
 */
import Link from 'next/link'
import type { CategoryItem, CmsListResult, PostCard } from '@/lib/cms/content'
import { cmsProblemMessage } from '@/lib/cms/content'

export function BlogList({
  posts,
  categories,
  activeCategoryId,
  missingCategory,
}: {
  posts: CmsListResult<PostCard>
  categories: CmsListResult<CategoryItem>
  activeCategoryId: string | null
  missingCategory: boolean
}) {
  return (
    <div className="page-blog">
      <section className="section">
        <p className="eyebrow">BLOG</p>
        <h1>考えたこと、試したこと。</h1>
        <p className="cms-lead">公開中の記事を、日付の新しい順に並べています。</p>
        <CategoryFilters
          categories={categories}
          activeCategoryId={missingCategory ? null : activeCategoryId}
        />
        <div className="blog-index" aria-live="polite">
          {missingCategory ? (
            <p>指定したカテゴリーは見つかりません。</p>
          ) : posts.status === 'error' ? (
            <p>{cmsProblemMessage('記事', posts.reason)}</p>
          ) : posts.status === 'empty' ? (
            <p>
              {activeCategoryId
                ? 'このカテゴリーの公開記事はまだありません。'
                : '公開中の記事はまだありません。'}
            </p>
          ) : (
            <>
              {posts.truncated ? <p className="cms-note">新しい順に100件まで表示しています。</p> : null}
              <div className="blog-cards">
                {posts.items.map((post) => (
                  <PostCardView key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function CategoryFilters({
  categories,
  activeCategoryId,
}: {
  categories: CmsListResult<CategoryItem>
  activeCategoryId: string | null
}) {
  if (categories.status === 'error') {
    return <p>{cmsProblemMessage('カテゴリー', categories.reason)}</p>
  }
  if (categories.status === 'empty') {
    return <p>カテゴリーはまだありません。</p>
  }

  return (
    <nav className="category-filters" aria-label="カテゴリーで絞り込む">
      <Link href="/blog" aria-current={activeCategoryId ? undefined : 'page'} prefetch={false}>
        すべて
      </Link>
      {categories.items.map((category) => (
        <Link
          key={category.id}
          href={`/blog?category=${encodeURIComponent(category.id)}`}
          aria-current={activeCategoryId === category.id ? 'page' : undefined}
          prefetch={false}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  )
}

function PostCardView({ post }: { post: PostCard }) {
  return (
    <article className="blog-card">
      {post.imageUrl ? (
        <img src={post.imageUrl} alt="" />
      ) : (
        <div className="cms-photo-fallback" aria-hidden="true" />
      )}
      <div>
        <p className="article-category">
          {post.categoryName ?? 'カテゴリー未設定'} / {post.dateLabel}
        </p>
        <h2>
          {post.href ? (
            <Link href={post.href} prefetch={false}>
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </h2>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        {post.slugNote === 'invalid' ? (
          <p className="cms-note">URLが未設定のため、詳細ページを開けません。</p>
        ) : null}
        {post.slugNote === 'duplicate' ? (
          <p className="cms-note">同じURLの記事が複数あるため、詳細を開いていません。</p>
        ) : null}
        {post.href ? (
          <Link className="text-link" href={post.href} prefetch={false}>
            記事を読む
          </Link>
        ) : null}
      </div>
    </article>
  )
}
