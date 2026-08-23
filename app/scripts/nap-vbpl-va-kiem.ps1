# Chạy 1 lệnh sau khi NẠP CREDIT OpenAI: nạp văn bản mới vào kho → khai hiệu lực → kiểm thử chatbot.
#   powershell -ExecutionPolicy Bypass -File scripts/nap-vbpl-va-kiem.ps1
#
# Vì sao gom thành 1 script: cả 3 bước đều cần OpenAI (nhúng vector + hỏi chatbot); ngày 23/8/2026
# tài khoản hết credit giữa chừng nên phần nạp NĐ 300/2026 và Luật CBCC 80/2025 (bản .docx) còn dở.
$ErrorActionPreference = 'Stop'
Set-Location 'C:\Troly\HTKT\app'

Write-Host '=== [1/4] Nap van ban moi tu G:\My Drive\Tailieu_VBPL ===' -ForegroundColor Cyan
node prisma/sync-vbpl.mjs

Write-Host '=== [2/4] Khai tinh trang hieu luc theo bang chung ===' -ForegroundColor Cyan
node scripts/khai-hieu-luc-tu-bang-chung.mjs
node scripts/sync-hieu-luc-tai-lieu.mjs

Write-Host '=== [3/4] Ra do phu van ban phap ly cua chatbot ===' -ForegroundColor Cyan
node scripts/kiem-tra-vbpl-chatbot.mjs

Write-Host '=== [4/4] Kiem thu chat luong tra loi (23 ca) ===' -ForegroundColor Cyan
node scripts/smoke-chatbot.mjs
