import { AnimatedSkeleton, type AnimatedSkeletonProps } from '@/components/ui/animated-skeleton';

function Skeleton(props: AnimatedSkeletonProps) {
  return <AnimatedSkeleton {...props} />;
}

export { Skeleton };
