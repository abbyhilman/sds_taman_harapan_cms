'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Image as ImageIcon,
  GraduationCap,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Image from 'next/image';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  submenu?: { title: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/admin/dashboard',
  },
  {
    title: 'Konten Website',
    icon: FileText,
    submenu: [
      { title: 'Beranda', href: '/admin/content/homepage' },
      { title: 'Tentang Kami', href: '/admin/content/about' },
      { title: 'Program Unggulan', href: '/admin/content/programs' },
      { title: 'Program Tambahan', href: '/admin/content/learnsection' },
      { title: 'Fasilitas', href: '/admin/content/facilities' },
      { title: 'Prestasi', href: '/admin/content/achievements' },
      { title: 'Kontak Pesan', href: '/admin/content/contactmessage' },
      { title: 'Kontak Info', href: '/admin/content/contactinfo' },
      { title: 'Berita', href: '/admin/content/news' },
      { title: 'Pendaftaran', href: '/admin/content/ppdb' },
    ],
  },
  {
    title: 'Akademik',
    icon: GraduationCap,
    submenu: [
      { title: 'Daftar Siswa', href: '/admin/students' },
      { title: 'Raport Digital', href: '/admin/report-cards' },
      { title: 'Master Data', href: '/admin/master-data' },
    ],
  },
  {
    title: 'Galeri Media',
    icon: ImageIcon,
    submenu: [
      { title: 'Foto', href: '/admin/gallery/photos' },
      { title: 'Video', href: '/admin/gallery/videos' },
      { title: 'Welcome Foto', href: '/admin/gallery/welcome_photos' },
      { title: 'Tentang Kami Foto', href: '/admin/gallery/tentang_kami_photos' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(['Konten Website', 'Akademik', 'Galeri Media']);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative rounded-lg bg-[#eefbff] p-2 shadow-sm">
            <Image
              src="/logo_tamhar.png"
              alt="Logo"
              fill
              className="object-contain p-1.5"
            />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">SDS Taman Harapan</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  pathname === item.href
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      openMenus.includes(item.title) && 'rotate-180'
                    )}
                  />
                </button>
                {openMenus.includes(item.title) && item.submenu && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-slate-100 pl-3">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-all',
                          pathname === subitem.href
                            ? 'bg-cyan-50 font-semibold text-cyan-700'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                        )}
                      >
                        {subitem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t bg-slate-50/70">
        <div className="mb-3 rounded-lg bg-white px-3 py-2 shadow-sm">
          <p className="text-sm font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start border-slate-200 bg-white hover:bg-slate-100"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 right-4 z-50 bg-white shadow-sm hover:bg-slate-100"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-100 bg-white h-screen sticky top-0 shadow-sm">
        <SidebarContent />
      </aside>

      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 max-w-[82vw] border-r border-slate-100 bg-white z-50 flex flex-col lg:hidden shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
