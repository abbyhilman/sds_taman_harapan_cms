import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import QueryProvider from '@/components/QueryProvider';
import { PostHogProvider } from '@/components/PostHogProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Panel CMS - SDS Taman Harapan',
  description: 'Sistem manajemen konten untuk SDS Taman Harapan',
  icons: {
    icon: "/logo_tamhar.png",
    shortcut: "/logo_tamhar.png",
    apple: "/logo_tamhar.png",
  },
  other: {
    'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://us.i.posthog.com https://*.posthog.com;",
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
        <PostHogProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </PostHogProvider>
        <Toaster />
      </body>
    </html>
  );
}


