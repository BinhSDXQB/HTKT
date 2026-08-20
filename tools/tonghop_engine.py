# -*- coding: utf-8 -*-
"""
================================================================================
 ENGINE TONG HOP PHU LUC 1 - HA TANG KY THUAT
================================================================================
 Doc 24 file .xlsx cua cac phuong/xa trong D:\\Troly\\Tonghop
 -> Tong hop vao 1 file Excel duy nhat, chuan hoa cau truc + don vi tinh.

 NGUYEN TAC THIET KE (quan trong):
   1. Anh xa cot theo TEN TIEU DE (header), KHONG theo vi tri cot.
      -> Chong loi lech cot khi file nguon co so cot khac nhau.
   2. Chuan hoa DON VI TINH ve mot he thong nhat cho tung chi tieu.
   3. Bo qua dong TIEU DE NHOM (I, II, III...) vi thuong la dong TONG
      -> tranh cong trung (double counting).
   4. Ten Phuong/Xa lay tu TEN FILE (chuan 100%), khong lay tu noi dung.
   5. Moi hanh dong deu duoc ghi vao NHAT_KY / CANH_BAO de kiem tra nguoc.
================================================================================
"""
import os, re, glob, unicodedata, datetime, warnings
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

warnings.filterwarnings("ignore")

SRC_DIR = r"G:\My Drive\HTKT\Tonghop"
OUT_DIR = r"G:\My Drive\HTKT\Tong hop HTKT"
OUT_FILE = os.path.join(OUT_DIR, "PHU_LUC_1_TONGHOP_CHUAN.xlsx")

# ------------------------------------------------------------------ tien ich
def nfc(s):
    return unicodedata.normalize('NFC', s) if isinstance(s, str) else s

def norm(v):
    """Chuan hoa chuoi de so sanh: NFC + go dau khoang trang + chu thuong."""
    if v is None:
        return ''
    s = unicodedata.normalize('NFC', str(v))
    s = s.replace('\u00a0', ' ').replace('\n', ' ')
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return s

def key_hdr(v):
    """Khoa so sanh tieu de: bo dau cau, bo khoang trang."""
    s = norm(v)
    s = re.sub(r'[()\[\]{}.,;:/\\\-–—_*]', ' ', s)
    s = re.sub(r'\s+', '', s)
    return s

NUM_DOT = re.compile(r'^-?\d+(\.\d+)?$')
NUM_COMMA = re.compile(r'^-?\d+,\d+$')

def to_num(v):
    """Ep kieu so. Tra ve (gia_tri, da_sua_dinh_dang)."""
    if v is None or v == '':
        return None, False
    if isinstance(v, bool):
        return None, False
    if isinstance(v, (int, float)):
        return float(v), False
    s = str(v).strip().replace('\u00a0', ' ')
    s = re.sub(r'\s+', '', s)
    if NUM_DOT.match(s):
        return float(s), False
    if NUM_COMMA.match(s):
        return float(s.replace(',', '.')), True   # dau phay thap phan -> dau cham
    return None, False

# --- phat hien chu go bang bang ma cu (TCVN3/ABC, VNI) bi loi font ---
# Cac ky tu duoi day khong bao gio xuat hien trong tieng Viet Unicode dung chuan.
# (Da loai bo  °  ±  ²  ³  vi chung hop le: m2, do C...)
MARK_LEGACY = set('§¨©ª«¬­®¯´µ¶·¸¹»×ØÞßÐÑÆ')

def la_bang_ma_cu(s):
    """True neu chuoi nghi la go bang TCVN3/VNI bi loi font."""
    if not isinstance(s, str):
        return False
    n = sum(1 for ch in s if ch in MARK_LEGACY)
    return n >= 2 or (n == 1 and len(s) <= 6 and any(c.isalpha() and ord(c) < 128 for c in s))


ROMAN = re.compile(r'^(?:[IVXLC]+|[A-H])(?:\.\d+)*\.?$', re.IGNORECASE)
def is_section_stt(v):
    """STT dang I, II, III.1, A, B... -> dong tieu de nhom."""
    if v is None:
        return False
    s = str(v).strip()
    if not s or s.isdigit():
        return False
    if re.fullmatch(r'[IVXivx]+(\.\d+)*\.?', s):
        return True
    if re.fullmatch(r'[A-H]', s):
        return True
    return False

LEGEND = re.compile(r'^\(?\d+\)?$')
def is_legend_row(vals):
    """Dong chu thich so thu tu cot: (1) (2) (3) ..."""
    non = [str(v).strip() for v in vals if v not in (None, '')]
    if len(non) < 3:
        return False
    return all(LEGEND.match(x) for x in non)

# ------------------------------------------------- ten don vi hanh chinh
# Lay tu TEN FILE -> chuan 100%, khong phu thuoc noi dung ben trong.
TEN_DON_VI = {
    "PHỤ LỤC 1_ Xa Minh Hoá":      "Xã Minh Hóa",
    "PHỤ LỤC 1_Phường Ba Đồn":     "Phường Ba Đồn",
    "PHỤ LỤC 1_Phường Bắc Gianh":  "Phường Bắc Gianh",
    "PHỤ LỤC 1_Phường Nam Đông Hà":"Phường Nam Đông Hà",
    "PHỤ LỤC 1_Phường Quảng Trị":  "Phường Quảng Trị",
    "PHỤ LỤC 1_Phường Đông Hà":    "Phường Đông Hà",
    "PHỤ LỤC 1_Phường Đồng Hới":   "Phường Đồng Hới",
    "PHỤ LỤC 1_Phường Đồng Sơn":   "Phường Đồng Sơn",
    "PHỤ LỤC 1_Xã Cam Lộ":         "Xã Cam Lộ",
    "PHỤ LỤC 1_Xã Cửa Tùng":       "Xã Cửa Tùng",
    "PHỤ LỤC 1_Xã Cửa Việt":       "Xã Cửa Việt",
    "PHỤ LỤC 1_Xã Diên Sanh":      "Xã Diên Sanh",
    "PHỤ LỤC 1_Xã Hướng Hiệp":     "Xã Hướng Hiệp",
    "PHỤ LỤC 1_Xã Khe Sanh":       "Xã Khe Sanh",
    "PHỤ LỤC 1_Xã Lao Bảo":        "Xã Lao Bảo",
    "PHỤ LỤC 1_Xã Lệ Ninh":        "Xã Lệ Ninh",
    "PHỤ LỤC 1_Xã Lệ Thuỷ":        "Xã Lệ Thủy",
    "PHỤ LỤC 1_Xã Nam Gianh":      "Xã Nam Gianh",
    "PHỤ LỤC 1_Xã Nam Trạch":      "Xã Nam Trạch",
    "PHỤ LỤC 1_Xã Phong Nha":      "Xã Phong Nha",
    "PHỤ LỤC 1_Xã Quảng Ninh":     "Xã Quảng Ninh",
    "PHỤ LỤC 1_Xã Triệu phong":    "Xã Triệu Phong",
    "PHỤ LỤC 1_Xã Vĩnh Linh":      "Xã Vĩnh Linh",
    "PHỤ LỤC 1_Xã Đồng Lê":        "Xã Đồng Lê",
}

# ------------------------------------------------------------ dinh nghia bieu
# moi truong: (ma_truong, nhan_hien_thi, kieu, [cac bi danh tieu de])
#   kieu: 'txt' | 'num' | 'int' | 'year'
BIEU = {}

BIEU['DUONG'] = dict(
    sheet="01_Đường giao thông",
    tieu_de="BIỂU MẪU 01: TỔNG HỢP ĐƯỜNG GIAO THÔNG ĐÔ THỊ",
    ten_col='ten',
    fields=[
        ('ten',     'Tên đường',                 'txt', ['tênđường', 'tuyếnđường', 'tênđườngphố']),
        ('dd',      'Điểm đầu (Lý trình)',       'txt', ['điểmđầulýtrình', 'điểmđầu']),
        ('dc',      'Điểm cuối (Lý trình)',      'txt', ['điểmcuốilýtrình', 'điểmcuối']),
        ('dai',     'Chiều dài tuyến (km)',      'num', ['chiềudàituyếnkm', 'chiềudàituyến']),
        ('w_nen',   'Nền đường (m)',             'num', ['nềnđường', 'chiềurộnghiệntrạngm']),
        ('w_mat',   'Mặt đường (m)',             'num', ['mặtđường']),
        ('w_ht',    'Hè/lề trái (m)',            'num', ['hèđườnghoặclềtrái', 'hètrái']),
        ('w_hp',    'Hè/lề phải (m)',            'num', ['hèđườnghoặclềphải', 'hèphải']),
        ('w_dpc',   'Dải phân cách (m)',         'num', ['giảiphâncách', 'dảiphâncách']),
        ('ket_cau', 'Kết cấu mặt đường',         'txt', ['kếtcấumặtđường']),
        ('gc',      'Ghi chú',                   'txt', ['ghichú']),
    ],
    numeric_sum=['dai'],
)

