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
};

module.exports = nextConfig; 
// DİKKAT: .js dosyalarında 'export default' yerine 'module.exports' kullanılır.