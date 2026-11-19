# VPS AUTO-DEPLOY tu GitHub (chay boi Task Scheduler QLHTKT_AutoDeploy, 5 phut/lan, quyen SYSTEM).
# ASCII-only: PowerShell 5.1 doc file nhu cp1252, ky tu tieng Viet co dau se lam hong chuoi.
#
# Luong xu ly khi co ban build moi tren nhanh main (GitHub Actions "Build cho VPS" chay thanh cong):
#   1. Hoi GitHub API lan chay thanh cong moi nhat -> neu trung DEPLOY_SHA da trien khai thi thoat.
#   2. Tai artifact "next-build" -> giai nen vao app\.next-staging (CHUA dung toi web).
#   3. git fetch; commit build phai nam tren origin/main. KHONG doi nhanh thu muc lam viec: chi tien thang khi thu muc
#      dang o main, sach va di sau commit build. Tep web doc luc chay (app/public, next.config.ts, package-lock) phai
#      trung commit build, lech thi dung.
#   4. Migration moi lay tu chinh commit build (git archive), bo *_rollback, *_verify: sao luu CSDL bang pg_dump roi ap.
#   -DryRunSync: chay toi het buoc 3 + liet ke migration se ap roi dung (khong ghi CSDL, khong doi web).
#   5. package-lock.json doi -> npm install (tang dan, khong xoa node_modules).
#   6. Hoan doi .next-staging -> .next (thu lai neu file bi khoa), pm2 reload ql-htkt; kiem tra /api/health + 2 tien trinh
#      deu khoi dong lai sau luc hoan doi; loi thi quay ve ban cu.
#   Migration chay TRUOC khi web doi ban -> migration PHAI tuong thich nguoc (chi them bang/cot), xem tai lieu.
#   7. Bao Telegram (dung token trong app\.env nhu watchdog).
# Cau hinh + trang thai o C:\Troly\deploy (NGOAI repo): deploy.env, deployed_sha.txt, applied_migrations.txt, logs\.
param([switch]$Force, [switch]$DryRun, [switch]$DryRunSync)

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
  if ($DryRun -or $DryRunSync) { Write-Log "Chay thu - khong gui Telegram: $text"; return $false }
  if (-not $tok -or -not $chat) { Write-Log 'Telegram chua cau hinh - bo qua'; return $false }
  try {
    # Gui JSON UTF-8 (tieu de commit co the co dau tieng Viet; body dang form cua PS 5.1 lam hong dau)
    $json = @{ chat_id = $chat; text = "[QLHTKT deploy] $text" } | ConvertTo-Json -Compress
    Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$tok/sendMessage" -Body ([Text.Encoding]::UTF8.GetBytes($json)) -ContentType 'application/json; charset=utf-8' -TimeoutSec 15 | Out-Null
    return $true
  } catch { Write-Log "Loi gui Telegram: $($_.Exception.Message)"; return $false }
}

# Bao 1 lan cho moi cap (commit, noi dung loi). Ngay 19/11/2026 cung mot loi git lap lai moi 5 phut suot 2 gio.
# Chi ghi dau "da bao" khi gui thanh cong -> Telegram tam loi thi lan sau gui lai; loi KHAC cung commit van duoc bao.
# Luu TAP khoa da bao (200 khoa gan nhat, moi dong 1 khoa) -> loi A, B, A luan phien khong bao lai A.
$AlertFile = "$Cfg\sent_alerts.txt"
function Send-AlertOnce([string]$key, [string]$text) {
  $k = ($key -replace '\s+', ' ').Trim()
  # @( ) BEN NGOAI: 'if' tra mang 1 phan tu thanh chuoi -> phep + noi chuoi thay vi them phan tu
  $da = @(if (Test-Path $AlertFile) { Get-Content $AlertFile })
  if ($da -contains $k) { return }
  if (Send-Telegram $text) { Set-Content $AlertFile (@($da + $k) | Select-Object -Last 200) }
}