BIEU['DIEN'] = dict(
    sheet="02_Điện chiếu sáng",
    tieu_de="BIỂU MẪU 02: TỔNG HỢP HỆ THỐNG ĐIỆN CHIẾU SÁNG",
    ten_col='ten',
    fields=[
        ('ten',   'Tuyến đường',                'txt', ['tuyếnđường', 'tuyếnđườngchiếusáng', 'tênđường', 'tuyến']),
        ('dai',   'Chiều dài chiếu sáng (km)',  'num', ['chiềudàichiếusángkm', 'chiềudàikm', 'chiềudàichiếusáng', 'chiềudài']),
        ('so_cot','Số cột đèn (cột)',           'int', ['sốcộtđèntoàntuyến', 'sốcột', 'sốcộtđèn']),
        ('so_bong','Số bóng đèn (bóng)',        'int', ['sốlượngbóngđèntoàntuyến', 'sốbóngđèn', 'sốlượngbóngđèn']),
        ('loai',  'Loại đèn',                   'txt', ['loạiđèn']),
        ('cs',    'Công suất (W)',              'num', ['côngsuấtw', 'côngsuấtkw', 'côngsuất']),
        ('ben',   'Chiếu sáng 1 bên/2 bên',     'txt', ['chiếusáng1bên2bên', 'chiếusáng1bên2bêngiữa']),
        ('nam',   'Năm đầu tư',                 'year',['nămđầutư', 'nămđưavàosửdụng']),
        ('gc',    'Ghi chú',                    'txt', ['ghichú']),
    ],
    numeric_sum=['dai', 'so_cot', 'so_bong'],
)

BIEU['THOAT'] = dict(
    sheet="03_Thoát nước",
    tieu_de="BIỂU MẪU 03: TỔNG HỢP HỆ THỐNG THOÁT NƯỚC MƯA VÀ NƯỚC THẢI",
    ten_col='ten',
    fields=[
        ('ten',  'Tuyến',                      'txt', ['tuyến', 'têntuyếncốngđường', 'tuyếnđường', 'tênđường',
                                                       'têntuyếnđường', 'têntuyến', 'tuyếncống', 'têntuyếncống']),
        ('dd',   'Điểm đầu',                   'txt', ['điểmđầu', 'điểmđầulýtrình']),
        ('dc',   'Điểm cuối',                  'txt', ['điểmcuối', 'điểmcuốilýtrình']),
        ('loai', 'Nước mưa/nước thải',         'txt', ['nướcmưanướcthải']),
        ('dai',  'Tổng chiều dài (m)',         'num', ['tổngchiềudàituyếnthoátnướcm', 'tổngchiềudàituyếnthoátnướckm',
                                                       'tổngchiềudàikm', 'tổngchiềudàim', 'tổngchiềudài', 'chiềudàim']),
        ('phia', '1 phía/2 phía',              'txt', ['1phía2phía']),
        ('kt',   'Cống tròn/hộp/rãnh (KT)',    'txt', ['cốngtròncốnghộprãnhkíchthước', 'kíchthước']),
        ('nam',  'Năm đưa vào sử dụng',        'year',['nămđưavàosửdụng', 'nămđầutư']),
        ('gc',   'Ghi chú',                    'txt', ['ghichú']),
    ],
    numeric_sum=['dai'],
)

BIEU['CAY'] = dict(
    sheet="04_Cây xanh đường phố",
    tieu_de="BIỂU MẪU 04: TỔNG HỢP HỆ THỐNG CÂY XANH ĐƯỜNG PHỐ",
    ten_col='ten',
    fields=[
        ('ten',  'Tuyến',            'txt', ['tuyến', 'tuyếnđường', 'tênđường', 'têntuyến', 'têntuyếnđường',
                                             'cáctuyếnđườngđãđặttên', 'tênđườngphố']),
        ('dd',   'Điểm đầu',         'txt', ['điểmđầu', 'điểmđầulýtrình']),
        ('dc',   'Điểm cuối',        'txt', ['điểmcuối', 'điểmcuốilýtrình']),
        ('sl',   'Số lượng cây (cây)','int',['sốlượngcâycây', 'sốlượngcây']),
        ('phia', '1 phía/2 phía',    'txt', ['1phía2phía']),
        ('chung','Chủng loại cây',   'txt', ['chủngloạicây']),
        ('gc',   'Ghi chú',          'txt', ['ghichú']),
    ],
    numeric_sum=['sl'],
)

BIEU['CONGVIEN'] = dict(
    sheet="05_Công viên - Quảng trường",
    tieu_de="BIỂU MẪU 05: TỔNG HỢP CÂY XANH CÔNG VIÊN, QUẢNG TRƯỜNG",
    ten_col='ten',
    fields=[
        ('ten',  'Tên công viên/quảng trường', 'txt', ['têncôngviênquảngtrường', 'têncôngviên']),
        ('vt',   'Vị trí',                     'txt', ['vịtrí', 'địachỉ', 'địađiểm']),
        ('dt',   'Diện tích (m2)',             'num', ['diệntíchm2', 'diệntích']),
        ('dtco', 'Diện tích thảm cỏ (m2)',     'num', ['diệntíchthảmcỏm2', 'diệntíchthảmcỏthảmviềnhoam2', 'diệntíchthảmcỏ']),
        ('sl',   'Số lượng cây (cây)',         'int', ['sốlượngcâycây', 'sốlượngcâybóngmátcây', 'sốlượngcây']),
        ('chung','Chủng loại cây',             'txt', ['chủngloạicây']),
        ('gc',   'Ghi chú',                    'txt', ['ghichú']),
    ],
    numeric_sum=['dt', 'dtco', 'sl'],
)

BIEU['CAPNUOC'] = dict(
    sheet="06_Cấp nước",
    tieu_de="BIỂU MẪU 06: ĐỀ XUẤT KHU VỰC NGƯỜI DÂN CÓ NHU CẦU CẤP NƯỚC SẠCH",
    ten_col='ten',
    fields=[
        ('ten',  'Tuyến đường/Khu vực',   'txt', ['tuyếnđường', 'thôn', 'khuvực']),
        ('dc',   'Địa chỉ',               'txt', ['địachỉ']),
        ('ho',   'Số hộ gia đình (hộ)',   'int', ['sốhộgiađìnhhộ', 'sốhộgiađình', 'sốhộ']),
        ('ht',   'Hiện trạng sử dụng nước','txt',['hiệntrạngsửdụngnước']),
        ('dk',   'Dự kiến nguồn nước',    'txt', ['dựkiếnnguồnnước']),
        ('gc',   'Ghi chú',               'txt', ['ghichú']),
    ],
    numeric_sum=['ho'],
)

BIEU['BAIXE'] = dict(
    sheet="07_Bãi đỗ xe",
    tieu_de="BIỂU MẪU 07: TỔNG HỢP HỆ THỐNG BÃI ĐỖ XE",
    ten_col='ten',
    fields=[
        ('ten', 'Tên bãi đỗ xe',            'txt', ['bãiđổxe', 'bãiđỗxe', 'tênbãiđỗxe']),
        ('dd',  'Địa điểm',                 'txt', ['địađiểm', 'vịtrí', 'địachỉ']),
        ('dt',  'Diện tích (m2)',           'num', ['diệntíchm2', 'diệntích']),
        ('sv',  'Số vị trí đỗ (vị trí)',    'int', ['sốvịtríđỗ', 'sốvịtrí']),
        ('sac', 'Trạm sạc xe điện (Có/Không)','txt',['trạmsạchxeđiệncókhông', 'trạmsạcxeđiệncókhông', 'trạmsạcxeđiện']),
        ('gc',  'Ghi chú',                  'txt', ['ghichú']),
    ],
    numeric_sum=['dt', 'sv'],
)

# sheet nguon (da chuan hoa) -> ma bieu
SHEET_MAP = {
    'duonggtt': 'DUONG',
    'đườnggtt': 'DUONG',      # bien the go dau tieng Viet (Phuong Dong Son)
    'đuonggtt': 'DUONG',
    'điệnchiếusáng': 'DIEN',
    'điệnchiếusángnđh': 'DIEN',
    'thoátnướcmưavàthải': 'THOAT',
    'thoatnươcmưavàthải': 'THOAT',
    'câyxanh': 'CAY',
    'câyxanhnđh': 'CAY',
    'côngviên': 'CONGVIEN',
    'cấpnước': 'CAPNUOC',
    'bãiđổxe': 'BAIXE',
}

# Voi file Nam Dong Ha: 1 bang rong 31 cot gop 3 bieu.
# Banner dong 2 danh dau ranh gioi khoi -> chi tim cot trong pham vi khoi.
BANNER = {'điệnchiếusáng': 'DIEN', 'thoátnướcmưavàthải': 'THOAT', 'câyxanh': 'CAY'}


