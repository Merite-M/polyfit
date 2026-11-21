/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: { unoptimized: true }
};

module.exports = nextConfig;
