'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props} asChild forceMount>
            <motion.li
              layout
              initial={{ opacity: 0, x: 48, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
              className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border bg-background p-5 pr-8 shadow-xl shadow-slate-200/70 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none destructive:border-destructive destructive:bg-destructive destructive:text-destructive-foreground"
            >
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose />
            </motion.li>
          </Toast>
        ))}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}
