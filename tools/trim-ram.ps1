# trim-ram.ps1 - Thu hoi RAM (working set) tren VPS 6GB chong OOM
# Chi trim khi RAM trong < nguong. Giu nguyen app/pm2/postgres (chi page-out, an toan).
# Chay qua Task Scheduler moi 30 phut (SYSTEM).

$ErrorActionPreference = 'SilentlyContinue'

$sig = @'
using System;
using System.Runtime.InteropServices;
public class MemTrim {
  [DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr hProc);
}
'@
if (-not ("MemTrim" -as [type])) { Add-Type -TypeDefinition $sig }

$os = Get-CimInstance Win32_OperatingSystem
$freeMB = [math]::Round($os.FreePhysicalMemory/1KB, 0)   # FreePhysicalMemory tinh bang KB
$thresholdMB = 2048   # Chi trim khi RAM trong < 2 GB

$logDir = 'C:\Troly\HTKT\tools'
$log = Join-Path $logDir 'trim-ram.log'
$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

if ($freeMB -ge $thresholdMB) {
  "$ts | RAM trong ${freeMB}MB >= ${thresholdMB}MB -> bo qua" | Out-File -FilePath $log -Append -Encoding utf8
  return
}

$trimmed = 0
Get-Process | Where-Object { $_.Id -gt 4 } | ForEach-Object {
  try { [MemTrim]::EmptyWorkingSet($_.Handle) | Out-Null; $trimmed++ } catch {}
}
Start-Sleep -Seconds 2
$freeAfter = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1KB, 0)
"$ts | Trim $trimmed tien trinh | RAM trong ${freeMB}MB -> ${freeAfter}MB" | Out-File -FilePath $log -Append -Encoding utf8
