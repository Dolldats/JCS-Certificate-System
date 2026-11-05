import * as React from 'react';
import { cn } from '../../lib/utils';

const Badge = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', className)}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };
