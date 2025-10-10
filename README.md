# Admin Panel CMS - SDS Taman Harapan

Admin Panel CMS yang lengkap untuk mengelola konten website SDS Taman Harapan dengan fitur CRUD lengkap, upload media, dan manajemen galeri.

## 🚀 Fitur Utama

### Autentikasi
- Login dengan email/password menggunakan Supabase Auth
- Protected routes untuk halaman admin
- Session management

### Dashboard
- Statistik konten (jumlah program, fasilitas, prestasi, berita, foto, video)
- Navigasi mudah dengan sidebar
- Responsive design

### Konten Website
1. **Beranda** - Kelola teks sambutan dan foto hero section (multi-upload)
2. **Tentang Kami** - Edit visi, misi, dan deskripsi sekolah
3. **Program Unggulan** - CRUD program dengan kategori (Akademik, Ekstrakurikuler, Karakter, Study Tour)
4. **Fasilitas** - CRUD fasilitas sekolah dengan foto
5. **Prestasi** - CRUD prestasi siswa dengan tahun dan foto
6. **Berita** - CRUD berita dengan thumbnail, konten lengkap, dan tanggal publikasi

### Galeri Media
1. **Foto** - Upload banyak foto sekaligus, edit caption, kelola galeri
2. **Video** - Upload file video atau embed link YouTube dengan thumbnail

## 📋 Setup Awal

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Storage Bucket di Supabase

Buka Supabase Dashboard Anda, pergi ke **Storage**, dan:

1. Klik "New Bucket"
2. Nama bucket: `images`
3. Centang "Public bucket"
4. Klik "Create bucket"

Kemudian, setup policies dengan menjalankan SQL berikut di **SQL Editor**:

```sql
-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

### 3. Buat Admin User

**Cara 1: Melalui Supabase Dashboard (Recommended)**
1. Buka Supabase Dashboard
2. Pergi ke **Authentication** → **Users**
3. Klik **"Add User"**
4. Masukkan email: `admin@sdstamanharapan.sch.id`
5. Masukkan password Anda
6. Klik **"Create User"**

**Cara 2: Melalui SQL Editor**
```sql
-- Buat admin user
-- GANTI password123 dengan password yang Anda inginkan
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

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 5. Login

1. Buka browser dan akses `http://localhost:3000`
2. Aplikasi otomatis redirect ke `/admin/login`
3. Login dengan kredensial yang sudah dibuat:
   - Email: `admin@sdstamanharapan.sch.id`
   - Password: (password yang Anda buat)

## 🎨 Struktur Menu

### Konten Website
```
├── Beranda
│   ├── Teks Sambutan (Judul & Deskripsi)
│   └── Foto Hero Section (Multi-upload)
├── Tentang Kami
│   ├── Visi
│   ├── Misi
│   └── Deskripsi Sekolah
├── Program Unggulan
│   └── CRUD Program (Nama, Kategori, Deskripsi, Gambar)
├── Fasilitas
│   └── CRUD Fasilitas (Nama, Deskripsi, Foto)
├── Prestasi
│   └── CRUD Prestasi (Judul, Deskripsi, Tahun, Foto)
└── Berita
    └── CRUD Berita (Judul, Konten, Penulis, Tanggal, Thumbnail)
```

### Galeri Media
```
├── Foto
│   ├── Multi-upload
│   ├── Edit Caption
│   └── Manage Order
└── Video
    ├── Upload File Video
    ├── Embed YouTube Link
    └── Custom Thumbnail
```

## 🗄️ Database Schema

### Tables
- `homepage_settings` - Pengaturan halaman beranda
- `about_us` - Informasi tentang sekolah
- `programs` - Program unggulan sekolah
- `facilities` - Fasilitas sekolah
- `achievements` - Prestasi siswa
- `news` - Berita dan artikel
- `gallery_photos` - Galeri foto
- `gallery_videos` - Galeri video

### Storage
- Bucket: `images` (Public)
  - Folder: `hero/` - Hero section images
  - Folder: `programs/` - Program images
  - Folder: `facilities/` - Facility images
  - Folder: `achievements/` - Achievement images
  - Folder: `news/` - News thumbnails
  - Folder: `gallery/` - Gallery photos
  - Folder: `videos/` - Video files
  - Folder: `thumbnails/` - Video thumbnails

## 🛠️ Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **HTTP Client**: Axios
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useContext)

## 📱 Screenshots

### Login Page
Halaman login dengan logo SDS Taman Harapan

### Dashboard
Dashboard dengan statistik konten dan informasi sistem

### Content Management
Halaman CRUD untuk setiap jenis konten dengan interface yang intuitif

### Gallery Management
Upload dan kelola foto/video dengan mudah

## 🔒 Security

- Row Level Security (RLS) enabled untuk semua tabel
- Authenticated users only untuk operasi CRUD
- Public read untuk storage bucket
- Session-based authentication

## 📝 Development

### Build Project

```bash
npm run build
```

### Run Production

```bash
npm run start
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

## 🆘 Troubleshooting

### Error: Storage upload failed
**Solusi**: Pastikan bucket `images` sudah dibuat dan policies sudah diset dengan benar di Supabase Storage.

### Error: Login failed
**Solusi**: Pastikan admin user sudah dibuat di Supabase Authentication.

### Error: Cannot connect to database
**Solusi**: Cek file `.env` dan pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah benar.

### Error: Build failed
**Solusi**:
1. Hapus folder `.next`
2. Jalankan `npm install`
3. Jalankan `npm run build` lagi

## 📞 Support

Untuk bantuan lebih lanjut terkait penggunaan Admin Panel CMS ini, silakan hubungi administrator sistem.

## 📄 License

Copyright © 2025 SDS Taman Harapan. All rights reserved.
