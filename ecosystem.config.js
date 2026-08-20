module.exports = {
  apps: [
    // QL-HTKT Main Application
    {
      name: 'ql-htkt',
      cwd: 'c:\\Troly\\HTKT\\app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      max_memory_restart: '500M',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      ignore_watch: ['node_modules', '.next', 'logs'],
      error_file: 'c:\\logs\\ql-htkt-error.log',
      out_file: 'c:\\logs\\ql-htkt-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    // HA Watchdog - Auto-recovery + Monitoring
    {
      name: 'ha-watchdog',
      cwd: 'c:\\Troly\\HTKT\\app',
      script: 'scripts/ha-watchdog.mjs',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_ALERT_CHAT_ID: process.env.TELEGRAM_ALERT_CHAT_ID,
      },
      max_memory_restart: '256M',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      error_file: 'c:\\logs\\ha-watchdog-error.log',
      out_file: 'c:\\logs\\ha-watchdog-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],

  // Monitoring & error tracking
  monitor_interval: 5000,
  max_restarts: 10,
  min_uptime: '10s',

  // Env variables shared across all apps
  env: {
    NODE_OPTIONS: '--max-old-space-size=512',
  },
}
