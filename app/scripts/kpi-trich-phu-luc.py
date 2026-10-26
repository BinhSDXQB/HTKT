# -*- coding: utf-8 -*-
"""
Trích "Phụ lục KPI - Kế hoạch nhiệm vụ năm 2026 của Sở Xây dựng" (PDF có lớp chữ) thành JSON có cấu trúc.

Dùng:  python scripts/kpi-trich-phu-luc.py "<Phu luc KPI.pdf>" lib/kpi/ke-hoach-2026.json
Cần:   pip install pymupdf

Không sửa nội dung nhiệm vụ. Chỉ (1) gán mỗi dòng cho phòng/nhóm theo tiêu đề, (2) tách cột "Người thực hiện" thành
danh sách người theo danh sách tên chuẩn của từng phòng (kèm các cách viết sai trong văn bản gốc), (3) ghi vai trò
(chủ trì / phối hợp / thực hiện) theo từ khoá đứng trước tên. Mọi chỗ không chắc chắn được ghi vào "canhBao".
"""
import json
import re
import sys

import fitz  # PyMuPDF

PHONG = {
    'Phòng Quản lý hoạt động xây dựng': 'QLHDXD',
    'Phòng Quy hoạch Kiến trúc': 'QHKT',
    'Phòng Kinh tế và Vật liệu xây dựng': 'KTVLXD',
    'Phòng Hạ tầng kỹ thuật': 'HTKT',
    'Phòng Phát triển đô thị': 'PTDT',
    'Phòng Quản lý kết cấu hạ tầng giao thông': 'QLKCHTGT',
    'Phòng Quản lý chất lượng công trình giao thông': 'QLCLCTGT',
    'Phòng Quản lý nhà và thị trường bất động sản': 'QLNTTBDS',
    'Phòng Quản lý vận tải': 'QLVT',
    'Phòng Kế hoạch - Tài chính': 'KHTC',
    'Văn phòng': 'VP',
}

