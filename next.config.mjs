/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baris ini yang akan menyulap Next.js menjadi Static HTML
  output: 'export',
  
  // Menonaktifkan optimalisasi gambar bawaan server karena kita pakai static
  images: {
    unoptimized: true,
  },
};

export default nextConfig;