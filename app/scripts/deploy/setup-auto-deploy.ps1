# CAI DAT tu dong trien khai tu GitHub cho VPS (chay MOT lan, quyen Administrator). ASCII-only.
#   - Tao C:\Troly\deploy (ngoai repo): deploy.env (mau - nguoi dung tu dien GITHUB_TOKEN), logs\
#   - Ghi so migration DA AP (toan bo tep hien co) va commit dang chay -> lan dau khong ap lai, khong deploy lai
#   - Dang ky Task Scheduler QLHTKT_AutoDeploy: 5 phut/lan, quyen SYSTEM (giong QLHTKT_Watchdog)
# Go bo: schtasks /delete /tn QLHTKT_AutoDeploy /f
$ErrorActionPreference = 'Stop'
$Root = 'C:\Troly\HTKT'; $App = "$Root\app"; $Cfg = 'C:\Troly\deploy'
New-Item -ItemType Directory -Force "$Cfg\logs" | Out-Null

$envFile = "$Cfg\deploy.env"
if (-not (Test-Path $envFile)) {
  @(
    '# Cau hinh tu dong trien khai QLHTKT tu GitHub. KHONG dua tep nay len git.',
    '# GITHUB_TOKEN: fine-grained personal access token, chi cap cho repo BinhSDXQB/HTKT, quyen:',
    '#   Contents: Read and write (keo code, day nhanh main lan dau); Actions: Read (tai ban build); Metadata: Read',
    'GITHUB_TOKEN=DIEN_TOKEN_VAO_DAY',
    'GITHUB_REPO=BinhSDXQB/HTKT',
    'DEPLOY_BRANCH=main',
    'WORKFLOW_FILE=build-vps.yml',
    '# AUTO_MIGRATE=1: tu ap migration moi (co pg_dump sao luu truoc). Dat 0 de chi canh bao, ap tay.',
    'AUTO_MIGRATE=1'
  ) | Set-Content -Path $envFile -Encoding ASCII
  # Chi Administrators + SYSTEM doc duoc tep chua token
  icacls $envFile /inheritance:r /grant:r 'Administrators:F' 'SYSTEM:F' | Out-Null
  Write-Host "Da tao $envFile - hay dien GITHUB_TOKEN"
} else { Write-Host "$envFile da co - giu nguyen" }

$ledger = "$Cfg\applied_migrations.txt"
if (-not (Test-Path $ledger)) {
  Get-ChildItem "$App\prisma\migrations_manual\*.sql" | Where-Object { $_.Name -notmatch '_(rollback|verify)\.sql$' } |
    Sort-Object Name | ForEach-Object { $_.Name } | Set-Content -Path $ledger -Encoding ASCII
  Write-Host ("Da ghi so migration da ap: {0} tep" -f (Get-Content $ledger).Count)
}

$deployed = "$Cfg\deployed_sha.txt"
if (-not (Test-Path $deployed)) {
  $head = (& 'C:\Program Files\Git\cmd\git.exe' -C $Root rev-parse HEAD).Trim()
  Set-Content -Path $deployed -Value $head -Encoding ASCII
  Write-Host "Ghi commit dang chay: $head"
}

$lockHashFile = "$Cfg\installed_lock_hash.txt"
if (-not (Test-Path $lockHashFile)) {
  # node_modules hien tai da khop package-lock (npm ls sach) -> ghi ma bam de lan dau khong npm install thua
  (Get-FileHash "$App\package-lock.json" -Algorithm SHA256).Hash | Set-Content -Path $lockHashFile -Encoding ASCII
}

$ps = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$App\scripts\deploy\vps-auto-deploy.ps1`""
schtasks /create /tn QLHTKT_AutoDeploy /tr $ps /sc minute /mo 5 /ru SYSTEM /rl HIGHEST /f | Out-Null
Write-Host 'Da dang ky tac vu QLHTKT_AutoDeploy (5 phut/lan, SYSTEM). Nhat ky: C:\Troly\deploy\logs'