# ============================================================== doc 1 sheet
class Log:
    def __init__(self):
        self.nhat_ky = []   # [thoi_gian, don_vi, file, sheet, dong, loai, noi_dung]
        self.canh_bao = []  # [muc_do, don_vi, bieu, dong_nguon, van_de, gia_tri, xu_ly]

    def nk(self, dv, f, sh, dong, loai, nd):
        self.nhat_ky.append([datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                             dv, f, sh, dong, loai, nd])

    def cb(self, muc, dv, bieu, dong, vande, giatri, xuly):
        self.canh_bao.append([muc, dv, bieu, dong, vande, giatri, xuly])

LOG = Log()

# So lieu don vi TU KHAI (lay tu dong TONG/CONG hoac tong cac nhom cap 1 cua nguon)
#   KHAI_BAO[code][don_vi][fid] = gia tri khai bao  -> dung de DOI SOAT chong trung.
KHAI_BAO = {k: {} for k in BIEU}
DOI_SOAT = []       # [don_vi, bieu, chi_tieu, S_chi_tiet, S_khai_bao, ty_le, nhan_dinh]
DOI_SOAT_GIS = []   # [don_vi, S_chi_tiet, S_khai_bao, GIS_diaphuong, GIS_tong, muc_do, nhan_dinh, de_nghi]
GIS_FILE = os.path.join(OUT_DIR, "GIS_CHIEU_DAI_THEO_DON_VI.json")

def _key_ten(s):
    """Khoa so sanh ten don vi (bo dau thanh) - trung voi gis_do_chieu_dai.py."""
    s = unicodedata.normalize('NFD', str(s))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('đ', 'd').replace('Đ', 'D')
    return ' '.join(s.lower().split())

def load_gis():
    """Nap ket qua do chieu dai GIS (neu da chay gis_do_chieu_dai.py)."""
    try:
        import json as _json
        return {_key_ten(k): v for k, v in _json.load(open(GIS_FILE, encoding='utf-8')).items()}
    except Exception:
        return {}

RM_L1 = re.compile(r'^[IVXLC]+\.?$', re.IGNORECASE)   # so La Ma cap 1: I, II, III (khong co .1)
def is_level1_roman(v):
    if v is None:
        return False
    return bool(RM_L1.fullmatch(str(v).strip()))


def merged_value(ws, r, c, mmap):
    v = ws.cell(r, c).value
    if v not in (None, ''):
        return v
    a = mmap.get((r, c))
    return ws.cell(a[0], a[1]).value if a else None


def build_merge_map(ws):
    m = {}
    for rng in ws.merged_cells.ranges:
        for rr in range(rng.min_row, rng.max_row + 1):
            for cc in range(rng.min_col, rng.max_col + 1):
                m[(rr, cc)] = (rng.min_row, rng.min_col)
    return m


SUB_KEYS = {'nềnđường', 'mặtđường', 'hèđườnghoặclềtrái', 'hèđườnghoặclềphải',
            'giảiphâncách', 'dảiphâncách', 'cốngtròn', 'cốnghộp', 'cốngxây'}

def find_header(ws, spec, mmap, max_scan=14):
    """Tim dong tieu de CHINH: cham diem theo so bi danh khop tren chinh dong do.

    - Khong tinh cac tieu de phu (Nen duong / Mat duong / Cong tron ...) de dong
      phu tieu de khong bi nham thanh dong tieu de chinh.
    - Cong diem thuong neu dong co o 'STT'/'TT'.
    - Hoa diem thi lay dong TREN truoc.
    """
    aliases = set()
    for _, _, _, al in spec['fields']:
        aliases.update(al)
    main_alias = aliases - SUB_KEYS
    best, best_n = None, 0
    for r in range(1, min(max_scan, ws.max_row) + 1):
        n, co_stt = 0, False
        for c in range(1, ws.max_column + 1):
            h = key_hdr(ws.cell(r, c).value)
            if h in ('stt', 'tt'):
                co_stt = True
            if h and h in main_alias:
                n += 1
        if n:
            n += 2 if co_stt else 0
        if n > best_n:
            best, best_n = r, n
    return (best, best_n) if best_n >= 3 else (None, best_n)


def block_range(ws, target, mmap):
    """Voi bang rong (Nam Dong Ha): xac dinh pham vi cot cua tung khoi bieu."""
    banners = []
    for r in (1, 2, 3):
        for c in range(1, ws.max_column + 1):
            v = ws.cell(r, c).value
            k = key_hdr(v)
            if k in BANNER:
                banners.append((c, BANNER[k]))
    if len(banners) < 2:
        return None
    banners.sort()
    for i, (c, code) in enumerate(banners):
        if code == target:
            end = banners[i + 1][0] - 1 if i + 1 < len(banners) else ws.max_column
            return (c, end)
    return None


