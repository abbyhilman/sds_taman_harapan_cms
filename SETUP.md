# Setup Admin Panel CMS - SDS Taman Harapan

## Langkah-langkah Setup

### 1. Setup Storage Buckets di Supabase

Anda perlu membuat storage bucket untuk menyimpan gambar dan video. Jalankan query SQL berikut di Supabase SQL Editor:

```sql
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies for images bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

### 2. Buat Admin User

Untuk membuat admin user, Anda bisa:

**Opsi A: Melalui Supabase Dashboard**
1. Buka Supabase Dashboard
2. Pergi ke Authentication > Users
3. Klik "Add User"
4. Masukkan email dan password
5. Klik "Create User"

**Opsi B: Melalui SQL**
```sql
-- Contoh membuat user admin
-- GANTI dengan email dan password yang Anda inginkan
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sdstamanharapan.sch.id',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{}'
);
```

### 3. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000` dan otomatis redirect ke halaman login di `/admin/login`.

### 4. Login ke Admin Panel

1. Buka browser dan akses aplikasi
2. Anda akan diarahkan ke halaman login
3. Masukkan email dan password yang sudah dibuat
4. Setelah login berhasil, Anda akan diarahkan ke Dashboard

## Struktur Menu Admin Panel

### Menu: Konten Website
1. **Beranda** - Kelola teks sambutan dan foto hero section
2. **Tentang Kami** - Edit visi, misi, dan deskripsi sekolah
3. **Program Unggulan** - CRUD program akademik dan ekstrakurikuler
4. **Fasilitas** - CRUD fasilitas sekolah
5. **Prestasi** - CRUD prestasi siswa
6. **Berita** - CRUD berita dan artikel

### Menu: Galeri Media
1. **Foto** - Upload dan kelola foto galeri (multi-upload support)
2. **Video** - Upload file video atau embed link YouTube

## Fitur-fitur

✅ Autentikasi dengan Supabase
✅ Protected routes
✅ Dashboard dengan statistik
✅ CRUD lengkap untuk semua konten
✅ Upload gambar dan video
✅ Multi-upload untuk galeri foto
✅ Embed video YouTube
✅ Responsive design
✅ Toast notifications
✅ Form validation

## Database Tables

- `homepage_settings` - Pengaturan halaman beranda
- `about_us` - Informasi tentang sekolah
- `programs` - Program unggulan
- `facilities` - Fasilitas sekolah
- `achievements` - Prestasi
- `news` - Berita
- `gallery_photos` - Galeri foto
- `gallery_videos` - Galeri video

## Storage Buckets

- `images` - Untuk menyimpan semua gambar (hero, thumbnails, gallery, dll)
- Akses public untuk read
- Authenticated users untuk upload/update/delete

## Teknologi yang Digunakan

- **Framework**: Next.js 13 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **HTTP Client**: Axios
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useContext)

## Troubleshooting

### Storage Upload Error
Pastikan bucket 'images' sudah dibuat dan policies sudah diset dengan benar.

### Login Error
Pastikan user sudah dibuat di Supabase Authentication.

### Build Error
Jalankan `npm install` untuk memastikan semua dependencies terinstall.

## Support

Untuk bantuan lebih lanjut, silakan hubungi administrator sistem.
