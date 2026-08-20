# Chay healthcheck hang ngay va canh bao qua Telegram khi co muc KHONG DAT.
# Dat lich bang Task Scheduler (xem huong dan cuoi tep).
# ASCII-only de an toan tren Windows PowerShell 5.1.

$ErrorActionPreference = 'Stop'
$appDir = 'C:\Troly\HTKT\app'
$logFile = Join-Path $appDir 'healthcheck-logs\chay-dinh-ky.log'

function Write-Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $logFile -Value $line -Encoding utf8
}

Set-Location $appDir
New-Item -ItemType Directory -Path (Split-Path $logFile) -Force | Out-Null

# Thu 2 hang tuan chay kem kiem thu chatbot (goi OpenAI, ton token).
# Cac ngay khac chi chay cac kiem tra khong ton tien.
$kemChatbot = (Get-Date).DayOfWeek -eq 'Monday'
$args = if ($kemChatbot) { '--chatbot' } else { '' }

$out = & node scripts/healthcheck.mjs $args 2>&1 | Out-String
$code = $LASTEXITCODE
Write-Log "exit=$code chatbot=$kemChatbot"
Add-Content -Path $logFile -Value $out -Encoding utf8

if ($code -ne 0) {
  # Rut cac dong KHONG DAT de gui canh bao
  $hong = ($out -split "`n" | Where-Object { $_ -match '^\s*\u274C' }) -join "`n"
  $msg = "CANH BAO HE THONG QLHTKT`n$(Get-Date -Format 'dd/MM/yyyy HH:mm')`n`n$hong"
  Write-Log "CO MUC KHONG DAT - gui canh bao"

  # Gui Telegram neu da cau hinh (doc tu .env, khong luu token trong script)
  try {
    $envText = Get-Content (Join-Path $appDir '.env') -Raw
    $token = ([regex]::Match($envText, '(?m)^TELEGRAM_BOT_TOKEN="?([^"\r\n]+)')).Groups[1].Value
    $chat  = ([regex]::Match($envText, '(?m)^TELEGRAM_CHAT_ID="?([^"\r\n]+)')).Groups[1].Value
    if ($token -and $chat) {
      $body = @{ chat_id = $chat; text = $msg } | ConvertTo-Json -Compress
      Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/sendMessage" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
      Write-Log 'Da gui canh bao Telegram'
    } else {
      Write-Log 'Chua cau hinh TELEGRAM_BOT_TOKEN/CHAT_ID - bo qua gui canh bao'
    }
  } catch {
    Write-Log "Loi gui Telegram: $($_.Exception.Message)"
  }
}

# Don log cu: giu 60 tep json gan nhat
Get-ChildItem (Join-Path $appDir 'healthcheck-logs') -Filter '*.json' |
  Sort-Object LastWriteTime -Descending | Select-Object -Skip 60 |
  ForEach-Object { Remove-Item $_.FullName -Force }

exit $code

<#
DAT LICH CHAY (chay 1 lan, quyen Administrator):

  schtasks /create /tn "QLHTKT_Healthcheck_Daily" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Troly\HTKT\app\scripts\healthcheck-daily.ps1" /sc daily /st 06:30 /ru SYSTEM /rl HIGHEST /f

Chay thu ngay:      schtasks /run /tn "QLHTKT_Healthcheck_Daily"
Xem ket qua:        Get-Content C:\Troly\HTKT\app\healthcheck-logs\chay-dinh-ky.log -Tail 30
Xoa lich:           schtasks /delete /tn "QLHTKT_Healthcheck_Daily" /f
#>