# ---- Cau hinh ----
$conf   = Read-KeyValueFile "$Cfg\deploy.env"
$Token  = $conf['GITHUB_TOKEN']
$Repo   = if ($conf['GITHUB_REPO']) { $conf['GITHUB_REPO'] } else { 'BinhSDXQB/HTKT' }
$Branch = if ($conf['DEPLOY_BRANCH']) { $conf['DEPLOY_BRANCH'] } else { 'main' }
$Wf     = if ($conf['WORKFLOW_FILE']) { $conf['WORKFLOW_FILE'] } else { 'build-vps.yml' }
$AutoMigrate = ($conf['AUTO_MIGRATE'] -ne '0')
# pm2 cluster 2 instance; chi nhan 1..16, sai/0 thi dung 2 (0 lam mat dieu kien kiem tra tien trinh)
$MinWorkers  = if ($conf['MIN_WORKERS'] -match '^(1[0-6]|[1-9])$') { [int]$conf['MIN_WORKERS'] } else { 2 }
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
# Lenh git tra dung/sai bang ma thoat (vd merge-base --is-ancestor: 0 = dung, 1 = sai, khac = loi)
function Test-Git([string[]]$a) {
  $out = Invoke-Native { & $Git -C $Root @a }
  if ($LASTEXITCODE -eq 0) { return $true }
  if ($LASTEXITCODE -eq 1) { return $false }
  throw "git $($a -join ' ') that bai: $($out -join ' ')"
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

  function Stop-Deploy([string]$msg) {
    Write-Log "DUNG: $msg"
    if ($DryRun -or $DryRunSync) { Write-Log 'Chay thu - khong gui canh bao'; exit 1 }
    Send-AlertOnce "$sha|$msg" "DUNG trien khai $sha7 - $msg"
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
  if (-not $buildSha) { Stop-Deploy 'artifact thieu DEPLOY_SHA - khong xac minh duoc ban build' }
  if ($buildSha -ne $sha) { Stop-Deploy "artifact thuoc commit khac ($buildSha)" }
  Write-Log 'Da tai va giai nen ban build vao .next-staging'
  if ($DryRun) { Write-Log 'DryRun: dung truoc khi dong vao git/CSDL/web'; exit 0 }

  # 3. Doi chieu ma nguon voi commit da build - KHONG doi nhanh thu muc lam viec.
  #    C:\Troly\HTKT cung la thu muc lam viec: ngay 19/11/2026 ban cu tu 'checkout main' + 'merge --ff-only'
  #    -> doi nhanh cua phien dang lam va ket trien khai 2 gio vi main tren may re nhanh voi origin/main.
  #    Web chi doc .next (da build) + vai tep luc chay; migration lay tu chinh commit build (git archive).
  Invoke-Git @('fetch', 'origin', $Branch) | Out-Null
  if (-not (Test-Git @('merge-base', '--is-ancestor', $sha, "origin/$Branch"))) { Stop-Deploy "commit build $sha7 khong nam tren origin/$Branch" }
  # Chi tien, khong lui: ban dang chay phai la to tien cua ban moi (run thanh cong cu hon, force-push...).
  # CSDL da qua migration cua ban dang chay, lui web la nguy hiem -> lui ban phai lam tay theo runbook (hoac -Force).
  if (-not $Force) {
    if (-not $daTrienKhai) { Stop-Deploy 'khong doc duoc deployed_sha.txt - khong ro ban dang chay, kiem tra tay roi chay voi -Force' }
    if (-not (Test-Git @('merge-base', '--is-ancestor', $daTrienKhai, $sha))) {
      Stop-Deploy ("ban dang chay {0} khong phai to tien cua {1} - tu choi trien khai lui/re nhanh" -f $daTrienKhai.Substring(0, 7), $sha7)
    }
  }
  $oldHead = (Invoke-Git @('rev-parse', 'HEAD')).Trim()
  $cur = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
  $dirty = @(Invoke-Git @('status', '--porcelain', '--untracked-files=no') | Where-Object { $_ })
  $moPhongFF = $false
  if ($cur -eq $Branch -and $dirty.Count -eq 0 -and (Test-Git @('merge-base', '--is-ancestor', 'HEAD', $sha))) {
    # Thu muc dang o dung nhanh va di sau commit build: tien thang nhu truoc (chay thu thi chi bao)
    $scriptDoi = -not (Test-Git @('diff', '--quiet', 'HEAD', $sha, '--', 'app/scripts/deploy'))
    if ($DryRunSync) { $moPhongFF = $true; Write-Log ("DryRunSync: se tien thang {0} -> {1} (khong lam)" -f $oldHead.Substring(0, 7), $sha7) }
    else {
      Invoke-Git @('merge', '--ff-only', $sha) | Out-Null
      Write-Log ("Da dong bo ma nguon {0} -> {1} (nhanh {2})" -f $oldHead.Substring(0, 7), $sha7, $Branch)
      # PowerShell da nap script CU vao bo nho: neu ban moi sua script/bo ap migration thi dung o day,
      # lan chay sau (5 phut) nap script moi va trien khai tiep (deployed_sha chua doi).
      if ($scriptDoi) { Write-Log 'Ban moi sua ma trien khai - da cap nhat, lan chay sau se trien khai bang ma moi'; exit 0 }
    }
  } else {
    Write-Log ("Giu nguyen thu muc lam viec (nhanh {0}, HEAD {1}, {2} tep sua chua commit) - chi doi chieu tep web dung luc chay" -f $cur, $oldHead.Substring(0, 7), $dirty.Count)
  }
  # Tep doc luc chay ngoai .next (public/: geojson, mau Excel; next.config; thu vien) va ma trien khai
  # (script nay + bo ap migration, chay quyen SYSTEM) phai trung commit build, tinh ca sua doi chua commit
  # va tep moi chua theo doi trong public. Lech -> dung, khong chay ban build moi voi tep cua nhanh khac.
  $runtimePaths = @('app/public', 'app/next.config.ts', 'app/package-lock.json', 'app/scripts/deploy')
  # Chay thu o nhanh se tien thang: sau merge tep theo doi trung commit build -> chi con kiem tep chua theo doi
  $drift = @(if (-not $moPhongFF) { Invoke-Git (@('diff', '--name-only', $sha, '--') + $runtimePaths) | Where-Object { $_ } })
  $drift += @(Invoke-Git @('ls-files', '--others', '--exclude-standard', '--', 'app/public', 'app/scripts/deploy') | Where-Object { $_ } | ForEach-Object { "$_ (chua theo doi)" })
  if ($drift.Count -gt 0) { Stop-Deploy ("thu muc lam viec lech commit build o tep web dung luc chay ({0} tep): {1}" -f $drift.Count, (($drift | Select-Object -First 8) -join ', ')) }
  # Can cai thu vien? Kiem TRUOC migration: npm install doc package.json cua thu muc lam viec, phai trung commit build
  $lockHash = if ($moPhongFF) { $null } else { (Get-FileHash "$App\package-lock.json" -Algorithm SHA256).Hash }
  $lockHashFile = "$Cfg\installed_lock_hash.txt"
  $daCai = if (Test-Path $lockHashFile) { (Get-Content $lockHashFile -Raw).Trim() } else { '' }
  if ($lockHash -and $lockHash -ne $daCai -and -not (Test-Git @('diff', '--quiet', $sha, '--', 'app/package.json'))) {
    Stop-Deploy 'can cai thu vien nhung app/package.json o thu muc lam viec khac commit build - cai tay theo runbook'
  }

  # 4. Migration moi - lay tu CHINH commit build, khong tu thu muc lam viec (tranh ap migration cua nhanh dang lam)
  $ledger = "$Cfg\applied_migrations.txt"
  $applied = if (Test-Path $ledger) { @(Get-Content $ledger) } else { @() }
  $migDir = "$Cfg\mig-$sha7"; $migZip = "$Cfg\mig-$sha7.zip"
  if (Test-Path $migDir) { Remove-Item $migDir -Recurse -Force -Confirm:$false }
  if (Test-Path $migZip) { Remove-Item $migZip -Force }
  Invoke-Git @('archive', '--format=zip', "--output=$migZip", $sha, 'app/prisma/migrations_manual') | Out-Null
  Expand-Archive -Path $migZip -DestinationPath $migDir -Force
  Remove-Item $migZip -Force
  $migSrc = "$migDir\app\prisma\migrations_manual"
  if (-not (Test-Path $migSrc)) { Stop-Deploy "khong trich duoc migrations_manual tu commit $sha7" }
  $pending = @(Get-ChildItem "$migSrc\*.sql" | Where-Object { $_.Name -notmatch '_(rollback|verify)\.sql$' -and $applied -notcontains $_.Name } | Sort-Object Name)
  Write-Log ("Migration tai commit build chua ap: {0}" -f $(if ($pending.Count) { ($pending | ForEach-Object { $_.Name }) -join ', ' } else { '(khong)' }))
  if ($DryRunSync) { Write-Log 'DryRunSync: dung truoc khi ap migration/doi ban'; Remove-Item $migDir -Recurse -Force -Confirm:$false; exit 0 }
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
  Remove-Item $migDir -Recurse -Force -Confirm:$false -ErrorAction SilentlyContinue

  # 5. Thu vien doi: so ma bam package-lock voi lan cai thanh cong gan nhat (da kiem package.json o buoc 3)
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
      # ConvertFrom-Json (PS 5.1) bo tay khi JSON co 2 khoa chi khac hoa/thuong (username/USERNAME trong env pm2) -> dung JavaScriptSerializer
      Add-Type -AssemblyName System.Web.Extensions
      $ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
      $ser.MaxJsonLength = [int]::MaxValue
      # chi doc stdout (stderr cua pm2 la ErrorRecord) de canh bao khong lam hong JSON / khong nem loi
      $jl = @(Invoke-Native { & $Pm2 jlist } | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
      $procs = @($ser.DeserializeObject(($jl | Out-String)) | Where-Object { $_['name'] -eq 'ql-htkt' })
      $moi = @($procs | Where-Object { $_['pm2_env']['status'] -eq 'online' -and $_['pm2_env']['pm_uptime'] -ge $mocHoanDoi })
      $okLan = ($h.status -eq 'ok') -and $procs.Count -ge $MinWorkers -and ($moi.Count -eq $procs.Count)
      if (-not $okLan) { Write-Log ("Kiem tra lan {0}: health={1} tien trinh={2} moi={3}" -f ($i + 1), $h.status, $procs.Count, $moi.Count) }
    } catch { $okLan = $false; Write-Log ("Kiem tra lan {0} loi: {1}" -f ($i + 1), $_.Exception.Message) }
    if ($okLan) { break }
    if ($i -eq 7) { $ok = $false }
  }
  if (-not $ok) {
    Write-Log 'Kiem tra /api/health hoac pm2 THAT BAI -> quay ve ban cu'
    if (Test-Path "$App\.next-failed") { Remove-Item "$App\.next-failed" -Recurse -Force -Confirm:$false }
    $r1 = Rename-Retry $live '.next-failed'
    $r2 = if (Test-Path $old) { Rename-Retry $old '.next' } else { $false }
    Invoke-Native { & $Pm2 reload ql-htkt --update-env } | Out-Null
    $rbOk = $false
    for ($j = 0; $j -lt 5 -and -not $rbOk; $j++) {
      Start-Sleep -Seconds 6
      try { $rbOk = ((Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 15).status -eq 'ok') } catch { $rbOk = $false }
    }
    if ($r1 -and $r2 -and $rbOk) {
      Stop-Deploy 'web khong len sau khi hoan doi - da quay ve ban build cu va xac nhan chay lai (ma nguon da o commit moi, can kiem tra)'
    }
    Stop-Deploy "ROLLBACK KHONG XAC NHAN (doi ten: $r1/$r2, health: $rbOk) - CAN XU LY TAY NGAY"

  }
  if (Test-Path $old) { Remove-Item $old -Recurse -Force -Confirm:$false }
  Set-Content "$Cfg\deployed_sha.txt" $sha
  $msg = (Invoke-Git @('log', '-1', '--format=%s', $sha)) -join ' '
  Write-Log "HOAN TAT trien khai $sha7"
  Send-Telegram "Da trien khai $sha7 len qlhtkt.htkt.com.vn: $msg" | Out-Null
} catch {
  $em = $_.Exception.Message
  Write-Log "LOI: $em"
  if (-not ($DryRun -or $DryRunSync)) { Send-AlertOnce "$sha|LOI|$em" "LOI khi trien khai: $em" }
  exit 1
} finally {
  Remove-Item $Lock -Force -ErrorAction SilentlyContinue
}
