'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion } from 'framer-motion';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  hoverScale?: number;
  tapScale?: number;
}

const MotionButton = motion.button as React.ComponentType<any>;

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      hoverScale = 1.02,
      tapScale = 0.98,
      ...props
    },
    ref
  ) => {
    const Comp = (asChild ? Slot : MotionButton) as React.ComponentType<any>;
    const motionProps = asChild
      ? {}
      : {
          whileHover: !props.disabled ? { scale: hoverScale } : undefined,
          whileTap: !props.disabled ? { scale: tapScale } : undefined,
          transition: { type: 'spring', stiffness: 420, damping: 28 },
        };

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...motionProps}
        {...props}
      />
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };

