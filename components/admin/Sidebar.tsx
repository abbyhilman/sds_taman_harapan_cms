'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FileText,
  Image as ImageIcon,
  Video,
  Users,
  Award,
  Building,
  Newspaper,
  Info,
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
  icon: any;
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
      { title: 'Berita', href: '/admin/content/news' },
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
  const [openMenus, setOpenMenus] = useState<string[]>(['Konten Website', 'Galeri Media']);
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
          <div className="w-12 h-12 relative">
            <Image
              src="/logo_tamhar.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="font-bold text-lg">Admin Panel</h2>
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleMenu(item.title)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
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
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          pathname === subitem.href
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
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

      <div className="p-4 border-t">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start"
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
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-card h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 border-r bg-card z-50 flex flex-col lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
