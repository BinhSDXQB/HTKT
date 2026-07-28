#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script xuất dữ liệu "Ngày vào công chức, cơ quan NN" từ Excel
Tạo file INSERT SQL sạch (loại bỏ dòng tiêu đề)
"""

import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Đọc file Excel
file_path = r'C:\Troly\HTKT\Mau\SXD_bANG TONG HOP NGHI PHEP NAM 2026.xlsx'
wb = openpyxl.load_workbook(file_path, data_only=True)
ws = wb.active

# Thu thập dữ liệu hợp lệ (loại bỏ tiêu đề nhóm)
data = []
for row in range(9, ws.max_row + 1):
    stt = ws.cell(row, 1).value
    name = ws.cell(row, 2).value
    ngay_vao = ws.cell(row, 3).value

    # Bỏ qua dòng không có họ tên
    if not name or not isinstance(name, str):
        continue

    name_stripped = name.strip()

    # Bỏ qua dòng tiêu đề nhóm (I, II, III - CÔNG CHỨC, HỢP ĐỒNG, VIÊN CHỨC...)
    if name_stripped.upper() in ['CÔNG CHỨC', 'HỢP ĐỒNG 111', 'VIÊN CHỨC BIỆT PHÁI', 'NGƯỜI LẬP']:
        continue
    if name_stripped.startswith(('I ', 'II ', 'III ')) and name_stripped.isupper():
        continue

    # Bỏ qua nếu STT không phải số
    if stt is None:
        continue

    data.append({
        'stt': int(stt) if isinstance(stt, (int, float)) else stt,
        'hoTen': name_stripped,
        'ngayVao': str(ngay_vao).strip() if ngay_vao else None
    })

# Xuất danh sách kiểm tra
print("=" * 80)
print("DANH SÁCH KIỂM TRA - HỌ TÊN & NGÀY VÀO CÔNG CHỨC")
print("=" * 80)
print()

for i, d in enumerate(data, 1):
    status = "✓" if d['ngayVao'] else "✗ KHÔNG CÓ"
    print(f"{i:3d}. {d['hoTen']:35s} | {d['ngayVao']:15s} | {status}")

# Thống kê
print()
print("=" * 80)
print("THỐNG KÊ")
print("=" * 80)
total = len(data)
with_date = sum(1 for d in data if d['ngayVao'])
without_date = total - with_date

print(f"Tổng số người: {total}")
print(f"Có ngày vào: {with_date}")
print(f"Không có ngày vào: {without_date}")

if without_date > 0:
    print()
    print("⚠ CẢNH BÁO: Người không có ngày vào công chức:")
    for d in data:
        if not d['ngayVao']:
            print(f"  - {d['hoTen']}")

# Xuất câu INSERT
print()
print("=" * 80)
print("CÂU INSERT SQL")
print("=" * 80)
print()

insert_sql = "INSERT INTO temp_ngay_vao_cong_chuc VALUES\n"
for i, d in enumerate(data):
    stt = int(d['stt']) if isinstance(d['stt'], (int, float)) else d['stt']
    ho_ten = d['hoTen'].replace("'", "''")
    ngay_vao = d['ngayVao'] if d['ngayVao'] else ""

    comma = "," if i < len(data) - 1 else ";"
    insert_sql += f"  ({stt}, '{ho_ten}', '{ngay_vao}'){comma}\n"

print(insert_sql)

# Ghi vào file
with open(r'C:\Troly\HTKT\app\prisma\import_data.sql', 'w', encoding='utf-8') as f:
    f.write(insert_sql)

print()
print("✓ Đã lưu vào: C:\\Troly\\HTKT\\app\\prisma\\import_data.sql")

wb.close()
