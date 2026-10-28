# VPS AUTO-DEPLOY tu GitHub (chay boi Task Scheduler QLHTKT_AutoDeploy, 5 phut/lan, quyen SYSTEM).
# ASCII-only: PowerShell 5.1 doc file nhu cp1252, ky tu tieng Viet co dau se lam hong chuoi.
#
# Luong xu ly khi co ban build moi tren nhanh main (GitHub Actions "Build cho VPS" chay thanh cong):
#   1. Hoi GitHub API lan chay thanh cong moi nhat -> neu trung DEPLOY_SHA da trien khai thi thoat.
#   2. Tai artifact "next-build" -> giai nen vao app\.next-staging (CHUA dung toi web).
#   3. git fetch + fast-forward nhanh main toi dung commit da build (dung lai neu VPS co sua doi chua commit).
#   4. Migration moi trong prisma\migrations_manual (bo *_rollback, *_verify): sao luu CSDL bang pg_dump roi ap.
#   5. package-lock.json doi -> npm install (tang dan, khong xoa node_modules).
#   6. Hoan doi .next-staging -> .next (thu lai neu file bi khoa), pm2 reload ql-htkt; kiem tra /api/health + 2 tien trinh
#      deu khoi dong lai sau luc hoan doi; loi thi quay ve ban cu.
#   Migration chay TRUOC khi web doi ban -> migration PHAI tuong thich nguoc (chi them bang/cot), xem tai lieu.
#   7. Bao Telegram (dung token trong app\.env nhu watchdog).
# Cau hinh + trang thai o C:\Troly\deploy (NGOAI repo): deploy.env, deployed_sha.txt, applied_migrations.txt, logs\.
param([switch]$Force, [switch]$DryRun)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }   # doc dung tieu de commit tieng Viet tu git (khong co console thi bo qua)

$Root    = 'C:\Troly\HTKT'
$App     = "$Root\app"
$Cfg     = 'C:\Troly\deploy'
$LogDir  = "$Cfg\logs"
$Git     = 'C:\Program Files\Git\cmd\git.exe'
$Node    = 'C:\Program Files\nodejs\node.exe'
$Npm     = 'C:\Program Files\nodejs\npm.cmd'
$PgDump  = 'C:\Program Files\PostgreSQL\16\bin\pg_dump.exe'
$env:PM2_HOME = 'C:\Users\Administrator\.pm2'
$Pm2     = 'C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd'

