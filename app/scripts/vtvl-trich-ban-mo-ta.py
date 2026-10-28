"""
Trích và đối chiếu "Bản mô tả công việc và khung năng lực" từng vị trí việc làm (VTVL) của Sở Xây dựng.

Đầu vào (chỉ ĐỌC, không sửa):
  - thư mục các bản mô tả .docx (mỗi tệp một VTVL, mẫu theo NĐ 361/2025/NĐ-CP)
  - PDF Quyết định phê duyệt (có Danh mục VTVL: mã, tên, ngạch, đơn vị thực hiện)
Đầu ra (trong thư mục --ra):
  - danh-muc-vtvl.csv        : danh mục chính thức đọc từ PDF (nguồn sự thật cho `vi_tri_viec_lam`)
  - doi-chieu-ban-mo-ta.md   : các điểm bản mô tả KHÔNG khớp danh mục / không nhất quán (để Văn phòng Sở sửa nguồn)
  - ban-mo-ta.json           : (tuỳ chọn --json) toàn bộ nội dung có cấu trúc, để nạp CSDL sau khi duyệt

Dùng:
  python -P scripts/vtvl-trich-ban-mo-ta.py "<thư mục docx>" "<QD phe duyet.pdf>" --ra docs/kpi-2026/vtvl [--json]
Cần:   pip install pymupdf python-docx
Quy ước: trường thiếu để rỗng/None (không điền số 0 hay giá trị đoán). Không ghi dữ liệu cá nhân (bản mô tả theo VTVL, không theo người).
"""
import argparse
import collections
import csv
import difflib
import glob
import json
import os
import re
import sys
import unicodedata

import docx
import fitz  # PyMuPDF
from docx.table import Table
from docx.text.paragraph import Paragraph

NGACH = {'Chuyên viên cao cấp', 'Chuyên viên chính', 'Chuyên viên', 'Pháp chế viên', 'Văn thư viên',
         'Kế toán viên chính', 'Kế toán viên'}
TIEN_TO_DON_VI = ('Phòng ', 'Văn phòng', 'Lãnh đạo Sở', 'Các phòng')
NHOM = {'LĐ': 'Lãnh đạo, quản lý', 'CMNV': 'Công chức chuyên môn, nghiệp vụ'}


def gon(s):
    return re.sub(r'\s+', ' ', (s or '').replace('\xa0', ' ')).strip()


def chuan(s):
    s = unicodedata.normalize('NFC', s or '').lower()
    return re.sub(r'[^0-9a-zà-ỹ]+', ' ', s).strip()


# ───────────────────────── Danh mục từ PDF Quyết định ─────────────────────────
def doc_danh_muc(pdf):
    lines = []
    for p in fitz.open(pdf):
        lines += [l.strip() for l in p.get_text().splitlines()]
    bo_qua = {'', 'Mã VTVL', 'Tên VTVL', 'Ngạch công chức tương ứng', 'Đơn vị thực hiện VTVL'}
    ma_re = re.compile(r'^(LĐ|CMNV)\.(\d\d)$')
    # chỉ lấy phần sau chữ "DANH MỤC"
    start = next(i for i, l in enumerate(lines) if l == 'DANH MỤC')
    khoi, cur = [], None
    for l in lines[start:]:
        if l in bo_qua or re.fullmatch(r'\d{1,2}', l) or re.match(r'^(I|II|III)\.\s', l) or re.match(r'^\d+ vị trí$', l) or l == 'Vị trí việc làm của Sở Xây dựng':
            continue
        if re.fullmatch(r'\d+', l):  # "59" — số lượng nhóm
            continue
        m = ma_re.match(l)
        if m:
            cur = {'ma': l, 'dong': []}
            khoi.append(cur)
        elif cur is not None:
            cur['dong'].append(l)
    rows = []
    for k in khoi:
        ten, entries, e = [], [], None
        for l in k['dong']:
            if l in NGACH and (ten or e):
                if not (ten == [] and e is None):
                    e = {'ngach': l, 'don_vi': []}
                    entries.append(e)
                    continue
            if e is None:
                # chưa gặp ngạch: dòng thuộc tên, trừ khi là dòng bắt đầu đơn vị (CMNV không ghi ngạch)
                if ten and l.startswith(TIEN_TO_DON_VI):
                    e = {'ngach': None, 'don_vi': [l]}
                    entries.append(e)
                else:
                    ten.append(l)
            else:
                e['don_vi'].append(l)
        for i, e in enumerate(entries or [{'ngach': None, 'don_vi': []}]):
            rows.append({'ma': k['ma'], 'ten': gon(' '.join(ten)), 'ngach': e['ngach'],
                         'don_vi': gon(' '.join(e['don_vi'])).rstrip('.'), 'nhom': NHOM[k['ma'].split('.')[0]], 'dong': i + 1})
    return rows