def read_sheet(path, ws, code, don_vi, mmap):
    """Doc 1 sheet nguon -> list dict ban ghi."""
    spec = BIEU[code]
    fname = os.path.basename(path)
    declared = {}   # fid -> {'grand': None, 'groups': 0.0}  so lieu don vi tu khai
    hrow, nmatch = find_header(ws, spec, mmap)
    if not hrow:
        LOG.nk(don_vi, fname, ws.title, '', 'BO QUA', f'Khong nhan dien duoc tieu de (khop {nmatch})')
        return [], declared

    # co phai bang rong gop nhieu bieu khong?
    brange = block_range(ws, code, mmap)

    # dong phu tieu de (Nen duong / Mat duong / Cong tron ...)
    has_sub = False
    if hrow + 1 <= ws.max_row:
        has_sub = any(key_hdr(ws.cell(hrow + 1, c).value) in SUB_KEYS
                      for c in range(1, ws.max_column + 1))

    # --- anh xa cot theo TEN tieu de ---
    colmap = {}
    unit_fix = {}          # ma_truong -> he so quy doi don vi
    for c in range(1, ws.max_column + 1):
        if brange and c > 2 and not (brange[0] <= c <= brange[1]):
            continue      # ngoai pham vi khoi -> bo qua (tru cot 1,2 dung chung)
        cands = []
        h1 = key_hdr(merged_value(ws, hrow, c, mmap))
        cands.append(h1)
        if has_sub:
            cands.append(key_hdr(ws.cell(hrow + 1, c).value))
        raw1 = norm(merged_value(ws, hrow, c, mmap))
        for fid, _, _, al in spec['fields']:
            if fid in colmap:
                continue
            for cand in cands:
                if cand and cand in al:
                    colmap[fid] = c
                    # ---- phat hien don vi tinh trong tieu de ----
                    raw = raw1 + ' ' + norm(ws.cell(hrow + 1, c).value)
                    if fid == 'dai' and code == 'THOAT':
                        if '(km' in raw or ' km' in raw or raw.endswith('km'):
                            unit_fix[fid] = 1000.0
                            LOG.cb('THONG TIN', don_vi, spec['sheet'], f'cot {c}',
                                   'Đơn vị nguồn là KM trong khi biểu chuẩn dùng M',
                                   raw.strip(), 'Đã tự động nhân 1.000 để quy về mét')
                    if fid == 'cs' and code == 'DIEN':
                        if 'kw' in raw.replace(' ', ''):
                            unit_fix[fid] = 1000.0
                            LOG.cb('THONG TIN', don_vi, spec['sheet'], f'cot {c}',
                                   'Công suất ghi bằng kW trong khi biểu chuẩn dùng W',
                                   raw.strip(), 'Đã tự động nhân 1.000 để quy về W')
                    break

    # --- DU PHONG: khong khop duoc cot ten -> lay cot chu dau tien sau cot STT ---
    if spec['ten_col'] not in colmap:
        da_dung = set(colmap.values())
        lo, hi = (brange if brange else (1, ws.max_column))
        for c in list(range(2, min(hi, ws.max_column) + 1)):
            if c in da_dung:
                continue
            h = merged_value(ws, hrow, c, mmap)
            if h in (None, '') or key_hdr(h) in ('stt', 'tt'):
                continue
            colmap[spec['ten_col']] = c
            LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'cột {c}',
                   'Tiêu đề cột tên/tuyến không có trong danh mục bí danh',
                   nfc(str(h)).strip()[:120],
                   f'Đã tự động lấy cột {c} làm cột Tên/Tuyến (cột chữ đầu tiên sau STT)')
            break
    if spec['ten_col'] not in colmap:
        LOG.nk(don_vi, fname, ws.title, hrow, 'BO QUA', 'Khong tim thay cot ten/tuyen')
        return [], declared

    # canh bao khi nguon gop chung chieu rong (khong tach 5 thanh phan)
    if code == 'DUONG' and not has_sub and 'w_nen' in colmap:
        LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'cot {colmap["w_nen"]}',
               'Nguồn chỉ có 1 cột "Chiều rộng hiện trạng (m)", không tách nền/mặt/hè',
               '', 'Đã đưa vào cột "Nền đường (m)"; các cột còn lại để trống')

    # cot STT de nhan dien dong tieu de nhom
    stt_col = None
    for c in range(1, ws.max_column + 1):
        if key_hdr(ws.cell(hrow, c).value) in ('stt', 'tt'):
            stt_col = c
            break
    if stt_col is None:
        stt_col = 1

    recs = []
    nhom = ''
    prev_ten = ''
    start = hrow + (2 if has_sub else 1)
    for r in range(start, ws.max_row + 1):
        raw_all = [ws.cell(r, c).value for c in range(1, ws.max_column + 1)]
        if all(v in (None, '') for v in raw_all):
            continue
        if is_legend_row(raw_all):
            LOG.nk(don_vi, fname, ws.title, r, 'BO QUA', 'Dong chu thich so cot (1)(2)(3)')
            continue

        sttv = ws.cell(r, stt_col).value
        tenv = ws.cell(r, colmap[spec['ten_col']]).value

        # dong tieu de nhom (I, II, III...) -> thuong la dong TONG, khong lay lam du lieu
        if is_section_stt(sttv):
            nhom = nfc(str(tenv).strip()) if tenv not in (None, '') else nhom
            l1 = is_level1_roman(sttv)   # chi cong tong cua nhom CAP 1 (I, II, III) -> tranh cong trung ben khai bao
            sonums = []
            for fid in spec['numeric_sum']:
                if fid in colmap:
                    n, _ = to_num(ws.cell(r, colmap[fid]).value)
                    if n:
                        sonums.append(f'{dict(( (f[0],f[1]) for f in spec["fields"] ))[fid]}={n:g}')
                        if l1:
                            declared.setdefault(fid, {'grand': None, 'groups': 0.0})
                            declared[fid]['groups'] += n * unit_fix.get(fid, 1.0)
            LOG.nk(don_vi, fname, ws.title, r, 'NHOM', f'Tieu de nhom: {nhom}')
            if sonums:
                LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                       f'Dòng tiêu đề nhóm "{nhom}" có số liệu (nghi là dòng TỔNG)',
                       '; '.join(sonums), 'Đã LOẠI khỏi dữ liệu chi tiết để tránh cộng trùng')
            continue

        # dong vi du mau
        gcv = norm(ws.cell(r, colmap['gc']).value) if 'gc' in colmap else ''
        if 'ví dụ' in gcv or norm(tenv).startswith('vd:'):
            LOG.nk(don_vi, fname, ws.title, r, 'BO QUA', 'Dong vi du mau (VD/Vi du)')
            continue

        # dong TONG/CONG nam giua bang -> loai de tranh cong trung
        tn = norm(tenv)
        if re.match(r'^(cộng|tổng|tổng cộng|cong|tong)\b', tn) or tn in ('cộng:', 'tổng:'):
            # Giu lai gia tri lam SO KHAI BAO TONG THE (grand): tong cong lon nhat cua don vi.
            for fid in spec['numeric_sum']:
                if fid in colmap:
                    n, _ = to_num(ws.cell(r, colmap[fid]).value)
                    if n:
                        # Dong tong la so gop toan don vi -> ap he so quy doi don vi (km->m),
                        # KHONG dung nguong >100 (nguong do chi danh cho gia tri tung tuyen).
                        n *= unit_fix.get(fid, 1.0)
                        d = declared.setdefault(fid, {'grand': None, 'groups': 0.0})
                        d['grand'] = n if d['grand'] is None else max(d['grand'], n)
            LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                   'Dòng TỔNG/CỘNG nằm trong bảng dữ liệu', nfc(str(tenv)).strip()[:100],
                   'Đã LOẠI khỏi dữ liệu chi tiết; giá trị được giữ để ĐỐI SOÁT chống trùng')
            continue

        rec = {'don_vi': don_vi, 'nhom': nhom, '_src': f'{fname}|{ws.title}|r{r}'}
        co_dl = False
        co_chu = False      # dong co it nhat 1 o CHU -> moi duoc ke thua ten tuyen
        for fid, nhan, kieu, _ in spec['fields']:
            c = colmap.get(fid)
            v = ws.cell(r, c).value if c else None
            if v in (None, ''):
                rec[fid] = None
                continue
            if kieu in ('num', 'int'):
                n, fixed = to_num(v)
                if n is None:
                    # gia tri chu trong cot so -> day sang Ghi chu, canh bao
                    LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                           f'Cột số "{nhan}" chứa chữ', str(v).strip()[:120],
                           'Giữ nguyên nội dung ở cột Ghi chú, ô số để trống')
                    rec[fid] = None
                    rec['gc'] = ((rec.get('gc') or '') + f' [{nhan}: {str(v).strip()}]').strip()
                    co_dl = True
                    continue
                if fixed:
                    LOG.cb('DA SUA', don_vi, spec['sheet'], f'dòng {r}',
                           f'Số ghi dạng chữ, dấu phẩy thập phân ở "{nhan}"',
                           str(v).strip(), f'Đã chuyển thành số {n:g}')
                # --- QUY DOI DON VI (kiem tra trUOC khi nhan he so) ---
                if fid in unit_fix:
                    # Tieu de ghi KM nhung gia tri qua lon -> thuc te dang nhap bang MET.
                    # Mot tuyen thoat nuoc cap phuong/xa khong the dai > 100 km.
                    if code == 'THOAT' and fid == 'dai' and n > 100:
                        LOG.cb('DA SUA', don_vi, spec['sheet'], f'dòng {r}',
                               'Tiêu đề cột ghi (Km) nhưng giá trị > 100 → thực tế đang nhập bằng MÉT',
                               f'{n:g}', 'Giữ nguyên số (coi là mét), KHÔNG nhân 1.000')
                    else:
                        n = n * unit_fix[fid]
                # Cong suat den: chi quy doi khi 0 < n < 1 (chac chan la kW, vd 0,15 kW = 150 W).
                # Gia tri 1..10 KHONG tu quy doi (de tranh sua nham so lieu dem) - chi canh bao.
                if code == 'DIEN' and fid == 'cs' and fid not in unit_fix:
                    if 0 < n < 1:
                        LOG.cb('DA SUA', don_vi, spec['sheet'], f'dòng {r}',
                               'Công suất < 1 tuy tiêu đề ghi (W) → thực chất nhập bằng kW',
                               f'{n:g}', f'Đã quy đổi thành {n*1000:g} W')
                        n = n * 1000
                    elif 1 <= n < 20:
                        LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                               'Công suất bất thường (1–20 W), nghi nhập nhầm số cột đèn',
                               f'{n:g}', 'GIỮ NGUYÊN, đề nghị đơn vị xác minh lại')
                # --- Canh bao gia tri bat thuong (khong tu sua, chi de nghi xac minh) ---
                if code == 'DUONG' and fid == 'dai' and n > 50:
                    LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                           'Chiều dài 1 tuyến đường > 50 km (nghi là dòng gộp nhiều tuyến)',
                           f'{n:g} km', 'GIỮ NGUYÊN, đề nghị đơn vị xác minh lại')
                if code == 'THOAT' and fid == 'dai' and n > 20000:
                    LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                           'Chiều dài 1 tuyến thoát nước > 20.000 m (nghi là dòng gộp)',
                           f'{n:g} m', 'GIỮ NGUYÊN, đề nghị đơn vị xác minh lại')
                if kieu == 'int':
                    n = int(round(n))
                rec[fid] = n
                co_dl = True
            elif kieu == 'year':
                n, _ = to_num(v)
                if n and 1900 <= n <= 2100:
                    rec[fid] = int(n)
                else:
                    rec[fid] = nfc(str(v).strip())
                co_dl = True
            else:
                s = nfc(str(v)).strip()
                s = re.sub(r'[ \t]+', ' ', s)
                if la_bang_ma_cu(s):
                    LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                           f'Ô "{nhan}" gõ bằng bảng mã cũ (TCVN3/ABC), hiển thị sai',
                           s[:120],
                           'GIỮ NGUYÊN văn bản gốc (không tự chuyển để tránh sai). '
                           'Đề nghị dùng Unikey → "Công cụ" → chuyển TCVN3 sang Unicode tại file nguồn')
                rec[fid] = s if s else None
                if s:
                    co_dl = True
                    co_chu = True

        if not co_dl:
            continue
        # Ke thua ten tuyen cho dong tiep theo cua cung mot tuyen.
        # Chi ke thua khi dong co it nhat 1 o CHU (diem dau/cuoi, loai, kich thuoc...).
        # Dong chi toan CON SO, khong co chu -> thuong la o tong roi rac -> loai bo.
        if not rec.get('ten'):
            if prev_ten and co_chu:
                rec['ten'] = prev_ten
                LOG.nk(don_vi, fname, ws.title, r, 'KE THUA', f'Bo trong ten -> ke thua "{prev_ten}"')
            else:
                sos = [f'{f[1]}={rec[f[0]]:g}' for f in spec['fields']
                       if f[0] in spec['numeric_sum'] and isinstance(rec.get(f[0]), (int, float))]
                if sos:
                    LOG.cb('CAN KIEM TRA', don_vi, spec['sheet'], f'dòng {r}',
                           'Dòng chỉ có số, không có tên đối tượng (nghi là ô tổng rời rạc)',
                           '; '.join(sos), 'Đã LOẠI khỏi dữ liệu chi tiết')
                LOG.nk(don_vi, fname, ws.title, r, 'BO QUA', 'Khong co ten tuyen/doi tuong')
                continue
        else:
            prev_ten = rec['ten']
        recs.append(rec)
    LOG.nk(don_vi, fname, ws.title, '', 'DA DOC', f'{len(recs)} dong du lieu -> {spec["sheet"]}')
    return recs, declared


