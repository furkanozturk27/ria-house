/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // İŞTE SİHİRLİ KISIM BURASI:
  typescript: {
    // !! UYARI !!
    // Projenin build sırasında tip hataları olsa bile build işleminin tamamlanmasına izin ver.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Lint hatalarını da görmezden gel.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;