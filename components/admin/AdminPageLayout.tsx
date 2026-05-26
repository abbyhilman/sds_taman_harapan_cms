'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, fadeInDown, fadeInUp, staggerItem } from '@/components/ui/animated';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
  loadingText?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageLayout({
  title,
  description,
  icon: Icon,
  loading,
  loadingText,
  actions,
  children,
}: AdminPageLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
        <PageLoading text={loadingText} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          variants={fadeInDown}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              {Icon && <Icon className="h-7 w-7 text-cyan-600" />}
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </motion.div>

        {/* Content */}
        <motion.div variants={fadeInUp}>{children}</motion.div>
      </motion.div>
    </div>
  );
}

interface AdminCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function AdminCardGrid({ children, columns = 3 }: AdminCardGridProps) {
  const colClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <motion.div
      className={`grid gap-4 ${colClass[columns]}`}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

interface AdminCardItemProps {
  children: ReactNode;
  className?: string;
}

export function AdminCardItem({ children, className = '' }: AdminCardItemProps) {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