New-Item -ItemType Directory -Force $LogDir | Out-Null
$LogFile = Join-Path $LogDir ("deploy-{0}.log" -f (Get-Date -Format 'yyyyMMdd'))
function Write-Log([string]$m) { $line = "{0} {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m; Add-Content -Path $LogFile -Value $line; Write-Host $line }

function Read-KeyValueFile([string]$path) {
  $h = @{}
  if (Test-Path $path) {
    foreach ($l in Get-Content $path) {
      if ($l -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') { $h[$Matches[1]] = $Matches[2].Trim('"').Trim("'") }
    }
  }
  return $h
}

function Send-Telegram([string]$text) {
  $e = Read-KeyValueFile "$App\.env"
  $tok = $e['TELEGRAM_BOT_TOKEN']; $chat = $e['TELEGRAM_ALERT_CHAT_ID']
  if (-not $tok -or -not $chat) { Write-Log 'Telegram chua cau hinh - bo qua'; return }
  try {
    # Gui JSON UTF-8 (tieu de commit co the co dau tieng Viet; body dang form cua PS 5.1 lam hong dau)
    $json = @{ chat_id = $chat; text = "[QLHTKT deploy] $text" } | ConvertTo-Json -Compress
    Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$tok/sendMessage" -Body ([Text.Encoding]::UTF8.GetBytes($json)) -ContentType 'application/json; charset=utf-8' -TimeoutSec 15 | Out-Null
  } catch { Write-Log "Loi gui Telegram: $($_.Exception.Message)" }
}

# ---- Cau hinh ----
$conf   = Read-KeyValueFile "$Cfg\deploy.env"
$Token  = $conf['GITHUB_TOKEN']
$Repo   = if ($conf['GITHUB_REPO']) { $conf['GITHUB_REPO'] } else { 'BinhSDXQB/HTKT' }
$Branch = if ($conf['DEPLOY_BRANCH']) { $conf['DEPLOY_BRANCH'] } else { 'main' }
$Wf     = if ($conf['WORKFLOW_FILE']) { $conf['WORKFLOW_FILE'] } else { 'build-vps.yml' }
$AutoMigrate = ($conf['AUTO_MIGRATE'] -ne '0')
if (-not $Token -or $Token -like '*DIEN_TOKEN*') { Write-Log 'Chua co GITHUB_TOKEN trong C:\Troly\deploy\deploy.env - bo qua'; exit 0 }

$Headers = @{ Authorization = "Bearer $Token"; Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28'; 'User-Agent' = 'qlhtkt-vps-deploy' }
$BasicAuth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$Token"))
# Token KHONG dua vao dong lenh git (argv co the bi doc boi cong cu xem tien trinh) - dua qua bien moi truong.
$env:GIT_CONFIG_COUNT = '2'
$env:GIT_CONFIG_KEY_0 = 'safe.directory';   $env:GIT_CONFIG_VALUE_0 = '*'
$env:GIT_CONFIG_KEY_1 = 'http.extraHeader'; $env:GIT_CONFIG_VALUE_1 = "Authorization: Basic $BasicAuth"
$env:GIT_TERMINAL_PROMPT = '0'
# PowerShell 5.1 + 'Stop': moi dong stderr cua lenh ngoai (vd "From https://..." cua git fetch) thanh loi chet nguoi
# khi co 2>&1. Chay lenh ngoai trong pham vi 'Continue' va chi dua vao $LASTEXITCODE.
function Invoke-Native([scriptblock]$sb) {
  $ErrorActionPreference = 'Continue'
  & $sb 2>&1
}
function Invoke-Git([string[]]$a) {
  $out = Invoke-Native { & $Git -C $Root @a }
  if ($LASTEXITCODE -ne 0) { throw "git $($a -join ' ') that bai: $($out -join ' ')" }
  return $out
}

# ---- Khoa chong chay chong ----
$Lock = "$Cfg\deploy.lock"
if ((Test-Path $Lock) -and ((Get-Date) - (Get-Item $Lock).LastWriteTime).TotalMinutes -lt 60) { Write-Log 'Dang co lan deploy khac - thoat'; exit 0 }
Set-Content $Lock (Get-Date -Format o)

try {
  # 1. Lan build thanh cong moi nhat
  $runs = Invoke-RestMethod -Headers $Headers -Uri "https://api.github.com/repos/$Repo/actions/workflows/$Wf/runs?branch=$Branch&status=success&per_page=1" -TimeoutSec 30
  if (-not $runs.workflow_runs -or $runs.workflow_runs.Count -eq 0) { Write-Log 'Chua co lan build thanh cong nao'; exit 0 }
  $run = $runs.workflow_runs[0]
  $sha = $run.head_sha
  $daTrienKhai = if (Test-Path "$Cfg\deployed_sha.txt") { (Get-Content "$Cfg\deployed_sha.txt" -Raw).Trim() } else { '' }
  if ($sha -eq $daTrienKhai -and -not $Force) { exit 0 }
  $sha7 = $sha.Substring(0, 7)
  Write-Log "Ban build moi: $sha7 (run $($run.id)) - dang trien khai: $daTrienKhai"

  # Bao loi 1 lan cho moi commit (tranh spam moi 5 phut)
  $AlertFile = "$Cfg\last_alert_sha.txt"
  function Stop-Deploy([string]$msg) {
    Write-Log "DUNG: $msg"
    $last = if (Test-Path $AlertFile) { (Get-Content $AlertFile -Raw).Trim() } else { '' }
    if ($last -ne $sha) { Send-Telegram "DUNG trien khai $sha7 - $msg"; Set-Content $AlertFile $sha }
    exit 1
  }

  # 2. Tai artifact + giai nen vao .next-staging
  $arts = Invoke-RestMethod -Headers $Headers -Uri "https://api.github.com/repos/$Repo/actions/runs/$($run.id)/artifacts" -TimeoutSec 30
  $art = $arts.artifacts | Where-Object { $_.name -eq 'next-build' -and -not $_.expired } | Select-Object -First 1
  if (-not $art) { Stop-Deploy 'khong tim thay artifact next-build (het han hoac build loi)' }
  # GitHub tra 302 toi kho luu tru - lay Location roi tai KHONG kem token
  $req = [System.Net.HttpWebRequest]::Create($art.archive_download_url)
  $req.AllowAutoRedirect = $false; $req.UserAgent = 'qlhtkt-vps-deploy'
  $req.Headers.Add('Authorization', "Bearer $Token")
  $resp = $req.GetResponse(); $loc = $resp.Headers['Location']; $resp.Close()
  if (-not $loc) { Stop-Deploy 'khong lay duoc duong dan tai artifact' }
  $zip = "$Cfg\next-build-$sha7.zip"
  Invoke-WebRequest -Uri $loc -OutFile $zip -UseBasicParsing -TimeoutSec 600
  $staging = "$App\.next-staging"
  if (Test-Path $staging) { Remove-Item $staging -Recurse -Force -Confirm:$false }
  Expand-Archive -Path $zip -DestinationPath $staging -Force
  Remove-Item $zip -Force
  if (-not (Test-Path "$staging\BUILD_ID")) { Stop-Deploy 'artifact thieu BUILD_ID' }
  $buildSha = if (Test-Path "$staging\DEPLOY_SHA") { (Get-Content "$staging\DEPLOY_SHA" -Raw).Trim() } else { '' }
  if ($buildSha -and $buildSha -ne $sha) { Stop-Deploy "artifact thuoc commit khac ($buildSha)" }
  Write-Log 'Da tai va giai nen ban build vao .next-staging'
  if ($DryRun) { Write-Log 'DryRun: dung truoc khi dong vao git/CSDL/web'; exit 0 }

  # 3. Dong bo ma nguon toi dung commit da build
  $dirty = Invoke-Git @('status', '--porcelain', '--untracked-files=no')
  if ($dirty) { Stop-Deploy "VPS co sua doi chua commit - xu ly tay truoc: $($dirty -join '; ')" }
  $oldHead = (Invoke-Git @('rev-parse', 'HEAD')).Trim()
  Invoke-Git @('fetch', 'origin', $Branch) | Out-Null
  $cur = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
  if ($cur -ne $Branch) { Invoke-Git @('checkout', $Branch) | Out-Null }
  Invoke-Git @('merge', '--ff-only', $sha) | Out-Null
  $changed = @(Invoke-Git @('diff', '--name-only', $oldHead, $sha))
  Write-Log ("Da dong bo ma nguon {0} -> {1} ({2} tep doi)" -f $oldHead.Substring(0, 7), $sha7, $changed.Count)

  # 4. Migration moi
  $ledger = "$Cfg\applied_migrations.txt"
  $applied = if (Test-Path $ledger) { @(Get-Content $ledger) } else { @() }
  $pending = @(Get-ChildItem "$App\prisma\migrations_manual\*.sql" | Where-Object { $_.Name -notmatch '_(rollback|verify)\.sql$' -and $applied -notcontains $_.Name } | Sort-Object Name)
  if ($pending.Count -gt 0) {
    $ds = ($pending | ForEach-Object { $_.Name }) -join ', '
    if (-not $AutoMigrate) { Stop-Deploy "co migration moi can ap tay: $ds" }
    $appEnv = Read-KeyValueFile "$App\.env"
    $dbUrl = if ($appEnv['DIRECT_DATABASE_URL']) { $appEnv['DIRECT_DATABASE_URL'] } else { $appEnv['DATABASE_URL'] }
    New-Item -ItemType Directory -Force 'C:\Backup_QLHTKT' | Out-Null
    $bk = "C:\Backup_QLHTKT\predeploy-$sha7-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
    Invoke-Native { & $PgDump --format=custom --file=$bk "--dbname=$dbUrl" } | Out-Null
    if ($LASTEXITCODE -ne 0) { Stop-Deploy 'pg_dump sao luu truoc migration that bai' }
    Write-Log "Da sao luu CSDL: $bk"
    foreach ($f in $pending) {
      $o = Invoke-Native { & $Node "$App\scripts\deploy\apply-migration.mjs" $f.FullName }
      if ($LASTEXITCODE -ne 0) { Stop-Deploy "migration $($f.Name) loi: $o (ban sao luu: $bk)" }
      Add-Content $ledger $f.Name
      Write-Log "Da ap migration $($f.Name)"
    }
  }

  # 5. Thu vien doi: so ma bam package-lock voi lan cai thanh cong gan nhat (khong dua vao diff git)
  $lockHash = (Get-FileHash "$App\package-lock.json" -Algorithm SHA256).Hash
  $lockHashFile = "$Cfg\installed_lock_hash.txt"
  $daCai = if (Test-Path $lockHashFile) { (Get-Content $lockHashFile -Raw).Trim() } else { '' }
  if ($lockHash -ne $daCai) {
    Write-Log 'package-lock.json khac lan cai truoc -> npm install'
    Push-Location $App
    try { Invoke-Native { & $Npm install --no-audit --no-fund } | Out-Null; if ($LASTEXITCODE -ne 0) { Stop-Deploy 'npm install that bai' } } finally { Pop-Location }
    Set-Content $lockHashFile $lockHash
  }

  # 6. Hoan doi + reload + kiem tra
  $live = "$App\.next"; $old = "$App\.next-old"
  function Rename-Retry([string]$path, [string]$newName) {
    for ($k = 1; $k -le 5; $k++) {
      try { Rename-Item $path $newName -ErrorAction Stop; return $true } catch { Write-Log "Doi ten $path that bai lan $k (file dang bi khoa?)"; Start-Sleep -Seconds 3 }
    }
    return $false
  }
  if (Test-Path $old) { Remove-Item $old -Recurse -Force -Confirm:$false }
  if ((Test-Path $live) -and -not (Rename-Retry $live '.next-old')) { Stop-Deploy 'khong doi ten duoc .next dang chay (file bi khoa) - web van chay ban cu, .next-staging giu lai' }
  if (-not (Rename-Retry $staging '.next')) {
    Rename-Retry $old '.next' | Out-Null
    Stop-Deploy 'khong dua duoc .next-staging vao .next - da tra lai ban cu'
  }
  $mocHoanDoi = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $pm2Out = Invoke-Native { & $Pm2 reload ql-htkt --update-env }
  $ok = ($LASTEXITCODE -eq 0)
  if (-not $ok) { Write-Log "pm2 reload loi: $($pm2Out -join ' ')" }
  for ($i = 0; $i -lt 8 -and $ok; $i++) {
    Start-Sleep -Seconds 8
    $okLan = $false
    try {
      $h = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 15
      # Ca 2 tien trinh ql-htkt phai khoi dong lai SAU luc hoan doi (khong phai tien trinh cu tra loi)
      $procs = @((& $Pm2 jlist 2>$null | Out-String | ConvertFrom-Json) | Where-Object { $_.name -eq 'ql-htkt' })
      $moi = @($procs | Where-Object { $_.pm2_env.status -eq 'online' -and $_.pm2_env.pm_uptime -ge $mocHoanDoi })
      $okLan = ($h.status -eq 'ok') -and $procs.Count -gt 0 -and ($moi.Count -eq $procs.Count)
    } catch { $okLan = $false }
    if ($okLan) { break }
    if ($i -eq 7) { $ok = $false }
  }
  if (-not $ok) {
    Write-Log 'Kiem tra /api/health hoac pm2 THAT BAI -> quay ve ban cu'
    if (Test-Path "$App\.next-failed") { Remove-Item "$App\.next-failed" -Recurse -Force -Confirm:$false }
    Rename-Retry $live '.next-failed' | Out-Null
    if (Test-Path $old) { Rename-Retry $old '.next' | Out-Null }
    Invoke-Native { & $Pm2 reload ql-htkt --update-env } | Out-Null
    Stop-Deploy 'web khong len sau khi hoan doi - da quay ve ban build cu (ma nguon da o commit moi, can kiem tra)'
  }
  if (Test-Path $old) { Remove-Item $old -Recurse -Force -Confirm:$false }
  Set-Content "$Cfg\deployed_sha.txt" $sha
  $msg = (Invoke-Git @('log', '-1', '--format=%s', $sha)) -join ' '
  Write-Log "HOAN TAT trien khai $sha7"
  Send-Telegram "Da trien khai $sha7 len qlhtkt.htkt.com.vn: $msg"
} catch {
  Write-Log "LOI: $($_.Exception.Message)"
  Send-Telegram "LOI khi trien khai: $($_.Exception.Message)"
  exit 1
} finally {
  Remove-Item $Lock -Force -ErrorAction SilentlyContinue
}
