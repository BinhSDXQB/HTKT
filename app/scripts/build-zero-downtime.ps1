# Build zero-downtime cho QLHTKT
# Build vao thu muc .next-staging, xong swap sang .next, reload PM2
# PM2 van serve tu .next cu trong luc build => KHONG mat ket noi

$ErrorActionPreference = "Stop"
$appDir = "c:\Troly\HTKT\app"
$staging = "$appDir\.next-staging"
$live    = "$appDir\.next"
$backup  = "$appDir\.next-old"

Set-Location $appDir

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  BUILD ZERO-DOWNTIME - QLHTKT" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Xoa staging cu neu con sot
if (Test-Path $staging) {
    Write-Host "[1/5] Xoa .next-staging cu..." -ForegroundColor Yellow
    Remove-Item $staging -Recurse -Force -Confirm:$false
}

# 2. Build vao thu muc staging (PM2 van chay binh thuong tu .next)
Write-Host "[2/5] Dang build vao .next-staging..." -ForegroundColor Green
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$env:NEXT_DIST_DIR = ".next-staging"
try {
    & npx next build --webpack
    if ($LASTEXITCODE -ne 0) { throw "Build that bai voi exit code $LASTEXITCODE" }
} finally {
    $ErrorActionPreference = $oldPreference
    Remove-Item Env:\NEXT_DIST_DIR -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "[3/5] Build thanh cong! Dang swap thu muc..." -ForegroundColor Green

# 3. Swap: .next -> .next-old, .next-staging -> .next
#    Downtime chi mat ~1 giay (rename la atomic tren cung o dia)
if (Test-Path $backup) {
    Remove-Item $backup -Recurse -Force -Confirm:$false
}
if (Test-Path $live) {
    Rename-Item $live ".next-old"
}
Rename-Item $staging ".next"

Write-Host "[4/5] Swap xong. Reload PM2..." -ForegroundColor Green

# 4. Reload PM2 (luan phien 2 instance => zero-downtime)
& pm2 reload ql-htkt --update-env

# 5. Don dep
Write-Host "[5/5] Don dep .next-old..." -ForegroundColor Yellow
if (Test-Path $backup) {
    Remove-Item $backup -Recurse -Force -Confirm:$false
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  HOAN TAT - Trang web KHONG bi gian doan" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
