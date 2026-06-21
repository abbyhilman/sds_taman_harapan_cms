'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-xl shadow-cyan-100"
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
            >
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-cyan-600" />
              Memvalidasi akun...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
        className="w-full max-w-[22rem] sm:max-w-md"
      >
        <Card className="w-full shadow-xl">
          <CardHeader className="flex flex-col items-center space-y-4">
            <motion.div
              className="relative h-24 w-24"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image
                src="/logo_tamhar.png"
                alt="Logo SDS Taman Harapan"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
            <div className="text-center">
              <CardTitle className="text-2xl font-bold">Admin Panel CMS</CardTitle>
              <CardDescription className="mt-2 text-base">SDS Taman Harapan</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {sessionExpired && (
                <motion.div
                  className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <LogOut className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Sesi Login Sudah Habis</p>
                    <p className="text-sm text-amber-700">Sesi login Anda sudah kadaluarsa. Silakan login kembali untuk melanjutkan.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sdstamanharapan.sch.id"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="rounded-md bg-red-50 p-3 text-sm text-red-600"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatedButton type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </AnimatedButton>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
