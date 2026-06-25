/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'glorysound.ht' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'glorysound.ht'] },
  },
};

export default nextConfig;