# ───────────────────────── Bản mô tả .docx ─────────────────────────
MUC = [('muc_tieu', r'^1\s*[-.]\s*Mục tiêu'), ('nhiem_vu', r'^2\s*[-.]\s*Nhiệm vụ'), ('quan_he', r'^3\s*[-.]\s*Mối quan hệ'),
       ('quyen_han', r'^4\s*[-.]\s*Phạm vi quyền hạn'), ('dieu_kien', r'^5\s*[-.]\s*Điều kiện'),
       ('trinh_do', r'^6\s*[-.]\s*Yêu cầu về trình độ'), ('nang_luc', r'^7\s*[-.]\s*Yêu cầu về năng lực')]


def khoi_doc(doc):
    for el in doc.element.body.iterchildren():
        if el.tag.endswith('}p'):
            yield Paragraph(el, doc)
        elif el.tag.endswith('}tbl'):
            yield Table(el, doc)


def hang_gon(r):
    out = []
    for c in r.cells:
        s = gon(c.text)
        if not out or out[-1] != s:
            out.append(s)
    return out


def trich_docx(path):
    doc = docx.Document(path)
    rec = {'tep': os.path.basename(path), 'ma': None, 'ten': None, 'ngach': None, 'ngay_bat_dau': None, 'dia_diem': None,
           'can_cu': None, 'muc_tieu': '', 'nhiem_vu': [], 'quan_he': {'trong': [], 'ngoai': []}, 'quyen_han': [],
           'dieu_kien': [], 'trinh_do': {}, 'nang_luc': []}
    muc = None
    for b in khoi_doc(doc):
        if isinstance(b, Paragraph):
            t = gon(b.text)
            if not t:
                continue
            m = next((k for k, p in MUC if re.match(p, t)), None)
            if m:
                muc = m
            elif muc == 'muc_tieu':
                rec['muc_tieu'] = (rec['muc_tieu'] + ' ' + t).strip()
            continue
        rows = [hang_gon(r) for r in b.rows]
        if not rows:
            continue
        if muc is None:
            for r in rows:
                for c in r:
                    for khoa, pat in (('ma', r'^Mã vị trí việc làm:\s*(.+)$'), ('ten', r'^Tên VTVL:\s*(.+)$'),
                                      ('ngay_bat_dau', r'^Ngày bắt đầu thực hiện:\s*(.+)$')):
                        m = re.match(pat, c)
                        if m and not rec[khoa]:
                            rec[khoa] = gon(m.group(1))
                if len(r) > 1 and r[0].startswith('Ngạch công chức tương ứng'):
                    rec['ngach'] = gon(r[-1]) or None
                if len(r) > 1 and r[0].startswith('Địa điểm làm việc'):
                    rec['dia_diem'] = gon(r[-1])
                if len(r) > 1 and r[0].startswith('Quy trình công việc'):
                    rec['can_cu'] = gon(r[-1])
        elif muc == 'nhiem_vu':
            # đọc theo CỘT LƯỚI gốc (TT, nhiệm vụ, công việc, kết quả, tiêu chí) để ô gộp không làm lệch cột
            for tr in b.rows:
                g = [gon(c.text) for c in tr.cells]
                if len(g) >= 5 and re.match(r'^\d+(\.\d+)*$', g[0]):
                    rec['nhiem_vu'].append({'stt': g[0], 'nhiem_vu': g[1], 'cong_viec': g[2] if g[2] != g[1] else '',
                                            'ket_qua': g[3], 'tieu_chi': g[4]})
        elif muc == 'quan_he':
            for r in rows[1:]:
                rec['quan_he']['ngoai' if len(r) == 2 else 'trong'].append(r)
        elif muc == 'quyen_han':
            for r in rows:
                if len(r) > 1 and re.match(r'^\d+(\.\d+)*$', r[0]):
                    rec['quyen_han'].append({'stt': r[0], 'noi_dung': r[1]})
        elif muc == 'dieu_kien':
            rec['dieu_kien'] += [r for r in rows if len(r) >= 2 and r[0] != 'Nội dung']
        elif muc == 'trinh_do':
            for r in rows:
                if len(r) >= 2 and r[0] != 'Nhóm yêu cầu':
                    rec['trinh_do'][r[0]] = r[1]
        elif muc == 'nang_luc':
            for r in rows:
                if len(r) >= 3 and r[0] != 'Nhóm năng lực':
                    rec['nang_luc'].append({'nhom': r[0], 'ten': r[1], 'cap_do': r[2]})
    return rec


