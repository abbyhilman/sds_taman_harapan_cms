'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export function AppLoadingScreen({ label = 'Menyiapkan dashboard...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#f8fbff]/95 backdrop-blur-sm">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <motion.div
          className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-cyan-100"
          animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image src="/logo_tamhar.png" alt="SDS Taman Harapan" fill className="object-contain p-4" priority />
        </motion.div>
        <motion.div className="mb-3 flex gap-1.5">
          {[0, 1, 2].map((item) => (
            <motion.span
              key={item}
              className="h-2 w-2 rounded-full bg-cyan-500"
              animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: item * 0.14 }}
            />
          ))}
        </motion.div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
      </motion.div>
    </div>
  );
}
