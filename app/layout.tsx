import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Panel CMS - SDS Taman Harapan',
  description: 'Sistem manajemen konten untuk SDS Taman Harapan',
  icons: {
    icon: "/logo_tamhar.png",
    shortcut: "/logo_tamhar.png",
    apple: "/logo_tamhar.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
