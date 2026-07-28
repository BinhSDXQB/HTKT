@echo off
REM Tự động đồng bộ kho văn bản pháp luật (chạy bởi Task Scheduler "Sync_VBPL_KhoTaiLieu").
REM Ghi nhật ký vào prisma\sync-vbpl.log để kiểm soát.
echo. >> "C:\Troly\HTKT\app\prisma\sync-vbpl.log"
echo ========== %DATE% %TIME% ========== >> "C:\Troly\HTKT\app\prisma\sync-vbpl.log"
"C:\Program Files\nodejs\node.exe" "C:\Troly\HTKT\app\prisma\sync-vbpl.mjs" >> "C:\Troly\HTKT\app\prisma\sync-vbpl.log" 2>&1
