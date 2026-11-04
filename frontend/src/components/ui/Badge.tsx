import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-xs',
        luxury:
          'border-[#C5A059]/35 bg-obsidian-900 text-[#C5A059] shadow-xs',
        gold:
          'border-transparent bg-gold-500 text-obsidian-950 font-bold shadow-xs',
        secondary:
          'border-border bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-xs',
        outline: 'text-foreground border-border bg-card/60',
        success:
          'border-transparent bg-emerald-700 text-white shadow-xs',
        warning:
          'border-transparent bg-amber-600 text-white shadow-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
