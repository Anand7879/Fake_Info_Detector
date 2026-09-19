/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvg: false,
        html2canvas: false,
        dompurify: false,
        fs: false
      };
    }
    return config;
  }
};

module.exports = nextConfig;
