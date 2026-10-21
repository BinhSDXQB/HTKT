<#
  DIỄN TẬP KHÔI PHỤC + TẠO DỮ LIỆU STAGING (B0 mục 7 — docs/htkt-brain-review/B0-staging-vps.md).

  CHỈ chạy trên MÁY NỘI BỘ không có đường kết nối tới production, đã cài PostgreSQL CÙNG PHIÊN BẢN production
  (psql >= 10). Rào chặn trong SQL chỉ giảm nhầm lẫn, KHÔNG thay kiểm soát truy cập.

    powershell -ExecutionPolicy Bypass -File scripts\an-danh-hoa.ps1 -BanSaoLuu D:\KhoiPhuc\ql_htkt.dump [-PgBin "C:\Program Files\PostgreSQL\16\bin"]

  Kết quả trong app\an-danh-output\:
    bien-ban-dien-tap-<thời điểm>.txt   biên bản (thời gian khôi phục, số dòng, kết quả hậu điều kiện)
    ql_htkt_staging-<thời điểm>.dump     tệp DUY NHẤT được mang lên VPS — CHỈ có khi mọi kiểm tra đạt
#>
param(
  [Parameter(Mandatory = $true)][string]$BanSaoLuu,
  [string]$PgBin = '',
  [string]$PgUser = 'postgres',
  [switch]$GiuBanKhoiPhuc
)
# Lệnh ngoài (psql…) ghi NOTICE ra stderr: KHÔNG để PowerShell biến stderr thành lỗi dừng — tự kiểm mã thoát.
$ErrorActionPreference = 'Continue'
Set-StrictMode -Version 2

$goc = Split-Path -Parent $PSScriptRoot
$out = Join-Path $goc 'an-danh-output'
New-Item -ItemType Directory -Force $out -ErrorAction Stop | Out-Null
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$bienBan = Join-Path $out "bien-ban-dien-tap-$ts.txt"
$dumpTam = Join-Path $out "ql_htkt_staging-$ts.dump.dang-tao"
$dumpCuoi = Join-Path $out "ql_htkt_staging-$ts.dump"
$tepMk = Join-Path $env:TEMP "an-danh-mk-$ts.sql"
$KP = 'ql_htkt_khoi_phuc'; $AD = 'ql_htkt_an_danh'
$H = @('-h', '127.0.0.1', '-U', $PgUser)

function Ghi([string]$s) { Add-Content -Path $bienBan -Value $s -Encoding UTF8 -ErrorAction Stop; Write-Host $s }
function Pg([string]$exe) {
  $p = if ($PgBin) { Join-Path $PgBin "$exe.exe" } else { $exe }
  # Lệnh không tồn tại → dừng ngay (không để $LASTEXITCODE cũ đánh lừa)
  $null = Get-Command $p -ErrorAction Stop
  return $p
}
# Chạy lệnh ngoài, trả về đầu ra (stdout+stderr); ném lỗi nếu mã thoát khác 0
function Chay([string]$exe, [string[]]$thamSo, [string]$moTa) {
  $lenh = Pg $exe
  $global:LASTEXITCODE = -1
  $ra = & $lenh @thamSo 2>&1 | ForEach-Object { "$_" } | Out-String
  if ($LASTEXITCODE -ne 0) { Ghi $ra; throw "$moTa thất bại (mã $LASTEXITCODE)" }
  return $ra
}
function XoaCsdl([string]$ten) {
  try {
    $null = Chay 'dropdb' ($H + @('--if-exists', $ten)) "Xoá $ten"
    Ghi "Đã xoá CSDL $ten (nếu có)."
  } catch { Write-Host "CẢNH BÁO: KHÔNG xoá được $ten — xoá tay ngay (có thể còn dữ liệu thật). $($_.Exception.Message)" }
}

