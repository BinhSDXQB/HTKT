# High Availability + Codex System

## Tổng quan

Hệ thống QL-HTKT giờ có **High Availability** tự động + **Codex Preview** cho tất cả content.

### Thành phần chính

#### 1. **QL-HTKT Main App** (2 instances, cluster mode)
- Port: `3001` (production)
- Auto-restart on crash
- Max memory: 500MB/instance
- Logs: `c:\logs\ql-htkt-*.log`

#### 2. **HA Watchdog** (Auto-recovery agent)
- Health check: Every 30 seconds
- Giám sát: Backend (localhost:3001) + Website (HTTPS)
- Auto-recovery: PM2 reload nếu ≥3 lần lỗi
- Alerts: Telegram notifications
- Logs: `c:\logs\ha-watchdog-*.log`

#### 3. **Codex Preview System** (Dynamic content metadata)
- Auto-detect content type (DVHC, ToChuc, User, etc.)
- Cache: 1 hour
- API: `GET /api/preview?id=...&type=...`

---

## Cách chạy

### Start tất cả dịch vụ
```bash
pm2 start ecosystem.config.js
```

### View logs
```bash
# QL-HTKT
pm2 logs ql-htkt

# HA Watchdog
pm2 logs ha-watchdog

# All logs
pm2 logs
```

### Stop/Restart
```bash
pm2 restart ql-htkt        # Graceful reload
pm2 stop ql-htkt           # Stop
pm2 delete ql-htkt         # Remove
pm2 kill                   # Stop all PM2
```

---

## API Endpoints

### Health Check
```bash
GET /api/health
Response: { status: "ok" }
```

### Dynamic Preview
```bash
GET /api/preview?id=UUID&type=dvhc
Response: {
  id: "...",
  type: "dvhc",
  title: "Xã Hương Sơn",
  description: "Xã • Dân số: 5,000 • Diện tích: 45.5 km²",
  metadata: { ... },
  tags: ["ĐVHC", "Xã", "Hương"],
  url: "/dashboard/...",
  cachedAt: "2026-07-28T10:30:00Z",
  expiresAt: "2026-07-28T11:30:00Z"
}
```

### Check Data (diagnostic)
```bash
GET /api/check-data
Response: {
  dvhc: { tong: 78, coDienTich: 78, coDanSo: 78, ... },
  ttbt: { id: "...", ten: "Trung tâm Bảo trì", ma: "TC_BAN_BAO_TRI_GT", ... }
}
```

---

## Monitoring

### PM2 Monitoring
```bash
pm2 monit          # Real-time dashboard
pm2 status         # Current status
pm2 logs --lines 100 --format json  # JSON logs
```

### Telegram Alerts
- Configured: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALERT_CHAT_ID`
- Events:
  - Backend down (3 consecutive failures)
  - Auto-recovery initiated
  - Auto-recovery success/fail

---

## Troubleshooting

### App won't start
1. Check logs: `pm2 logs ql-htkt --lines 50`
2. Build state: `ls -la .next/`
3. Rebuild: `npm run build`
4. Restart: `pm2 delete all && pm2 start ecosystem.config.js`

### Website shows 502
1. Check backend: `curl http://localhost:3001/api/health`
2. Check PM2: `pm2 status`
3. View watchdog: `pm2 logs ha-watchdog`
4. Manual recovery: `pm2 reload ql-htkt`

### High memory usage
- Set `max_memory_restart` in ecosystem.config.js
- Monitor: `pm2 monit`
- Kill PM2: `pm2 kill && pm2 start ecosystem.config.js`

---

## Configuration

### ecosystem.config.js
```javascript
{
  name: 'ql-htkt',
  cwd: 'c:\\Troly\\HTKT\\app',
  script: 'scripts/start-app.cmd',  // Wrapper script (safe)
  env: { NODE_ENV: 'production', PORT: 3001 },
  instances: 2,
  exec_mode: 'cluster',
  max_memory_restart: '500M',
}
```

### .env
```
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALERT_CHAT_ID=...
```

---

## Files

- `ecosystem.config.js` — PM2 configuration
- `scripts/start-app.cmd` — Wrapper script (safely runs next start)
- `scripts/ha-watchdog.mjs` — Auto-recovery watchdog
- `lib/codex-preview.ts` — Preview generator
- `app/api/preview/route.ts` — Preview API
- `c:\logs\` — Log directory

---

## Future Enhancements

- [ ] Metrics export (Prometheus)
- [ ] Database connection pooling
- [ ] Request caching layer (Redis)
- [ ] Load testing
- [ ] Disaster recovery plan
- [ ] Canary deployments

---

**Last updated:** 2026-07-28
