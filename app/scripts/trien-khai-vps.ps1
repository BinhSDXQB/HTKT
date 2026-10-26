# Triển khai bản gắn thẻ "deploy-*" lên VPS (CHẠY TRÊN VPS, không chạy trên máy phát triển).
#   Thủ công :  powershell -ExecutionPolicy Bypass -File scripts\trien-khai-vps.ps1 -Tag deploy-2026-10-27
#   Tự động  :  ... -TuDong   (Task Scheduler mỗi 10 phút; chỉ triển khai khi có thẻ deploy-* MỚI và KHÔNG có migration)
#   Quay lại :  ... -QuayLai  (đổi về thư mục build trước, không build lại)
# Cách làm: build vào thư mục .next-a / .next-b luân phiên → bản đang chạy không bị đụng; xong mới đổi con trỏ và pm2 reload.
param([string]$Tag, [switch]$TuDong, [switch]$QuayLai, [string]$Kho = 'c:\Troly\HTKT', [int]$GbTrongToiThieu = 4)
$ErrorActionPreference = 'Stop'
function Loi($m) { Write-Host "LOI: $m" -ForegroundColor Red; exit 1 }
function Chay($lenh) { Write-Host "> $lenh" -ForegroundColor DarkGray; & cmd /c $lenh; if ($LASTEXITCODE -ne 0) { Loi "Lệnh thất bại ($LASTEXITCODE): $lenh" } }

Set-Location $Kho
$app = Join-Path $Kho 'app'
$conTro = Join-Path $app '.dist-hien-tai'
$daTrienKhai = Join-Path $app '.tag-da-trien-khai'
$hienTai = if (Test-Path $conTro) { (Get-Content $conTro -Raw).Trim() } else { '.next' }

if ($QuayLai) {
  $truoc = if ($hienTai -eq '.next-a') { '.next-b' } else { '.next-a' }
  if (-not (Test-Path (Join-Path $app $truoc))) { Loi "Không có bản build trước ($truoc)." }
  Set-Content $conTro $truoc -NoNewline
  Set-Location $app; Chay 'pm2 reload ecosystem.config.js --update-env'
  Write-Host "Đã quay lại $truoc (mã nguồn vẫn ở thẻ mới; chạy git checkout thẻ cũ nếu cần đồng bộ)."; exit 0
}

# 1. Chọn thẻ
Chay 'git fetch origin --tags --prune --quiet'
if ($TuDong -or -not $Tag) {
  $ds = (& git tag -l 'deploy-*' --sort=-creatordate) | Where-Object { $_ }
  if (-not $ds) { Write-Host 'Chưa có thẻ deploy-*.'; exit 0 }
  $Tag = @($ds)[0]
  $cu = if (Test-Path $daTrienKhai) { (Get-Content $daTrienKhai -Raw).Trim() } else { '' }
  if ($TuDong -and $Tag -eq $cu) { exit 0 }
}
Write-Host "Thẻ triển khai: $Tag"

# 2. Điều kiện an toàn
if (& git status --porcelain --untracked-files=no) { Loi 'Thư mục làm việc có thay đổi chưa commit trên VPS — dừng.' }
$o = Get-PSDrive -Name ($Kho.Substring(0,1))
if ($o.Free / 1GB -lt $GbTrongToiThieu) { Loi ("Ổ đĩa còn {0:N1} GB < {1} GB." -f ($o.Free/1GB), $GbTrongToiThieu) }
$cu = (& git rev-parse HEAD).Trim()
$moi = (& git rev-list -n 1 $Tag).Trim()
if (-not $moi) { Loi "Không thấy thẻ $Tag." }

# 3. Migration thủ công mới → KHÔNG tự chạy; người vận hành phải chạy tay rồi mới triển khai
$mig = @(& git diff --name-only $cu $moi -- app/prisma/migrations_manual | Where-Object { $_ -notmatch '_rollback' })
if ($mig.Count -gt 0) {
  Write-Host "Có migration mới cần chạy tay TRƯỚC khi triển khai:" -ForegroundColor Yellow; $mig | ForEach-Object { Write-Host "  $_" }
  if ($TuDong) { Write-Host 'Chế độ tự động: bỏ qua, chờ người xử lý.'; exit 0 }
  if ((Read-Host 'Đã chạy xong các migration trên? (go/không)') -ne 'go') { exit 1 }
}

# 4. Lấy mã, cài gói chỉ khi package-lock đổi
$lockCu = (& git rev-parse "$($cu):app/package-lock.json" 2>$null)
Chay "git checkout --detach $Tag"
$lockMoi = (& git rev-parse "HEAD:app/package-lock.json")
Set-Location $app
if ($lockCu -ne $lockMoi -or -not (Test-Path 'node_modules')) { Chay 'npm ci' }
Chay 'npx prisma generate'

# 5. Build vào thư mục luân phiên (bản đang chạy giữ nguyên)
$dich = if ($hienTai -eq '.next-a') { '.next-b' } else { '.next-a' }
if (Test-Path $dich) { Remove-Item $dich -Recurse -Force }
$env:NEXT_DIST_DIR = $dich
$env:NODE_OPTIONS = '--max-old-space-size=2048'
Chay 'npm run build'
Remove-Item (Join-Path $dich 'cache') -Recurse -Force -ErrorAction SilentlyContinue

# 6. Đổi con trỏ và reload (2 instance luân phiên → không gián đoạn)
Set-Content $conTro $dich -NoNewline
Chay 'pm2 reload ecosystem.config.js --update-env'
Start-Sleep -Seconds 15
try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/' -UseBasicParsing -TimeoutSec 20; Write-Host "Kiểm tra sống: HTTP $($r.StatusCode)" }
catch { Write-Host 'Kiểm tra sống THẤT BẠI — quay lại bản trước.' -ForegroundColor Red; Set-Content $conTro $hienTai -NoNewline; Chay 'pm2 reload ecosystem.config.js --update-env'; Loi 'Đã quay lại bản build trước.' }
Set-Content $daTrienKhai $Tag -NoNewline
Write-Host "Hoàn tất: $Tag đang chạy từ $dich. Bản trước ($hienTai) giữ lại để quay lại." -ForegroundColor Green
