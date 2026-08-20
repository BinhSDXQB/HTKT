# -*- coding: utf-8 -*-
"""
================================================================================
 GIS - DO CHIEU DAI HINH HOC TUYEN DUONG THEO DON VI HANH CHINH
================================================================================
 Muc dich: tao NGUON THU BA (doc lap voi Excel) de doi soat chieu dai duong.
   1. Doc tuyen-duong-quang-tri.geojson (LineString, toa do WGS84 lon/lat).
   2. Tinh chieu dai HINH HOC tung doan bang cong thuc haversine.
   3. Gan tung DOAN NHO (giua 2 dinh) ve phuong/xa CHUA no bang point-in-polygon
      (admin-boundaries.geojson) -> xu ly ca tuyen cat qua ranh nhieu don vi.
   4. Phan theo NHOM tuyen (Cao toc / Quoc lo / Duong tinh / Duong dia phuong).
   5. Xuat CSV + JSON: GIS_CHIEU_DAI_THEO_DON_VI  -> ghep vao sheet DOI SOAT.

 KET QUA nay tra loi: "chieu dai THUC TE tren ban do" cua tung don vi la bao
 nhieu, de so voi so KHAI BAO va so CHI TIET (da khu trung) tu Excel.
================================================================================
"""
import json, math, csv, unicodedata, collections, os

DATA = r"C:\Troly\HTKT\app\public\data"
ROADS = os.path.join(DATA, "tuyen-duong-quang-tri.geojson")
ADMIN = os.path.join(DATA, "admin-boundaries.geojson")
OUT_DIR = r"G:\My Drive\HTKT\Tong hop HTKT"
OUT_CSV = os.path.join(OUT_DIR, "GIS_CHIEU_DAI_THEO_DON_VI.csv")
OUT_JSON = os.path.join(OUT_DIR, "GIS_CHIEU_DAI_THEO_DON_VI.json")

R = 6371.0088  # km, ban kinh Trai Dat trung binh (IUGG)


# ------------------------------------------------------- chuan hoa ten don vi
def key_ten(s):
    """Khoa so sanh ten don vi: bo dau thanh + dau phu, giu chu cai co ban.
    -> 'Xa Minh Hoa' == 'Xa Minh Hoa'; 'Le Thuy' == 'Le Thuy' (khac cach bo dau)."""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')  # bo dau thanh
    s = s.replace('đ', 'd').replace('Đ', 'D')
    return ' '.join(s.lower().split())


# --------------------------------------------------------------- hinh hoc
def hav(a, b):
    """Chieu dai (km) giua 2 diem [lon,lat] bang haversine."""
    lo1, la1, lo2, la2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dla, dlo = la2 - la1, lo2 - lo1
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlo / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def pip_ring(pt, ring):
    """Ray casting: diem co nam trong 1 ring khong."""
    x, y = pt
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-18) + xi):
            inside = not inside
        j = i
    return inside


def pip_polygon(pt, poly):
    """poly = [outer, hole1, hole2...]. Trong outer va ngoai moi hole."""
    if not poly or not pip_ring(pt, poly[0]):
        return False
    for hole in poly[1:]:
        if pip_ring(pt, hole):
            return False
    return True


# --------------------------------------------------------------- nhom tuyen
def nhom_tuyen(props):
    ref = (props.get('ref') or '').strip().upper()
    name = (props.get('name') or '')
    if ref.startswith('CT') or 'cao tốc' in name.lower():
        return 'Cao tốc'
    if ref.startswith('QL') or 'quốc lộ' in name.lower():
        return 'Quốc lộ'
    if ref.startswith('ĐT') or ref.startswith('TL') or ref.startswith('DT'):
        return 'Đường tỉnh'
    if ref.startswith('HC') or ref.startswith('ĐH') or ref.startswith('DH'):
        return 'Đường huyện'
    return 'Đường địa phương/đô thị'   # chi co ten, khong ref -> gan voi khai bao phuong/xa