# Danh sách tên chuẩn theo phòng: tên chuẩn -> các cách viết trong văn bản gốc (kể cả sai chính tả / bị ngắt dòng).
R = {
    'QLHDXD': {n: [n] for n in ['Võ Văn Tuần', 'Nguyễn Thành Lai', 'Tạ Công Danh', 'Hoàng Thanh Hải', 'Trần Ngọc Bình',
                                'Trần Nguyễn', 'Phan Học Phi', 'Phan Thanh Tâm']},
    'QHKT': {n: [n] for n in ['Nguyễn Thanh Hải', 'Lê Quang Phi', 'Dương Bá Thịnh', 'Đặng Hoàng Anh', 'Nguyễn Thế Thái Tùng',
                              'Nguyễn Mậu Hai', 'Bùi Việt Châu', 'Hoàng Đức Anh Vũ']},
    'KTVLXD': {n: [n] for n in ['Dương Thị Thanh Nga', 'Hoàng Hải Thành', 'Hoàng Minh Phú', 'Nguyễn Sơn Tùng',
                                'Nguyễn Trung Thành', 'Nguyễn Đức Tuấn', 'Trần Việt Hưng']},
    'HTKT': {
        'Trần Hữu Sửu': ['Trần Hữu Sửu', 'Trần Hửu Sữu'],
        'Trần Văn Bình': ['Trần Văn Bình'],
        'Ngô Thị Ái Linh': ['Ngô Thị Ái Linh'],
        'Phạm Minh Thành': ['Phạm Minh Thành'],
        'Nguyễn Tuấn Long': ['Nguyễn Tuấn Long', 'Nguyễn Tuấn'],
        'Lê Quang Nhật Minh': ['Lê Quang Nhật Minh'],
    },
    'PTDT': {n: [n] for n in ['Hoàng Việt', 'Lê Anh Tuấn A', 'Lê Anh Tuấn B', 'Nguyễn Lê Cương', 'Nguyễn Ngọc Nam',
                              'Nguyễn Như Quỳnh', 'Đặng Ngọc Chung']},
    'QLKCHTGT': {
        'Bùi Đức Thành': ['Bùi Đức Thành'], 'Lê Minh Tuấn': ['Lê Minh Tuấn'], 'Lê Quang Đạo': ['Lê Quang Đạo', 'Lê Q Đ'],
        'Lê Thị Hồng Ngọc': ['Lê Thị Hồng Ngọc'], 'Lê Văn Thủy': ['Lê Văn Thủy', 'Lê Văn Thuỷ'],
        'Phan Thanh Hòa': ['Phan Thanh Hòa'], 'Phạm Hữu Chung': ['Phạm Hữu Chung', 'Phạm Hũu Chung'],
        'Trần Thanh Hiếu': ['Trần Thanh Hiếu'], 'Trần Thượng Nguyên': ['Trần Thượng Nguyên'],
    },
    'QLCLCTGT': {n: [n] for n in ['Nguyễn Mạnh Hùng', 'Phạm Xuân Bằng', 'Hoàng Quang Minh', 'Hoàng Mai Nam', 'Lê Minh Long',
                                  'Lê Địch Trung', 'Trương Văn Hưng']},
    'QLNTTBDS': {n: [n] for n in ['Lê Minh Châu', 'Nguyễn Thành Nhân', 'Nguyễn Thị Thùy Linh', 'Phạm Thị Ngân Hương',
                                  'Trần Nhật Khánh', 'Võ Việt Dũng']},
    'QLVT': {
        'Hoàng Ngọc Dũng': ['Hoàng Ngọc Dũng'], 'Nguyễn Quang Hợp': ['Nguyễn Quang Hợp'], 'Nguyễn Tấn Phương': ['Nguyễn Tấn Phương'],
        'Nguyễn Văn Linh': ['Nguyễn Văn Linh'], 'Phạm Châu Tuấn': ['Phạm Châu Tuấn'], 'Trần Trung Thông': ['Trần Trung Thông'],
        'Trần Văn Công': ['Trần Văn Công'], 'Đinh Quang Phúc': ['Đinh Quang Phúc'], 'Đặng Văn Xuân': ['Đặng Văn Xuân', 'Đăng Văn Xuân'],
    },
    'KHTC': {
        'Nguyễn Anh Tuấn': ['Nguyễn Anh Tuấn'], 'Nguyễn Sỹ Đông': ['Nguyễn Sỹ Đông'], 'Nguyễn Thị Hồng Hạnh': ['Nguyễn Thị Hồng Hạnh'],
        'Nguyễn Thị Thuận': ['Nguyễn Thị Thuận'], 'Nguyễn Văn Hiển': ['Nguyễn Văn Hiển'], 'Phạm Duy Hùng': ['Phạm Duy Hùng'],
        'Trần Nguyên Liêm': ['Trần Nguyên Liêm'], 'Võ Hoàng Hà Nhi': ['Võ Hoàng Hà Nhi', 'Võ H à Hà Nhi'],
        'Đặng Hoài Dương': ['Đặng Hoài Dương'], 'Đỗ Trung Đức': ['Đỗ Trung Đức'],
    },
    'VP': {n: [n] for n in ['Lê Cẩm Nhung', 'Lê Thị Xuân Quý', 'Nguyễn Minh Hòa', 'Nguyễn Thị Mỹ Nhung', 'Trần Thị Thu Liễu',
                            'Đỗ Trung Hiếu']},
}

# Ô bị ngắt dòng làm hỏng tên trong văn bản gốc: gán nhiều người + cảnh báo.
GHEP = {('HTKT', 'Long Lê Quang Nhật'): ['Nguyễn Tuấn Long', 'Lê Quang Nhật Minh']}

QUY_RE = re.compile(r'từ\s+tháng\s*(\d{1,2})\s*-\s*tháng\s*(\d{1,2})', re.I)


def quy_cua_thang(t):
    return (t - 1) // 3 + 1


