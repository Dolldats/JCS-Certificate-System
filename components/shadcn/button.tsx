import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  primary: 'inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#073d2e] text-white hover:bg-[#0b513d]',
  secondary: 'inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-amber-400 text-[#18392d] hover:bg-amber-300',
  outline: 'inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-current px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 bg-transparent text-current hover:bg-current/5',
};

const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'> & {
  variant?: keyof typeof buttonVariants;
}>(({ className, variant = 'primary', type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      buttonVariants[variant],
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

export { Button, buttonVariants };