# ================================================================== chay
def main():
    files = sorted(glob.glob(os.path.join(SRC_DIR, '*.xlsx')))
    data = {k: [] for k in BIEU}
    seen = {k: set() for k in BIEU}
    don_vi_list = []

    for path in files:
        stem = os.path.splitext(os.path.basename(path))[0]
        don_vi = TEN_DON_VI.get(nfc(stem))
        if not don_vi:
            don_vi = nfc(stem).split('_', 1)[-1].strip()
            LOG.cb('CAN KIEM TRA', don_vi, '-', '-', 'Tên file không có trong bảng danh mục đơn vị',
                   stem, 'Tạm lấy theo tên file')
        don_vi_list.append(don_vi)
        wb = openpyxl.load_workbook(path, data_only=True)
        used = set()
        for ws in wb.worksheets:
            if ws.sheet_state != 'visible':
                continue
            code = SHEET_MAP.get(key_hdr(ws.title))
            if not code:
                LOG.nk(don_vi, os.path.basename(path), ws.title, '', 'BO QUA', 'Sheet khong thuoc bieu mau nao')
                continue
            # Nam Dong Ha: sheet 'DUONG GT (T)' rong chi lay phan DUONG
            mmap = build_merge_map(ws)
            recs, declared = read_sheet(path, ws, code, don_vi, mmap)
            if declared:
                kb = KHAI_BAO[code].setdefault(don_vi, {})
                for fid, d in declared.items():
                    # So tong THAT cua don vi luon la so lon nhat trong {Tong cong, Sum(nhom cap 1)}
                    cands = [x for x in (d['grand'], d['groups']) if x]
                    val = max(cands) if cands else None
                    if val:
                        kb[fid] = val if fid not in kb else max(kb[fid], val)
            if not recs:
                LOG.cb('THIEU DU LIEU', don_vi, BIEU[code]['sheet'], ws.title,
                       'Đơn vị CÓ biểu mẫu nhưng KHÔNG có dòng dữ liệu nào', '',
                       'Cần đề nghị đơn vị kê khai bổ sung')
            for rec in recs:
                sig = (don_vi, code,
                       norm(rec.get('ten')), norm(rec.get('dd')), norm(rec.get('dc')),
                       tuple(rec.get(f) for f in BIEU[code]['numeric_sum']))
                if sig in seen[code]:
                    LOG.cb('TRUNG LAP', don_vi, BIEU[code]['sheet'], rec['_src'],
                           'Bản ghi trùng hoàn toàn với dòng đã có', norm(rec.get('ten'))[:80],
                           'Đã bỏ qua, chỉ giữ 1 bản')
                    continue
                seen[code].add(sig)
                data[code].append(rec)
            used.add(code)
        for code in BIEU:
            if code not in used:
                LOG.cb('THIEU DU LIEU', don_vi, BIEU[code]['sheet'], '-',
                       'File nguồn KHÔNG có biểu mẫu này', '',
                       'Cần đề nghị đơn vị kê khai bổ sung')
        wb.close()

    khu_tong_an(data)                    # Lop 5: khu dong TONG an bang kiem dinh so hoc
    dung_doi_soat(data)                  # Lop 6: bang DOI SOAT chung minh khong cong trung
    dung_doi_soat_gis(data)              # Lop 7: doi soat 3 nguon voi chieu dai GIS thuc te
    xuat_khai_bao_json()                 # (dong) xuat so tu khai -> seed ward_khai_bao
    xuat_geojson_canh_bao()              # (a) to mau ranh don vi len ban do theo muc do
    xuat(data, sorted(set(don_vi_list)))


# ==================== (dong) Xuat so KHAI BAO -> seed ward_khai_bao =============
KHAIBAO_JSON = os.path.join(OUT_DIR, "KHAI_BAO.json")
# map ma bieu + fid engine -> (linhVuc, chiTieu khop field Prisma report_*, don vi)
KB_MAP = {
    'DUONG':    {'dai': ('DUONG', 'chieuDaiKm', 'km')},
    'DIEN':     {'dai': ('DIEN_CS', 'chieuDaiCSKm', 'km'), 'so_cot': ('DIEN_CS', 'soColDen', 'cột')},
    'THOAT':    {'dai': ('THOAT_NUOC', 'chieuDaiM', 'm')},
    'CAY':      {'sl': ('CAY_XANH', 'soLuongCay', 'cây')},
    'CONGVIEN': {'dt': ('CONG_VIEN', 'dienTichM2', 'm2'), 'dtco': ('CONG_VIEN', 'dienTichThamCoM2', 'm2'),
                 'sl': ('CONG_VIEN', 'soLuongCay', 'cây')},
    'CAPNUOC':  {'ho': ('CAP_NUOC', 'soHoGiaDinh', 'hộ')},
    'BAIXE':    {'dt': ('BAI_DO_XE', 'dienTichM2', 'm2'), 'sv': ('BAI_DO_XE', 'soViTriDo', 'vị trí')},
}

