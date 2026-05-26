'use client';

import { motion, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Shared easing curve
const easeOut = [0.25, 0.46, 0.45, 0.94] as const;

// Animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: easeOut } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
};

// Reusable animated components
interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedPage({ children, className }: AnimatedProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedHeader({ children, className }: AnimatedProps) {
  return (
    <motion.div className={className} variants={fadeInDown}>
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      transition={{ delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      className={className}
      variants={fadeIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedList({ children, className }: AnimatedProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({ children, className }: AnimatedProps) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

// Table row animation
export function AnimatedTableRow({ children, className, index = 0 }: AnimatedProps & { index?: number }) {
  return (
    <motion.tr
      className={className}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: easeOut }}
    >
      {children}
    </motion.tr>
  );
}
