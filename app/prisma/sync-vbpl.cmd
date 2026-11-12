@echo off
REM Tự động đồng bộ kho văn bản pháp luật (chạy bởi Task Scheduler "Sync_VBPL_KhoTaiLieu").
REM Ghi nhật ký vào prisma\sync-vbpl.log để kiểm soát.
REM Xoay vong log > 10 MB truoc khi mo log de ghi (giu 2 ban cu: .1, .2). Loi xoay vong khong chan dong bo.
"C:\Program Files\nodejs\node.exe" "C:\Troly\HTKT\app\prisma\xoay-vong-log.mjs" "C:\Troly\HTKT\app\prisma\sync-vbpl.log"
echo. >> "C:\Troly\HTKT\app\prisma\sync-vbpl.log"
echo ========== %DATE% %TIME% ========== >> "C:\Troly\HTKT\app\prisma\sync-vbpl.log"
"C:\Program Files\nodejs\node.exe" "C:\Troly\HTKT\app\prisma\sync-vbpl.mjs" >> "C:\Troly\HTKT\app\prisma\sync-vbpl.log" 2>&1