def xuat_khai_bao_json():
    """Ghi so don vi tu khai (grand/tong nhom cap 1) ra JSON de seeder nap ward_khai_bao.
    Cau truc: { key_ten(don_vi): [ {linhVuc, chiTieu, giaTri, donVi}, ... ] }"""
    import json as _json
    out = {}
    for code, per in KHAI_BAO.items():
        for dv, fids in per.items():
            k = _key_ten(dv)
            for fid, val in fids.items():
                m = KB_MAP.get(code, {}).get(fid)
                if not m or not val:
                    continue
                out.setdefault(k, {'ten': dv, 'items': []})
                out[k]['items'].append({'linhVuc': m[0], 'chiTieu': m[1],
                                        'giaTri': round(val, 3), 'donVi': m[2]})
    _json.dump(out, open(KHAIBAO_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'  DA GHI KHAI_BAO.json: {len(out)} don vi -> {KHAIBAO_JSON}')


# ============================ (a) GeoJSON canh bao so hoa cho ban do ============
ADMIN_GEOJSON = r"C:\Troly\HTKT\app\public\data\admin-boundaries.geojson"
CANHBAO_GEOJSON = r"C:\Troly\HTKT\app\public\data\canh-bao-so-hoa.geojson"
MAU_MUC = {'NGHIÊM TRỌNG': '#ef4444', 'CẢNH BÁO': '#f97316',
           'LƯU Ý': '#eab308', 'ĐẠT': '#22c55e'}

def xuat_geojson_canh_bao():
    """Ghi ranh cac don vi (da khop DOI SOAT GIS) kem thuoc tinh + mau theo muc do,
    de ban do app hien thi lop 'Canh bao so hoa' - chuyen vien khoanh vung can cap nhat."""
    import json as _json
    try:
        admin = _json.load(open(ADMIN_GEOJSON, encoding='utf-8'))
    except Exception as e:
        print('  (bo qua GeoJSON canh bao - khong doc duoc admin-boundaries):', e)
        return
    idx = {_key_ten(r[0]): r for r in DOI_SOAT_GIS}
    feats = []
    for f in admin.get('features', []):
        p = f.get('properties', {})
        ten = p.get('fullName') or p.get('name') or ''
        r = idx.get(_key_ten(ten))
        if not r:
            continue   # chi giu 24 don vi da co so lieu doi soat
        dv, s_chi, s_khai, gdp, gt, muc, nd, de = r
        thieu = round((s_chi or 0) - (gt or 0), 1)
        feats.append({
            'type': 'Feature',
            'geometry': f['geometry'],
            'properties': {
                'donVi': dv, 'mucDo': muc, 'mau': MAU_MUC.get(muc, '#94a3b8'),
                'chiTiet': s_chi, 'khaiBao': s_khai, 'gisDiaPhuong': gdp, 'gisTong': gt,
                'thieuSoVoiBanDo': thieu, 'nhanDinh': nd, 'deNghi': de,
                'code': p.get('code', ''), 'bbox': p.get('bbox', None),
            },
        })
    order = {'NGHIÊM TRỌNG': 0, 'CẢNH BÁO': 1, 'LƯU Ý': 2, 'ĐẠT': 3}
    feats.sort(key=lambda x: order.get(x['properties']['mucDo'], 9))
    out = {'type': 'FeatureCollection',
           'meta': {'nguon': 'tonghop_engine.py - DOI SOAT GIS',
                    'ngay': datetime.date.today().strftime('%d/%m/%Y'),
                    'soDonVi': len(feats)},
           'features': feats}
    _json.dump(out, open(CANHBAO_GEOJSON, 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'  DA GHI GeoJSON canh bao so hoa: {len(feats)} don vi -> {CANHBAO_GEOJSON}')


# =================================================== Lop 5 + Lop 6 (khoa hoc)
def khu_tong_an(data):
    """LOP 5 - Khu dong TONG AN: dong khong phai tieu de nhom, khong ten 'Tong',
    nhung gia tri = tong cac dong con lai cung nhom -> chac chan la dong tong bi lan.
    Dieu kien chat: cung (don_vi, nhom), nhom >= 3 dong, sai so <= 1%, va neu bieu co
    diem dau/cuoi thi dong tong an phai TRONG diem dau va diem cuoi (tuyen that co lo trinh)."""
    for code, spec in BIEU.items():
        has_ep = any(f[0] in ('dd', 'dc') for f in spec['fields'])
        nhan = {f[0]: f[1] for f in spec['fields']}
        groups = {}
        for rec in data[code]:
            groups.setdefault((rec['don_vi'], rec.get('nhom') or ''), []).append(rec)
        bo = set()
        for (dv, nhom), recs in groups.items():
            if len(recs) < 3:
                continue
            for fid in spec['numeric_sum']:
                vals = [r for r in recs if isinstance(r.get(fid), (int, float)) and id(r) not in bo]
                if len(vals) < 3:
                    continue
                tong = sum(r[fid] for r in vals)
                for r in vals:
                    con_lai = tong - r[fid]
                    if con_lai <= 0:
                        continue
                    if abs(r[fid] - con_lai) / con_lai < 0.01:      # r = tong cac dong con -> dong tong
                        if has_ep and (r.get('dd') or r.get('dc')):  # co lo trinh -> tuyen that, bo qua
                            continue
                        bo.add(id(r))
                        LOG.cb('DA SUA', dv, spec['sheet'], r.get('_src', ''),
                               f'LỚP 5 - Dòng nghi TỔNG ẩn: {nhan.get(fid, fid)}={r[fid]:g} ≈ tổng các dòng '
                               f'còn lại cùng nhóm "{nhom or "(chung)"}" ({con_lai:g})',
                               f'{r.get("ten") or "(trống tên)"}',
                               'Đã LOẠI khỏi dữ liệu chi tiết để tránh cộng trùng (kiểm định số học)')
        if bo:
            data[code] = [r for r in data[code] if id(r) not in bo]


def dung_doi_soat(data):
    """LOP 6 - DOI SOAT: so sanh S_chi_tiet (da khu trung) voi S_khai_bao (don vi tu khai)
    de CHUNG MINH bang con so rang khong con cong trung."""
    for code, spec in BIEU.items():
        nhan = {f[0]: f[1] for f in spec['fields']}
        dvs = sorted({r['don_vi'] for r in data[code]} | set(KHAI_BAO[code].keys()))
        for dv in dvs:
            for fid in spec['numeric_sum']:
                s_chi = sum(r[fid] for r in data[code]
                            if r['don_vi'] == dv and isinstance(r.get(fid), (int, float)))
                s_khai = KHAI_BAO[code].get(dv, {}).get(fid)
                if not s_chi and not s_khai:
                    continue
                if s_khai:
                    ty = s_chi / s_khai if s_khai else 0
                    if 0.98 <= ty <= 1.02:
                        nd = 'KHỚP — đã chứng minh không cộng trùng'
                    elif 1.9 <= ty <= 2.1:
                        nd = '⚠ NGHI CÒN CỘNG TRÙNG 1 LẦN (chi tiết ≈ 2× khai báo)'
                    elif ty > 1.02:
                        nd = 'Chi tiết > khai báo — nghi còn tổng ẩn hoặc ghi dư'
                    else:
                        nd = 'Chi tiết < khai báo — nghi đơn vị kê thiếu dòng'
                    tyle = f'{ty:.3f}'
                else:
                    nd = 'Nguồn không có dòng TỔNG để đối soát'
                    tyle = '-'
                DOI_SOAT.append([dv, spec['sheet'], nhan.get(fid, fid),
                                 round(s_chi, 3), (round(s_khai, 3) if s_khai else None), tyle, nd])


def dung_doi_soat_gis(data):
    """DOI SOAT 3 NGUON cho CHIEU DAI DUONG: chi tiet (Excel) vs khai bao vs GIS thuc te.
    GIS_diaphuong = duong chi co ten (khong ref) trong ranh don vi -> gan nhat voi khai bao
    cua phuong/xa; GIS_tong = toan bo mang trong ranh (ke ca QL/CT di qua)."""
    gis = load_gis()
    if not gis:
        return
    XA = 'Cán bộ địa chính - xây dựng xã/phường'
    HT = 'Chuyên viên Phòng Hạ tầng kỹ thuật'
    dvs = sorted({r['don_vi'] for r in data['DUONG']})
    for dv in dvs:
        s_chi = sum(r['dai'] for r in data['DUONG']
                    if r['don_vi'] == dv and isinstance(r.get('dai'), (int, float)))
        s_khai = KHAI_BAO['DUONG'].get(dv, {}).get('dai')
        g = gis.get(_key_ten(dv))
        if not g:
            DOI_SOAT_GIS.append([dv, round(s_chi, 2), (round(s_khai, 2) if s_khai else None),
                                 None, None, 'LƯU Ý',
                                 'Không khớp được ranh GIS cho đơn vị (tên/ranh chưa đồng bộ)',
                                 f'{HT}: kiểm tra ánh xạ tên đơn vị với lớp ranh hành chính.'])
            continue
        gdp, gt = g.get('_diaphuong', 0.0), g.get('_tong', 0.0)

        # --- phan muc + dinh huong xu ly cu the ---
        if gt > 0 and s_chi > gt * 1.5:
            muc = 'NGHIÊM TRỌNG'
            nd = (f'Chiều dài kê khai {s_chi:.1f} km VƯỢT XA tổng chiều dài TẤT CẢ đường trên '
                  f'bản đồ trong ranh ({gt:.1f} km). Nghi có DÒNG GỘP nhiều tuyến hoặc đo nhầm '
                  f'đơn vị (mét ghi thành km).')
            de = (f'{XA}: rà soát, TÁCH các dòng gộp (vd "đường trục các thôn", "đường liên thôn") '
                  f'thành từng tuyến có điểm đầu–cuối; kiểm tra đơn vị đo (km/m). '
                  f'{HT}: đối chiếu thực địa/ảnh vệ tinh trước khi tổng hợp.')
        elif gt > 0 and s_chi > gt * 1.15:
            muc = 'CẢNH BÁO'
            nd = (f'Kê khai {s_chi:.1f} km nhỉnh hơn tổng mạng đường trên bản đồ ({gt:.1f} km). '
                  f'Có thể còn dòng gộp, hoặc bản đồ chưa số hóa hết ngõ/ngách.')
            de = (f'{XA}: xác minh lại các tuyến dài bất thường. '
                  f'{HT}: cập nhật (số hóa) các tuyến còn thiếu lên GIS để khớp thực tế.')
        elif gt > 0 and gdp == 0:
            muc = 'CẢNH BÁO'
            nd = (f'Bản đồ GIS CHƯA CÓ tuyến đường địa phương/đô thị nào trong ranh đơn vị '
                  f'(chỉ có QL/ĐT/cao tốc {gt:.1f} km), trong khi đơn vị kê {s_chi:.1f} km.')
            de = (f'{HT}: số hóa BỔ SUNG đường đô thị/địa phương của đơn vị lên bản đồ GIS. '
                  f'{XA}: cung cấp sơ đồ/danh mục tuyến để đối chiếu.')
        elif gdp > 0 and s_chi < gdp * 0.5:
            muc = 'LƯU Ý'
            nd = (f'Kê khai {s_chi:.1f} km THẤP hơn nhiều so với đường địa phương đã có trên bản đồ '
                  f'({gdp:.1f} km). Nghi đơn vị KÊ THIẾU tuyến.')
            de = (f'{XA}: bổ sung các tuyến còn thiếu vào biểu kê khai. '
                  f'{HT}: gửi danh mục tuyến GIS cho đơn vị đối chiếu.')
        elif s_khai and s_chi < s_khai * 0.6:
            muc = 'LƯU Ý'
            nd = (f'Số chi tiết {s_chi:.1f} km thấp hơn nhiều so với chính dòng TỔNG đơn vị tự khai '
                  f'({s_khai:.1f} km) → thiếu dòng chi tiết trong biểu.')
            de = (f'{XA}: bổ sung đủ các dòng chi tiết cho khớp dòng tổng đã ghi.')
        else:
            muc = 'ĐẠT'
            nd = f'Nằm trong dải hợp lý so với bản đồ GIS ({gdp:.1f}–{gt:.1f} km).'
            de = 'Không cần điều chỉnh. Định kỳ đối chiếu khi cập nhật bản đồ.'

        DOI_SOAT_GIS.append([dv, round(s_chi, 2), (round(s_khai, 2) if s_khai else None),
                             round(gdp, 2), round(gt, 2), muc, nd, de])
        # Day canh bao muc cao vao sheet CANH BAO chung de chuyen vien theo doi
        if muc in ('NGHIÊM TRỌNG', 'CẢNH BÁO'):
            LOG.cb(muc, dv, '01_Đường giao thông', 'Đối soát GIS',
                   nd, f'Chi tiết {s_chi:.1f} km / GIS {gt:.1f} km', de)


# =============================================================== xuat file
FILL_HDR = PatternFill('solid', fgColor='1F4E79')
FILL_SUB = PatternFill('solid', fgColor='2E75B6')
FILL_TIT = PatternFill('solid', fgColor='DDEBF7')
FILL_TOT = PatternFill('solid', fgColor='FFF2CC')
FILL_ODD = PatternFill('solid', fgColor='F2F7FB')
THIN = Side(style='thin', color='9DC3E6')
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def xuat(data, don_vi_list):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    # ---------------- cac sheet bieu mau ----------------
    for code, spec in BIEU.items():
        ws = wb.create_sheet(spec['sheet'])
        cols = [('STT', 6), ('Phường/Xã', 20), ('Nhóm tuyến/Phân loại', 26)] + \
               [(f[1], 0) for f in spec['fields']]
        ncol = len(cols)

        ws.cell(1, 1, spec['tieu_de'])
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncol)
        ws.cell(1, 1).font = Font(bold=True, size=13, color='1F4E79')
        ws.cell(1, 1).alignment = Alignment(horizontal='center', vertical='center')
        ws.cell(1, 1).fill = FILL_TIT
        ws.row_dimensions[1].height = 26

        ws.cell(2, 1, f'Tổng hợp {len(don_vi_list)} phường/xã • Nguồn: {SRC_DIR} • '
                      f'Lập ngày {datetime.date.today().strftime("%d/%m/%Y")}')
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncol)
        ws.cell(2, 1).font = Font(italic=True, size=9, color='595959')
        ws.cell(2, 1).alignment = Alignment(horizontal='center')

        HR = 3
        for i, (nhan, _) in enumerate(cols, 1):
            c = ws.cell(HR, i, nhan)
            c.font = Font(bold=True, color='FFFFFF', size=10)
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            c.border = BOX
        ws.row_dimensions[HR].height = 42

        recs = sorted(data[code], key=lambda x: (x['don_vi'], x.get('nhom') or ''))
        r = HR + 1
        stt_theo_dv, cur_dv = 0, None
        for rec in recs:
            if rec['don_vi'] != cur_dv:
                cur_dv, stt_theo_dv = rec['don_vi'], 0
            stt_theo_dv += 1
            vals = [stt_theo_dv, rec['don_vi'], rec.get('nhom') or ''] + \
                   [rec.get(f[0]) for f in spec['fields']]
            for i, v in enumerate(vals, 1):
                c = ws.cell(r, i, v)
                c.border = BOX
                c.font = Font(size=10)
                kieu = 'txt' if i <= 3 else spec['fields'][i - 4][2]
                if kieu in ('num', 'int'):
                    c.alignment = Alignment(horizontal='right', vertical='center')
                    c.number_format = '#,##0' if kieu == 'int' else '#,##0.###'
                elif kieu == 'year' or i == 1:
                    c.alignment = Alignment(horizontal='center', vertical='center')
                else:
                    c.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
                if (r - HR) % 2 == 0:
                    c.fill = FILL_ODD
            r += 1

        # dong tong
        last = r - 1
        for i, (nhan, _) in enumerate(cols, 1):
            c = ws.cell(r, i)
            c.fill = FILL_TOT
            c.border = BOX
            c.font = Font(bold=True, size=10)
        ws.cell(r, 2, f'TỔNG CỘNG ({len(recs):,} dòng)').font = Font(bold=True, size=10)
        for i, f in enumerate(spec['fields'], 4):
            if f[0] in spec['numeric_sum'] and last >= HR + 1:
                L = get_column_letter(i)
                c = ws.cell(r, i, f'=SUBTOTAL(9,{L}{HR+1}:{L}{last})')
                c.number_format = '#,##0' if f[2] == 'int' else '#,##0.###'
                c.alignment = Alignment(horizontal='right')
                c.font = Font(bold=True, size=10, color='C00000')

        ws.freeze_panes = ws.cell(HR + 1, 4)
        ws.auto_filter.ref = f'A{HR}:{get_column_letter(ncol)}{last if last>=HR else HR}'
        widths = {1: 6, 2: 19, 3: 24}
        for i, f in enumerate(spec['fields'], 4):
            widths[i] = 34 if f[2] == 'txt' and f[0] in ('ten', 'chung', 'ht', 'dk', 'vt', 'dd', 'dc', 'gc') else 15
        for i, w in widths.items():
            ws.column_dimensions[get_column_letter(i)].width = w
        ws.sheet_view.showGridLines = False

    # ---------------- sheet tong quan ----------------
    tq = wb.create_sheet('00_TỔNG QUAN', 0)
    tq.cell(1, 1, 'BẢNG TỔNG HỢP HẠ TẦNG KỸ THUẬT ĐÔ THỊ THEO ĐƠN VỊ HÀNH CHÍNH')
    tq.merge_cells(start_row=1, start_column=1, end_row=1, end_column=9)
    tq.cell(1, 1).font = Font(bold=True, size=14, color='1F4E79')
    tq.cell(1, 1).alignment = Alignment(horizontal='center')
    tq.cell(1, 1).fill = FILL_TIT
    tq.row_dimensions[1].height = 30

    hdr = ['STT', 'Phường/Xã', 'Đường GT\n(số tuyến)', 'Chiều dài đường\n(km)',
           'Chiếu sáng\n(km)', 'Số cột đèn\n(cột)', 'Thoát nước\n(m)',
           'Cây xanh\n(cây)', 'Công viên\n(m2)']
    for i, h in enumerate(hdr, 1):
        c = tq.cell(3, i, h)
        c.font = Font(bold=True, color='FFFFFF', size=10)
        c.fill = FILL_HDR
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = BOX
    tq.row_dimensions[3].height = 40

    def agg(code, dv, fid=None):
        rows = [x for x in data[code] if x['don_vi'] == dv]
        if fid is None:
            return len(rows)
        return sum(x[fid] for x in rows if isinstance(x.get(fid), (int, float)))

    r = 4
    for i, dv in enumerate(don_vi_list, 1):
        vals = [i, dv,
                agg('DUONG', dv), agg('DUONG', dv, 'dai'),
                agg('DIEN', dv, 'dai'), agg('DIEN', dv, 'so_cot'),
                agg('THOAT', dv, 'dai'), agg('CAY', dv, 'sl'),
                agg('CONGVIEN', dv, 'dt')]
        for j, v in enumerate(vals, 1):
            c = tq.cell(r, j, v)
            c.border = BOX
            c.font = Font(size=10)
            if j == 1:
                c.alignment = Alignment(horizontal='center')
            elif j == 2:
                c.alignment = Alignment(horizontal='left')
            else:
                c.alignment = Alignment(horizontal='right')
                c.number_format = '#,##0' if j in (3, 6, 8) else '#,##0.##'
            if r % 2 == 0:
                c.fill = FILL_ODD
        r += 1
    for j in range(1, 10):
        c = tq.cell(r, j)
        c.fill = FILL_TOT
        c.border = BOX
        c.font = Font(bold=True, size=10, color='C00000')
    tq.cell(r, 2, 'TỔNG TOÀN TỈNH')
    for j in range(3, 10):
        L = get_column_letter(j)
        c = tq.cell(r, j, f'=SUM({L}4:{L}{r-1})')
        c.number_format = '#,##0' if j in (3, 6, 8) else '#,##0.##'
        c.alignment = Alignment(horizontal='right')
    tq.freeze_panes = 'C4'
    for j, w in zip(range(1, 10), [6, 22, 12, 15, 13, 12, 14, 12, 14]):
        tq.column_dimensions[get_column_letter(j)].width = w
    tq.sheet_view.showGridLines = False

    # ---------------- sheet doi soat (chung minh khong cong trung) ----------------
    ds = wb.create_sheet('ĐỐI SOÁT')
    ds.cell(1, 1, 'ĐỐI SOÁT CHỐNG CỘNG TRÙNG — Chi tiết (đã khử trùng) so với số đơn vị tự khai')
    ds.merge_cells(start_row=1, start_column=1, end_row=1, end_column=7)
    ds.cell(1, 1).font = Font(bold=True, size=12, color='1F4E79')
    ds.cell(1, 1).alignment = Alignment(horizontal='center')
    ds.cell(1, 1).fill = FILL_TIT
    ds.row_dimensions[1].height = 26
    ds_head = ['Phường/Xã', 'Biểu mẫu', 'Chỉ tiêu', 'S_chi_tiết\n(đã khử trùng)',
               'S_khai_báo\n(dòng Tổng gốc)', 'Tỷ lệ\n(CT/KB)', 'Nhận định']
    for i, h in enumerate(ds_head, 1):
        c = ds.cell(2, i, h)
        c.font = Font(bold=True, color='FFFFFF', size=10)
        c.fill = FILL_HDR
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = BOX
    ds.row_dimensions[2].height = 34
    FILL_OK = PatternFill('solid', fgColor='E2EFDA')
    FILL_BAD = PatternFill('solid', fgColor='FCE4E4')
    FILL_WARN = PatternFill('solid', fgColor='FFF2CC')
    for ri, row in enumerate(sorted(DOI_SOAT, key=lambda x: (x[1], x[0], x[2])), 3):
        nd = row[6]
        fill = None
        if nd.startswith('KHỚP'):
            fill = FILL_OK
        elif nd.startswith('⚠'):
            fill = FILL_BAD
        elif nd.startswith('Chi tiết'):
            fill = FILL_WARN
        for ci, v in enumerate(row, 1):
            c = ds.cell(ri, ci, v)
            c.font = Font(size=10, bold=(ci == 7 and nd.startswith('⚠')))
            c.border = BOX
            if ci in (4, 5):
                c.alignment = Alignment(horizontal='right')
                c.number_format = '#,##0.###'
            elif ci == 6:
                c.alignment = Alignment(horizontal='center')
            else:
                c.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
            if fill:
                c.fill = fill
    ds.freeze_panes = 'A3'
    if DOI_SOAT:
        ds.auto_filter.ref = f'A2:G{len(DOI_SOAT)+2}'
    for i, w in zip(range(1, 8), [19, 26, 22, 16, 16, 9, 46]):
        ds.column_dimensions[get_column_letter(i)].width = w
    ds.sheet_view.showGridLines = False

    # ---------------- sheet doi soat GIS (3 nguon cho chieu dai duong) ----------------
    if DOI_SOAT_GIS:
        gs = wb.create_sheet('ĐỐI SOÁT GIS')
        NC = 8
        gs.cell(1, 1, 'ĐỐI SOÁT 3 NGUỒN — CHIỀU DÀI ĐƯỜNG (km): Chi tiết Excel • Đơn vị tự khai • '
                      'Bản đồ GIS thực tế  →  CẢNH BÁO ĐIỀU CHỈNH')
        gs.merge_cells(start_row=1, start_column=1, end_row=1, end_column=NC)
        gs.cell(1, 1).font = Font(bold=True, size=12, color='1F4E79')
        gs.cell(1, 1).alignment = Alignment(horizontal='center')
        gs.cell(1, 1).fill = FILL_TIT
        gs.row_dimensions[1].height = 26
        gs.cell(2, 1, 'Ghi chú: GIS đường địa phương = tuyến chỉ có tên (không quốc lộ/tỉnh lộ) '
                      'nằm trong ranh đơn vị — gần nhất với phần xã/phường quản lý. '
                      'GIS tổng mạng = toàn bộ đường trong ranh, kể cả QL/ĐT/cao tốc.')
        gs.merge_cells(start_row=2, start_column=1, end_row=2, end_column=NC)
        gs.cell(2, 1).font = Font(italic=True, size=9, color='595959')
        gs.cell(2, 1).alignment = Alignment(horizontal='left', wrap_text=True)
        gs.row_dimensions[2].height = 26
        gh = ['Phường/Xã', 'S_chi_tiết\n(Excel, km)', 'S_khai_báo\n(km)',
              'GIS đường\nđịa phương (km)', 'GIS tổng\nmạng (km)', 'Mức độ',
              'Nhận định (căn cứ đối soát)', 'Đề nghị điều chỉnh — ai làm gì']
        HR = 3
        for i, h in enumerate(gh, 1):
            c = gs.cell(HR, i, h)
            c.font = Font(bold=True, color='FFFFFF', size=10)
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            c.border = BOX
        gs.row_dimensions[HR].height = 40
        MUC_FILL = {'NGHIÊM TRỌNG': PatternFill('solid', fgColor='F4B6B6'),
                    'CẢNH BÁO': PatternFill('solid', fgColor='FFE0A3'),
                    'LƯU Ý': PatternFill('solid', fgColor='FFF2CC'),
                    'ĐẠT': PatternFill('solid', fgColor='E2EFDA')}
        MUC_ORD = {'NGHIÊM TRỌNG': 0, 'CẢNH BÁO': 1, 'LƯU Ý': 2, 'ĐẠT': 3}
        rows = sorted(DOI_SOAT_GIS, key=lambda x: (MUC_ORD.get(x[5], 9), x[0]))
        for ri, row in enumerate(rows, HR + 1):
            muc = row[5]
            fill = MUC_FILL.get(muc)
            for ci, v in enumerate(row, 1):
                c = gs.cell(ri, ci, v)
                c.font = Font(size=10, bold=(ci == 6 and muc in ('NGHIÊM TRỌNG', 'CẢNH BÁO')),
                              color='9C0006' if (ci == 6 and muc == 'NGHIÊM TRỌNG') else '000000')
                c.border = BOX
                if 2 <= ci <= 5:
                    c.alignment = Alignment(horizontal='right', vertical='center')
                    c.number_format = '#,##0.##'
                elif ci == 6:
                    c.alignment = Alignment(horizontal='center', vertical='center')
                else:
                    c.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
                if fill:
                    c.fill = fill
        gs.freeze_panes = f'A{HR+1}'
        gs.auto_filter.ref = f'A{HR}:{get_column_letter(NC)}{len(rows)+HR}'
        for i, w in zip(range(1, NC + 1), [19, 12, 11, 14, 12, 14, 52, 60]):
            gs.column_dimensions[get_column_letter(i)].width = w
        gs.sheet_view.showGridLines = False

    # ---------------- canh bao & nhat ky ----------------
    for name, rows, heads, widths in [
        ('CẢNH BÁO', LOG.canh_bao,
         ['Mức độ', 'Phường/Xã', 'Biểu mẫu', 'Vị trí nguồn', 'Vấn đề', 'Giá trị gốc', 'Cách xử lý'],
         [14, 19, 24, 26, 46, 34, 44]),
        ('NHẬT KÝ', LOG.nhat_ky,
         ['Thời gian', 'Phường/Xã', 'File nguồn', 'Sheet', 'Dòng', 'Loại', 'Nội dung'],
         [19, 19, 34, 24, 8, 12, 56]),
    ]:
        ws = wb.create_sheet(name)
        for i, h in enumerate(heads, 1):
            c = ws.cell(1, i, h)
            c.font = Font(bold=True, color='FFFFFF', size=10)
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            c.border = BOX
        for ri, row in enumerate(rows, 2):
            for ci, v in enumerate(row, 1):
                c = ws.cell(ri, ci, v)
                c.font = Font(size=9)
                c.border = BOX
                c.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
        ws.freeze_panes = 'A2'
        if rows:
            ws.auto_filter.ref = f'A1:{get_column_letter(len(heads))}{len(rows)+1}'
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w
        ws.sheet_view.showGridLines = False

    wb.save(OUT_FILE)
    print('DA XUAT:', OUT_FILE)
    for code, spec in BIEU.items():
        try:
            print(f'  {spec["sheet"]:34s} {len(data[code]):6,} dong')
        except UnicodeEncodeError:
            print(f'  {code:12s} {len(data[code]):6,} dong')
    khop = sum(1 for x in DOI_SOAT if x[6].startswith('KHỚP'))
    trung = sum(1 for x in DOI_SOAT if x[6].startswith('⚠'))
    print(f'  DOI SOAT: {len(DOI_SOAT):,} dong | KHOP: {khop} | NGHI TRUNG (~2x): {trung}')
    if DOI_SOAT_GIS:
        import collections as _c
        mc = _c.Counter(x[5] for x in DOI_SOAT_GIS)
        print(f'  DOI SOAT GIS: {len(DOI_SOAT_GIS)} don vi | ' +
              ' | '.join(f'{k}: {v}' for k, v in
                         sorted(mc.items(), key=lambda z: {"NGHIÊM TRỌNG":0,"CẢNH BÁO":1,"LƯU Ý":2,"ĐẠT":3}.get(z[0],9))))
    print(f'  CANH BAO: {len(LOG.canh_bao):,} | NHAT KY: {len(LOG.nhat_ky):,}')


if __name__ == '__main__':
    main()
