import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-obsidian-800',
        luxury:
          'bg-obsidian-900 text-white hover:bg-obsidian-800 border border-[#C5A059]/35 shadow-sm hover:border-[#C5A059]/60',
        gold:
          'bg-gold-500 text-obsidian-950 hover:bg-gold-600 shadow-sm font-bold',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-border bg-card text-foreground shadow-xs hover:bg-secondary hover:border-ivory-300',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-ivory-200',
        ghost: 'hover:bg-secondary hover:text-foreground text-foreground',
        link: 'text-primary underline-offset-4 hover:underline font-semibold',
      },
      size: {
        default: 'h-11 px-5 py-2.5 min-h-[44px]',
        sm: 'h-9 rounded-md px-3.5 text-xs min-h-[36px]',
        lg: 'h-12 rounded-lg px-8 text-base min-h-[48px]',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin text-current shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
