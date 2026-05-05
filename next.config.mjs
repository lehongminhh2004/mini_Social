/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bỏ qua lỗi TypeScript khi build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Bỏ qua lỗi ESLint (cảnh báo biến chưa dùng, thẻ img...) khi build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;