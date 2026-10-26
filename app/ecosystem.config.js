// Thư mục build đang chạy do scripts/trien-khai-vps.ps1 ghi vào .dist-hien-tai (.next-a | .next-b); không có file → .next
const fs = require('fs')
const path = require('path')
let distDir = '.next'
try { distDir = fs.readFileSync(path.join(__dirname, '.dist-hien-tai'), 'utf8').trim() || '.next' } catch {}

module.exports = {
  apps: [
    {
      name: 'ql-htkt',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: 'c:\\Troly\\HTKT\\app',
      interpreter: 'node',
      // 2 instance cluster: pm2 reload luân phiên => không gián đoạn (zero-downtime)
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      // Cap heap từng instance để không nuốt hết RAM (máy 6GB)
      node_args: '--max-old-space-size=448',
      // Khi chạm ngưỡng pm2 chỉ tái khởi 1 instance, instance còn lại vẫn phục vụ
      max_memory_restart: '520M',
      // Drain kết nối khi reload/restart cho mượt
      kill_timeout: 8000,
      listen_timeout: 10000,
      // Chống lặp restart dồn dập nếu lỗi khởi động
      min_uptime: '20s',
      max_restarts: 10,
      restart_delay: 3000,
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NEXT_DIST_DIR: distDir,
      },
    },
  ],
}