$thanhCong = $false
$bstr = [IntPtr]::Zero
try {
  if (-not (Test-Path $BanSaoLuu)) { throw "Không thấy bản sao lưu: $BanSaoLuu" }
  $f = Get-Item $BanSaoLuu
  Ghi "=== DIỄN TẬP KHÔI PHỤC — $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss') — máy $env:COMPUTERNAME"
  Ghi "Bản sao lưu: $($f.FullName) ($([math]::Round($f.Length / 1MB, 1)) MB, sửa lúc $($f.LastWriteTime))"
  Ghi ("PostgreSQL: " + (Chay 'psql' @('--version') 'psql --version').Trim())

  # 1. Sinh SQL từ schema hiện tại (dừng nếu quy tắc chưa khớp schema)
  $null = & node --experimental-strip-types (Join-Path $PSScriptRoot 'an-danh-hoa.mjs') 2>&1
  if ($LASTEXITCODE -ne 0) { throw 'Sinh SQL thất bại — quy tắc chưa khớp schema.' }
  $sql = Join-Path $out 'an-danh-hoa.sql'

  # 2. Khôi phục bản thật vào CSDL tạm (diễn tập) — LỖI KHÔI PHỤC LÀ DỪNG
  XoaCsdl $AD; XoaCsdl $KP
  $null = Chay 'createdb' ($H + @($KP)) "Tạo $KP"
  $t0 = Get-Date
  $null = Chay 'pg_restore' ($H + @('-d', $KP, '--no-owner', '--no-privileges', '--exit-on-error', $f.FullName)) 'pg_restore'
  Ghi "pg_restore: ĐẠT trong $([math]::Round(((Get-Date) - $t0).TotalSeconds)) giây (RTO phần CSDL)"
  $dem = Chay 'psql' ($H + @('-X', '-At', '-d', $KP, '-c', "SELECT 'users=' || (SELECT count(*) FROM public.users) || ' can_bo=' || (SELECT count(*) FROM public.can_bo) || ' tai_lieu=' || (SELECT count(*) FROM public.tai_lieu) || ' assets=' || (SELECT count(*) FROM public.assets) || ' cong_viec=' || (SELECT count(*) FROM public.cong_viec)")) 'Đếm dòng'
  Ghi "Số dòng sau khôi phục: $($dem.Trim())   (đối chiếu với production)"

  # 3. Bản sao để tạo dữ liệu staging + bảng đánh dấu môi trường nội bộ
  $null = Chay 'createdb' ($H + @('-T', $KP, $AD)) "Tạo $AD"
  $null = Chay 'psql' ($H + @('-X', '-d', $AD, '-v', 'ON_ERROR_STOP=1', '-c', 'CREATE TABLE public.an_danh_moi_truong_noi_bo (tao_luc timestamptz DEFAULT now());')) 'Tạo bảng đánh dấu'

  # 4. Mật khẩu staging: nhập ẩn → tệp tạm → psql; KHÔNG đưa vào dòng lệnh tiến trình.
  #    Đặt biến bằng chuỗi dollar-quote + \gset: giữ NGUYÊN mọi ký tự (', \, :, …) — \set có quy tắc escape riêng.
  $mk = Read-Host -AsSecureString 'Mật khẩu chung cho mọi tài khoản STAGING (>= 12 ký tự)'
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mk)
  $mkTho = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  $the = '$an_danh_' + ([guid]::NewGuid().ToString('N')) + '$'
  if ($mkTho.Contains($the) -or $mkTho.Contains("`n") -or $mkTho.Contains("`r")) { throw 'Mật khẩu chứa ký tự không hỗ trợ.' }
  $duongDan = $sql.Replace('\', '/').Replace("'", "''")   # đối số meta psql: '' là dấu nháy
  Set-Content -Path $tepMk -Encoding UTF8 -ErrorAction Stop -Value @("SELECT $the$mkTho$the AS mat_khau \gset", "\i '$duongDan'")
  $mkTho = $null
  $lenhPsql = Pg 'psql'
  $global:LASTEXITCODE = -1
  $ketQua = & $lenhPsql @H -X -d $AD -f $tepMk 2>&1 | ForEach-Object { "$_" } | Out-String
  $maPsql = $LASTEXITCODE
  Remove-Item $tepMk -Force -ErrorAction SilentlyContinue
  Ghi $ketQua
  if (-not (($maPsql -eq 0) -and ($ketQua -match 'HAU_DIEU_KIEN_DAT') -and ($ketQua -match '(?m)^COMMIT\s*$'))) {
    throw "Tạo dữ liệu staging KHÔNG ĐẠT (psql mã $maPsql) — không xuất dump."
  }

  # 5. Chỉ tới đây khi MỌI kiểm tra đạt — dump ra tên tạm, đổi tên khi xong
  $null = Chay 'pg_dump' ($H + @('-Fc', '-d', $AD, '-f', $dumpTam)) 'pg_dump'
  Move-Item -Path $dumpTam -Destination $dumpCuoi -Force -ErrorAction Stop
  Ghi "ĐẠT — đã xuất $dumpCuoi ($([math]::Round((Get-Item $dumpCuoi).Length / 1MB, 1)) MB). Đây là tệp DUY NHẤT được mang lên VPS."
  Ghi 'KHÔNG mang thư mục tệp đính kèm, .env hay bản sao lưu gốc lên VPS.'
  $thanhCong = $true
}
catch {
  Ghi "THẤT BẠI: $($_.Exception.Message)"
}
finally {
  if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  if (Test-Path $tepMk) { Remove-Item $tepMk -Force -ErrorAction SilentlyContinue }
  if (Test-Path $dumpTam) { Remove-Item $dumpTam -Force -ErrorAction SilentlyContinue; Ghi 'Đã xoá dump dở dang.' }
  XoaCsdl $AD
  if (-not $GiuBanKhoiPhuc) { XoaCsdl $KP } else { Ghi "GIỮ $KP theo yêu cầu (-GiuBanKhoiPhuc) — chứa dữ liệu THẬT, xoá khi xong." }
}
if ($thanhCong) { exit 0 } else { exit 1 }
