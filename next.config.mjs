/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bỏ qua lỗi TypeScript khi build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Bỏ qua lỗi ESLint khi build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 🔥 CẤP PHÉP CHO CÁC TÊN MIỀN ẢNH BÊN NGOÀI
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Cho phép tất cả các thư mục con của Cloudinary
      },
    ],
  },
};

export default nextConfig;