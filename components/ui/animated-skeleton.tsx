'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MotionDiv = motion.div as React.ComponentType<any>;

type AnimatedSkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function AnimatedSkeleton({ className, ...props }: AnimatedSkeletonProps) {
  return (
    <MotionDiv
      className={cn('relative overflow-hidden rounded-md bg-slate-200/70', className)}
      initial={{ opacity: 0.45 }}
      animate={{ opacity: [0.45, 0.9, 0.45] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      {...props}
    >
      <MotionDiv
        className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent"
        animate={{ x: ['0%', '300%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </MotionDiv>
  );
}

export { AnimatedSkeleton, type AnimatedSkeletonProps };