# =============================================================== main
def main():
    admin = json.load(open(ADMIN, encoding='utf-8'))
    wards = []   # (ten_full, key, bbox, [polygons])
    for f in admin['features']:
        p = f['properties']
        g = f['geometry']
        polys = []
        if g['type'] == 'Polygon':
            polys = [g['coordinates']]
        elif g['type'] == 'MultiPolygon':
            polys = g['coordinates']
        rings_all = [ring for poly in polys for ring in poly]
        xs = [c[0] for ring in rings_all for c in ring]
        ys = [c[1] for ring in rings_all for c in ring]
        bbox = (min(xs), min(ys), max(xs), max(ys))
        wards.append((p.get('fullName') or p.get('name'), key_ten(p.get('fullName') or p.get('name')),
                      bbox, polys))
    print(f"Nap {len(wards)} ranh don vi hanh chinh.")

    def tim_don_vi(pt):
        x, y = pt
        for ten, key, (x0, y0, x1, y1), polys in wards:
            if x0 <= x <= x1 and y0 <= y <= y1:
                for poly in polys:
                    if pip_polygon(pt, poly):
                        return ten
        return None

    roads = json.load(open(ROADS, encoding='utf-8'))
    # (ten_don_vi, nhom) -> km   |   'NGOAI RANH' cho doan khong thuoc don vi nao
    bang = collections.defaultdict(float)
    tong_nhom = collections.defaultdict(float)
    n_seg = 0
    cache = {}   # cache PIP theo o luoi ~ giam so lan tinh cho tuyen thang dai
    for ft in roads['features']:
        g = ft['geometry']
        if g['type'] != 'LineString':
            continue
        if ft['properties'].get('layer') != 'road':
            continue
        nh = nhom_tuyen(ft['properties'])
        co = g['coordinates']
        for i in range(len(co) - 1):
            a, b = co[i], co[i + 1]
            d = hav(a, b)
            if d <= 0:
                continue
            mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            gk = (round(mid[0], 4), round(mid[1], 4))   # ~11m luoi -> cache
            dv = cache.get(gk)
            if dv is None and gk not in cache:
                dv = tim_don_vi(mid)
                cache[gk] = dv
            bang[(dv or 'NGOÀI RANH (khác tỉnh/biên)', nh)] += d
            tong_nhom[nh] += d
            n_seg += 1

    print(f"Da xu ly {n_seg:,} doan tuyen 'road'.")

    # ------------------------ xuat CSV theo don vi x nhom + tong ------------------------
    os.makedirs(OUT_DIR, exist_ok=True)
    dvs = sorted({k[0] for k in bang})
    nhoms = ['Đường địa phương/đô thị', 'Đường huyện', 'Đường tỉnh', 'Quốc lộ', 'Cao tốc']
    with open(OUT_CSV, 'w', newline='', encoding='utf-8-sig') as fp:
        w = csv.writer(fp)
        w.writerow(['Đơn vị (theo ranh GIS)'] + [f'{n} (km)' for n in nhoms] +
                   ['Tổng GIS (km)', 'Đường địa phương (km) — so với khai báo'])
        for dv in dvs:
            row = [dv]
            tong = 0.0
            for n in nhoms:
                v = bang.get((dv, n), 0.0)
                row.append(round(v, 2))
                tong += v
            row.append(round(tong, 2))
            row.append(round(bang.get((dv, 'Đường địa phương/đô thị'), 0.0), 2))
            w.writerow(row)

    # JSON goc de engine ghep vao DOI SOAT: {key_ten: {nhom: km, '_tong': km, '_diaphuong': km}}
    out = {}
    for dv in dvs:
        if dv.startswith('NGOÀI RANH'):
            continue
        rec = {n: round(bang.get((dv, n), 0.0), 3) for n in nhoms}
        rec['_tong'] = round(sum(rec.values()), 3)
        rec['_diaphuong'] = rec['Đường địa phương/đô thị']
        out[key_ten(dv)] = {'ten': dv, **rec}
    json.dump(out, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    print("\n=== TONG CHIEU DAI GIS THEO NHOM (toan tinh, km) ===")
    for n in nhoms:
        print(f"  {n:28s} {tong_nhom.get(n,0):9.1f}")
    print(f"  {'NGOAI RANH':28s} {sum(v for k,v in bang.items() if k[0].startswith('NGOÀI')):9.1f}")
    print(f"\nDA XUAT:\n  {OUT_CSV}\n  {OUT_JSON}")


if __name__ == '__main__':
    main()
