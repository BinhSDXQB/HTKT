import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // Máy 6GB RAM: hạn chế worker + bật chế độ tiết kiệm bộ nhớ webpack để build không OOM
    cpus: 1,
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'localhost:3001',
        '36.50.27.222',
        '36.50.27.222:81',
        'qlhtkt.htkt.com.vn',
      ],
    },
  },
  async headers() {
    return [
      {
        // GeoJSON bản đồ (~7 MB) đổi rất hiếm — cho trình duyệt cache 1 ngày,
        // sau đó dùng bản cũ trong khi tải ngầm bản mới (SWR 7 ngày)
        source: '/data/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
