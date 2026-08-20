# Build low-RAM for 6GB machine: free working set first, then zero-downtime build.
# Goal: avoid the RAM peak during build (overlapping with the IDE) that hard-pages
# Windows and OOM-kills the IDE. ASCII-only to stay safe under Windows PowerShell 5.1.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-low-ram.ps1
$ErrorActionPreference = 'Stop'
$appDir = 'c:\Troly\HTKT\app'
Set-Location $appDir

function Show-Free($tag) {
  $os = Get-CimInstance Win32_OperatingSystem
  Write-Host ("  [{0}] RAM free: {1} GB" -f $tag, [math]::Round($os.FreePhysicalMemory/1MB,2))
}

Write-Host '=== [1/3] Free working set (push RAM to pagefile) ===' -ForegroundColor Cyan
Show-Free 'before'
Add-Type -Namespace Win32 -Name Psapi -MemberDefinition '[DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr hProcess);' -ErrorAction SilentlyContinue
$targets = 'Antigravity IDE','language_server_windows_x64','MsMpEng','claude','chrome','msedge'
$n = 0
foreach ($p in Get-Process -ErrorAction SilentlyContinue) {
  if ($targets -contains $p.Name) { try { [void][Win32.Psapi]::EmptyWorkingSet($p.Handle); $n++ } catch {} }
}
Start-Sleep -Seconds 2
Write-Host ("  Trimmed {0} processes" -f $n) -ForegroundColor Green
Show-Free 'after'

Write-Host '=== [2/3] Cap Node heap (fits build, pagefile absorbs overflow) ===' -ForegroundColor Cyan
# 4096: du cho next build (webpack) sau khi da trim RAM; pagefile 6GB do phan vuot.
# 3072 tung gay OOM (heap ceiling) khi du lieu lon them -> nang len 4096.
$env:NODE_OPTIONS = '--max-old-space-size=4096'
Write-Host ("  NODE_OPTIONS={0}" -f $env:NODE_OPTIONS) -ForegroundColor Green

Write-Host '=== [3/3] Zero-downtime build (.next-staging then swap) ===' -ForegroundColor Cyan
& powershell -ExecutionPolicy Bypass -File "$appDir\scripts\build-zero-downtime.ps1"
$code = $LASTEXITCODE
Remove-Item Env:\NODE_OPTIONS -ErrorAction SilentlyContinue
if ($code -ne 0) {
  Write-Host ("BUILD FAILED (exit {0}) - old .next still serving, NO downtime." -f $code) -ForegroundColor Red
  exit $code
}
Write-Host 'DONE. Site not interrupted.' -ForegroundColor Green