# ───────────────────────── Đối chiếu ─────────────────────────
MA_TEP = re.compile(r'(LĐ|CMNV)\.(\d\d)')
MA_HOP_LE = re.compile(r'^(LĐ|CMNV)\.\d\d$')


def doi_chieu(ds, dm):
    ma_dm = {r['ma'] for r in dm}
    ten_dm = {r['ma']: r['ten'] for r in dm}
    ngach_dm = collections.defaultdict(set)
    for r in dm:
        if r['ngach']:
            ngach_dm[r['ma']].add(r['ngach'])
    kq = collections.OrderedDict()
    co_ban = collections.Counter()
    for r in ds:
        m = MA_TEP.search(r['tep'])
        r['ma_tep'] = m.group(0) if m else None
        co_ban[r['ma_tep']] += 1
    kq['thieu_ban'] = sorted(ma_dm - set(co_ban))
    kq['thua_ma_tep'] = sorted(set(co_ban) - ma_dm - {None})
    kq['ma_noi_dung_sai'] = [(r['tep'], r['ma']) for r in ds if r['ma'] != r['ma_tep']]
    nd = collections.Counter(r['ma'] for r in ds if r['ma'] and MA_HOP_LE.match(r['ma']))
    nhieu_tep = collections.defaultdict(set)
    for r in ds:
        nhieu_tep[r['ma']].add(r['ma_tep'])
    kq['ma_noi_dung_trung'] = sorted((m, sorted(t)) for m, t in nhieu_tep.items() if m and MA_HOP_LE.match(m) and len(t) > 1)
    ten_lech = []
    for r in ds:
        t = ten_dm.get(r['ma_tep'])
        if not t or r['ma_tep'].startswith('LĐ.04') or r['ma_tep'].startswith('LĐ.06'):
            continue
        a, b = chuan(r['ten']), chuan(t)
        if a != b:
            ten_lech.append((r['ma_tep'], round(difflib.SequenceMatcher(None, a, b).ratio(), 2), r['ten'], t,
                             bool(re.search(r'\b(quản lý|quản lý) \1\b', a))))
    kq['ten_lech'] = sorted(ten_lech)
    kq['ngach_lech'] = [(r['ma_tep'], r['ngach'], sorted(ngach_dm[r['ma_tep']])) for r in ds
                        if ngach_dm.get(r['ma_tep']) and chuan(r['ngach'] or '') not in {chuan(x) for x in ngach_dm[r['ma_tep']]}]
    # gộp biến thể dấu gạch (– / -) và dấu chấm cuối để chỉ còn khác biệt thật về nội dung địa chỉ
    kq['dia_diem'] = collections.Counter(re.sub(r'\s*[–-]\s*', ' – ', re.sub(r'\.$', '', r['dia_diem'] or '')) for r in ds)
    kq['ngay_bat_dau'] = collections.Counter(r['ngay_bat_dau'] for r in ds)
    # giữ nguyên dấu cách để thấy cách viết không thống nhất ("2-4" và "2 - 4")
    kq['cap_do_dinh_dang'] = collections.Counter(x['cap_do'] for r in ds for x in r['nang_luc'] if re.fullmatch(r'\d\s*-\s*\d', x['cap_do']))
    kq['cap_do_khong_dinh_dang'] = sorted({x['cap_do'] for r in ds for x in r['nang_luc'] if not re.fullmatch(r'\d\s*-\s*\d', x['cap_do'])})
    kq['so_dong_nv'] = sum(len(r['nhiem_vu']) for r in ds)
    kq['so_ten_nv'] = len({chuan(x['nhiem_vu']) for r in ds for x in r['nhiem_vu']})
    kq['so_nang_luc'] = len({(x['nhom'], x['ten']) for r in ds for x in r['nang_luc']})
    return kq