def tach_nguoi(ma, o):
    """Trả về (danh sách người, cảnh báo)."""
    s = re.sub(r"[’']", ' ', o)
    s = re.sub(r'\s+', ' ', s)
    canh_bao = []
    cho = []  # (vị trí đầu, vị trí cuối, tên chuẩn[])
    for goc, ten in GHEP.items():
        if goc[0] == ma and goc[1] in s:
            i = s.index(goc[1])
            cho.append((i, i + len(goc[1]), ten))
            canh_bao.append(f'Ô "{goc[1]}" bị ngắt dòng trong bản gốc → gán {", ".join(ten)}, cần xác nhận')
            s = s[:i] + ' ' * len(goc[1]) + s[i + len(goc[1]):]
    cands = []
    for chuan, alias in R[ma].items():
        for a in alias:
            for m in re.finditer(re.escape(a), s):
                cands.append((m.start(), m.end(), chuan))
    cands.sort(key=lambda x: (-(x[1] - x[0]), x[0]))
    dung = []
    for b, e, c in cands:
        if all(e <= b2 or b >= e2 for b2, e2, _ in dung):
            dung.append((b, e, c))
    for b, e, t in cho:
        dung.append((b, e, t))
    dung.sort(key=lambda x: x[0])

    # từ khoá vai trò (vị trí -> vai trò)
    kw = [(m.start(), 'CHU_TRI') for m in re.finditer(r'[Cc]hủ trì', s)]
    kw += [(m.start(), 'PHOI_HOP') for m in re.finditer(r'[Pp]hối hợp', s)]
    kw += [(m.start(), 'THUC_HIEN') for m in re.finditer(r'(?<![Cc]hủ trì, )[Tt]hực hiện', s)]
    kw.sort()
    cv = [(m.start(), m.group(0)) for m in re.finditer(r'\b(TP|PTP|CV|Các PTP|Các CV)\b', s)]
    cv.sort()

    nguoi = []
    thay = set()
    for b, e, c in dung:
        vt = 'THUC_HIEN'
        for p, r in kw:
            if p < b:
                vt = r
        chuc = None
        for p, g in cv:
            if p < b:
                chuc = 'TP' if g == 'TP' else 'PTP' if 'PTP' in g else 'CV'
        tiep = s[e:e + 90]
        ghi = None
        m = re.match(r'\s*\(([^)]*)\)', tiep)
        if m:
            ghi = m.group(1).strip()
        quy = None
        if ghi:
            q = QUY_RE.search(ghi)
            if q:
                quy = list(range(quy_cua_thang(int(q.group(1))), quy_cua_thang(int(q.group(2))) + 1))
        for ten in (c if isinstance(c, list) else [c]):
            if ten in thay:
                continue
            thay.add(ten)
            p = {'ten': ten, 'vaiTro': vt}
            if chuc:
                p['chucVu'] = chuc
            if ghi:
                p['ghiChu'] = ghi
            if quy:
                p['quy'] = quy
            nguoi.append(p)
    return nguoi, canh_bao


def main(pdf, out):
    doc = fitz.open(pdf)
    rows = []
    for i, p in enumerate(doc):
        for t in p.find_tables().tables:
            for r in t.extract():
                rows.append([i + 1] + [(c or '').replace('\n', ' ').strip() for c in r][:7])
    phan = None
    ma = None
    nhom = None
    nhiem_vu = []
    for r in rows:
        trang, c = r[0], (r[1:] + [''] * 7)[:7]
        if c[0] == 'TT' or (c[0] == '1' and c[1] == '2'):
            continue
        if c[0] in ('A', 'B') and not any(c[2:]):
            phan, ma, nhom = c[0], None, None
            continue
        if not any(c[2:]):
            ten = re.sub(r'\s+', ' ', c[1])
            tim = next((v for k, v in PHONG.items() if k.lower() == ten.lower()), None)
            if tim:
                ma, nhom = tim, None
            else:
                nhom = ten
            continue
        if ma is None:
            raise SystemExit(f'Dòng trước khi gặp tiêu đề phòng (trang {trang}): {c[:2]}')
        nguoi, cb = tach_nguoi(ma, c[4])
        if not nguoi:
            cb.append(f'Không nhận diện được người thực hiện trong ô: "{c[4]}"')
        nhiem_vu.append({
            'id': f'{phan}-{ma}-{len([x for x in nhiem_vu if x["phan"] == phan and x["phong"] == ma]) + 1:03d}',
            'phan': phan, 'phong': ma, 'nhom': nhom, 'stt': c[0], 'trang': trang,
            'ten': c[1], 'sanPham': c[2], 'thoiHan': c[3],
            'nguoi': nguoi, 'nguoiGoc': c[4], 'lanhDao': c[5], 'canCu': c[6], 'canhBao': cb,
        })
    json.dump({'nguon': 'Phụ lục KPI - Kế hoạch nhiệm vụ năm 2026 của Sở Xây dựng (QĐ 954/QĐ-SXD ngày 25/8/2026)',
               'nhiemVu': nhiem_vu}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(nhiem_vu)} nhiệm vụ → {out}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
