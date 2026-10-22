// 回転するSVGそのものが読み込み中を表す。output に替えるとSVGの部品型と回転が壊れる。
/* oxlint-disable jsx_a11y/prefer-tag-over-role */
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
