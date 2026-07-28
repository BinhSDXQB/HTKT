#!/usr/bin/env node

/**
 * HIGH AVAILABILITY WATCHDOG
 * Kiểm tra & tự khắc phục kết nối website
 *
 * Features:
 * - Health check every 30 seconds
 * - Auto-restart PM2 if down
 * - Telegram alerts
 * - Detailed logging
 * - Graceful degradation
 */

import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

const CONFIG = {
  healthCheckInterval: 30 * 1000, // 30 seconds
  healthCheckUrl: 'http://localhost:3001/api/health',
  websiteUrl: 'https://qlhtkt.htkt.com.vn/',
  timeout: 10 * 1000, // 10 seconds
  maxRetries: 3,
  retryDelay: 5 * 1000, // 5 seconds
  logFile: 'c:\\logs\\ha-watchdog.log',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_ALERT_CHAT_ID,
}

let state = {
  isHealthy: false,
  consecutiveFailures: 0,
  lastCheckTime: null,
  lastAlertTime: null,
  alertDelay: 5 * 60 * 1000, // Alert max 1 per 5 min
}

/**
 * Logging
 */
function log(level, message) {
  const timestamp = new Date().toISOString()
  const logLine = `[${timestamp}] [${level}] ${message}\n`
  console.log(logLine)

  try {
    fs.appendFileSync(CONFIG.logFile, logLine)
  } catch (err) {
    console.error(`Failed to write log: ${err.message}`)
  }
}

/**
 * Health check
 */
async function healthCheck() {
  try {
    const response = await axios.get(CONFIG.healthCheckUrl, {
      timeout: CONFIG.timeout,
      validateStatus: (status) => status === 200,
    })
    return { success: true, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Website connectivity check
 */
async function websiteCheck() {
  try {
    const response = await axios.get(CONFIG.websiteUrl, {
      timeout: CONFIG.timeout,
      validateStatus: (status) => status === 200,
    })
    return { success: true, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Send Telegram alert
 */
async function sendTelegramAlert(message) {
  if (!CONFIG.telegramToken || !CONFIG.telegramChatId) {
    log('WARN', 'Telegram not configured')
    return
  }

  try {
    const url = `https://api.telegram.org/bot${CONFIG.telegramToken}/sendMessage`
    await axios.post(url, {
      chat_id: CONFIG.telegramChatId,
      text: `🚨 QL-HTKT Alert\n\n${message}`,
      parse_mode: 'HTML',
    })
    log('INFO', 'Telegram alert sent')
  } catch (error) {
    log('ERROR', `Telegram alert failed: ${error.message}`)
  }
}

/**
 * Auto-recovery: Restart PM2
 */
async function autoRecover(reason) {
  log('WARN', `Auto-recovering: ${reason}`)

  try {
    await execAsync('pm2 reload ql-htkt --wait-ready')
    log('INFO', 'PM2 reload initiated')

    // Wait 10 seconds for app to be ready
    await new Promise(resolve => setTimeout(resolve, 10 * 1000))

    // Verify health
    const health = await healthCheck()
    if (health.success) {
      log('INFO', 'Auto-recovery successful ✓')
      state.isHealthy = true
      state.consecutiveFailures = 0
      return true
    } else {
      log('ERROR', 'Auto-recovery failed: Health check still failing')
      return false
    }
  } catch (error) {
    log('ERROR', `Auto-recovery error: ${error.message}`)
    return false
  }
}

/**
 * Main watchdog loop
 */
async function watchdog() {
  log('INFO', '🛡️  HA Watchdog started')

  setInterval(async () => {
    state.lastCheckTime = new Date()

    try {
      const health = await healthCheck()
      const website = await websiteCheck()

      if (health.success && website.success) {
        // All healthy
        if (!state.isHealthy) {
          log('INFO', '✅ System recovered')
          state.isHealthy = true
          state.consecutiveFailures = 0
        }
      } else {
        // Problem detected
        state.consecutiveFailures++
        log('ERROR', `Health check failed (${state.consecutiveFailures}/${CONFIG.maxRetries})`)

        if (!state.isHealthy) {
          log('WARN', `Backend offline: ${health.error || 'Unknown'}\nWebsite: ${website.error || 'OK'}`)
        }

        // Send alert if first failure or alert delay passed
        if (state.consecutiveFailures === 1 ||
            (state.lastAlertTime && Date.now() - state.lastAlertTime > CONFIG.alertDelay)) {
          await sendTelegramAlert(
            `❌ QL-HTKT System Down\n\nBackend: ${health.success ? 'OK' : health.error}\nWebsite: ${website.success ? 'OK' : website.error}\nFailures: ${state.consecutiveFailures}`
          )
          state.lastAlertTime = Date.now()
        }

        // Auto-recover if failures exceed threshold
        if (state.consecutiveFailures >= CONFIG.maxRetries) {
          const recovered = await autoRecover(`${state.consecutiveFailures} consecutive failures`)
          if (recovered) {
            state.consecutiveFailures = 0
          }
        }

        state.isHealthy = false
      }
    } catch (error) {
      log('ERROR', `Watchdog error: ${error.message}`)
    }
  }, CONFIG.healthCheckInterval)
}

// Start watchdog
watchdog().catch(err => {
  log('FATAL', `Watchdog startup failed: ${err.message}`)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  log('INFO', 'Watchdog shutting down')
  process.exit(0)
})
