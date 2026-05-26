'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: { logo: 32, container: 'h-8 w-8' },
    md: { logo: 48, container: 'h-12 w-12' },
    lg: { logo: 64, container: 'h-16 w-16' },
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className={`relative ${sizes[size].container}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-2 border-cyan-200 border-t-cyan-600" />
        <div className="absolute inset-1 flex items-center justify-center">
          <Image
            src="/logo_tamhar.png"
            alt="Loading"
            width={sizes[size].logo - 16}
            height={sizes[size].logo - 16}
            className="object-contain"
          />
        </div>
      </motion.div>
      {text && (
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function PageLoading({ text = 'Memuat data...' }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="flex h-32 items-center justify-center">
      <LoadingSpinner size="sm" />
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          className="h-14 rounded-lg bg-slate-100"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}