def viet_bao_cao(ds, dm, kq, nguon):
    L = []
    w = L.append
    w('# Đối chiếu bản mô tả công việc với Danh mục VTVL của Quyết định phê duyệt\n')
    w(f'> Sinh tự động bởi `app/scripts/vtvl-trich-ban-mo-ta.py` từ: {nguon}. Không sửa tệp nguồn. Chạy lại khi Văn phòng Sở cập nhật bản mô tả.\n')
    w('## Tóm tắt\n')
    ld = {r['ma'] for r in dm if r['ma'].startswith('LĐ')}
    cm = {r['ma'] for r in dm if r['ma'].startswith('CMNV')}
    w(f'- Danh mục trong Quyết định: **{len(ld) + len(cm)} mã** = {len(ld)} lãnh đạo, quản lý + {len(cm)} chuyên môn, nghiệp vụ; '
      f'**{len(dm)} dòng** vì mã có hai ngạch (Phó Giám đốc, Phó Trưởng phòng) chiếm hai dòng.')
    w(f'- Số tệp bản mô tả: **{len(ds)}**; số dòng nhiệm vụ: **{kq["so_dong_nv"]}** nhưng chỉ **{kq["so_ten_nv"]}** tên nhiệm vụ khác nhau (rất lặp: nên chuẩn hóa khi nạp CSDL); '
      f'**{kq["so_nang_luc"]}** năng lực khác nhau.\n')
    w('## 1. Mã vị trí việc làm\n')
    w(f'- Mã có trong Quyết định nhưng **không có tệp** theo tên tệp: {kq["thieu_ban"] or "không"}.')
    w(f'- Mã theo tên tệp **không có** trong Quyết định: {kq["thua_ma_tep"] or "không"}.')
    if kq['ma_noi_dung_sai']:
        w('\n**Mã ghi trong nội dung tệp khác với mã theo tên tệp** (khả năng sai ở nguồn; mã đúng được suy ra từ tên tệp và tên VTVL, cần Văn phòng Sở xác nhận):\n')
        w('| Tệp | Mã ghi trong nội dung |\n|---|---|')
        for t, m in kq['ma_noi_dung_sai']:
            w(f'| {t} | `{m}` |')
    if kq['ma_noi_dung_trung']:
        w('\n**Hai tệp cùng khai một mã trong nội dung:**\n')
        for m, t in kq['ma_noi_dung_trung']:
            w(f'- `{m}` ← {", ".join(str(x) for x in t)}')
    w('\n## 2. Tên VTVL khác danh mục\n')
    if kq['ten_lech']:
        w('Tên trong bản mô tả nên **theo đúng Quyết định** để đối chiếu máy. Cột "Mức": **KHÁC NỘI DUNG** (độ giống < 0,7: tên chỉ một vị trí khác, '
          'cần người kiểm tra tệp) hoặc "diễn đạt" (cùng vị trí, khác cách viết); "lặp từ" là lỗi gõ lặp "quản lý quản lý".\n')
        w('| Mã | Tên trong bản mô tả | Tên trong Quyết định | Giống nhau | Mức |\n|---|---|---|---|---|')
        for ma, r, a, b, lap in kq['ten_lech']:
            muc = 'KHÁC NỘI DUNG' if r < 0.7 else ('diễn đạt, lặp từ' if lap else 'diễn đạt')
            w(f'| {ma} | {a} | {b} | {r} | {muc} |')
    else:
        w('Không có khác biệt.')
    w('\n## 3. Ngạch công chức khác danh mục\n')
    if kq['ngach_lech']:
        w('| Mã | Ngạch trong bản mô tả | Ngạch trong Quyết định |\n|---|---|---|')
        for ma, a, b in kq['ngach_lech']:
            w(f'| {ma} | {a} | {", ".join(b)} |')
    else:
        w('Không có khác biệt.')
    w('\n## 4. Địa điểm làm việc và ngày bắt đầu (không nhất quán giữa các tệp)\n')
    qb = sum(v for k, v in kq['dia_diem'].items() if 'Quảng Bình' in k)
    dc = {k.split(' – ')[0] for k in kq['dia_diem']}
    w(f'Có **{len(dc)} địa chỉ khác nhau** ({"; ".join(sorted(dc))}) và **{qb}/{len(ds)} tệp ghi tỉnh "Quảng Bình"** thay vì Quảng Trị '
      '(nhiều khả năng là địa danh trước hợp nhất tỉnh — chưa kiểm chứng; Quyết định này thuộc UBND tỉnh Quảng Trị).\n')
    w('| Địa điểm làm việc | Số tệp |\n|---|---|')
    for k, v in kq['dia_diem'].most_common():
        w(f'| {k} | {v} |')
    w('\n| Ngày bắt đầu thực hiện | Số tệp |\n|---|---|')
    for k, v in kq['ngay_bat_dau'].most_common():
        w(f'| {k} | {v} |')
    w('\n## 5. Khung năng lực: định dạng cấp độ\n')
    w(f'Cấp độ dạng khoảng, viết không thống nhất dấu cách (số dòng theo cách viết): {dict(kq["cap_do_dinh_dang"])}. '
      'Khi nạp CSDL cần tách thành hai số (`cap_tu`, `cap_den`).')
    w(f'Dòng cấp độ ghi bằng chữ thay vì số (dùng cho Tin học, Ngoại ngữ): {len(kq["cap_do_khong_dinh_dang"])} kiểu khác nhau.\n')
    return '\n'.join(L) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('docx_dir')
    ap.add_argument('qd_pdf')
    ap.add_argument('--ra', required=True)
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    dm = doc_danh_muc(a.qd_pdf)
    ds = [trich_docx(p) for p in sorted(glob.glob(os.path.join(a.docx_dir, '*.docx')))]
    kq = doi_chieu(ds, dm)
    os.makedirs(a.ra, exist_ok=True)
    with open(os.path.join(a.ra, 'danh-muc-vtvl.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['ma', 'ten', 'ngach', 'don_vi', 'nhom', 'dong'])
        w.writeheader()
        w.writerows(dm)
    with open(os.path.join(a.ra, 'doi-chieu-ban-mo-ta.md'), 'w', encoding='utf-8') as f:
        f.write(viet_bao_cao(ds, dm, kq, f'{len(ds)} tệp .docx và {os.path.basename(a.qd_pdf)}'))
    if a.json:
        with open(os.path.join(a.ra, 'ban-mo-ta.json'), 'w', encoding='utf-8') as f:
            json.dump(ds, f, ensure_ascii=False, indent=1)
    print(f'danh mục: {len(dm)} dòng / {len({r["ma"] for r in dm})} mã | bản mô tả: {len(ds)} tệp | thiếu: {kq["thieu_ban"]} | '
          f'mã nội dung sai: {len(kq["ma_noi_dung_sai"])} | tên lệch: {len(kq["ten_lech"])} | ngạch lệch: {len(kq["ngach_lech"])}')


if __name__ == '__main__':
    sys.exit(main())
