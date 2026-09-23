# -*- coding: utf-8 -*-
"""
================================================================================
 DOC READER - doc file bang markitdown (microsoft/markitdown), tiet kiem token
================================================================================
 Vi sao can: doc thang .pdf/.docx bang Read hoac dump toan van ra Bash ton rat
 nhieu token (XML tho, hoac text roi rac khong con bang/tieu de). markitdown
 chuyen file sang Markdown SACH (giu bang, tieu de, in dam) - vua nen ky tu
 vua giup Claude hieu cau truc nhanh hon.

 Cong cu nay KHONG dump toan van ra man hinh mac dinh. Chi in phan can:
   toc     -> muc luc (Chuong/Muc/Dieu + heading markdown)
   search  -> doan van quanh tu khoa (nhu grep co ngu canh)
   export  -> ghi toan van .md ra file tam, Claude tu Read phan can bang offset/limit
   tables  -> liet ke cac bang markdown (thay the "bang" cu, khong can HTML thu cong)
   list    -> liet ke file doc duoc trong 1 thu muc

 Dinh dang ho tro (qua markitdown): pdf, docx, pptx, xlsx, xls, csv, json,
 html, txt, md, zip, msg (Outlook). File .doc (Word 97-2003) KHONG ho tro.

 Cach dung:
   python tools/doc_reader.py list [thu_muc]
   python tools/doc_reader.py toc <file>
   python tools/doc_reader.py search <file> "<tu khoa>" [--context 300] [--max 8]
   python tools/doc_reader.py tables <file> [--keyword "<tu khoa>"]
   python tools/doc_reader.py export <file> [-o duong_dan_ra]

 <file> co the la duong dan day du, duong dan tuong doi, HOAC chi ten/1 phan
 ten (fuzzy match) trong thu muc mac dinh THU_MUC_VBPL (bien moi truong,
 mac dinh "G:/My Drive/Tailieu_VBPL") hoac thu muc hien tai.

 LUU Y: day la cong cu CLI noi bo cho Claude Code chay qua Bash (may nay
 Claude da co quyen doc/ghi file khong gioi han qua Read/Write roi) - KHONG
 wire vao API route hay nhan duong dan tu nguoi dung/web ma khong them kiem
 tra rieng, vi tim_tep()/export -o KHONG gioi han pham vi thu muc.
================================================================================
"""
import sys
import os
import hashlib
import argparse
import glob

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DEFAULT_FOLDER = os.environ.get("THU_MUC_VBPL", "G:/My Drive/Tailieu_VBPL")
CACHE_DIR = os.path.join(os.environ.get("TEMP", "."), "doc_reader_cache")
# Chi gom dinh dang tai lieu van phong/phap ly thuc su can. KHONG them .zip/.msg:
# zip co the la decompression bomb, may nay chi co 6GB RAM (xem memory ram-6gb).
SUPPORTED_EXT = {".pdf", ".docx", ".pptx", ".xlsx", ".xls", ".csv", ".txt", ".md"}
MAX_FILE_SIZE = 60 * 1024 * 1024  # 60MB - qua nguong nay tu choi de tranh OOM


def loi(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def tim_tep(ten):
    """Tim file: duong dan truc tiep, hoac fuzzy-match trong DEFAULT_FOLDER / cwd."""
    if os.path.isfile(ten):
        return os.path.abspath(ten)

    ung_vien_thu_muc = [DEFAULT_FOLDER, os.getcwd()]
    k = ten.lower()
    for thu_muc in ung_vien_thu_muc:
        if not os.path.isdir(thu_muc):
            continue
        try:
            ds = os.listdir(thu_muc)
        except OSError:
            continue
        if ten in ds:
            return os.path.join(thu_muc, ten)
        khop = [
            f for f in ds
            if k in f.lower()
            and os.path.splitext(f)[1].lower() in SUPPORTED_EXT
            and os.path.isfile(os.path.join(thu_muc, f))
        ]
        if len(khop) == 1:
            return os.path.join(thu_muc, khop[0])
        if len(khop) > 1:
            print(f'Co {len(khop)} tep khop "{ten}" trong {thu_muc}, neu ro hon:')
            for f in khop[:15]:
                print("  -", f)
            sys.exit(1)
    loi(f'Khong thay tep nao khop "{ten}" (da tim: {", ".join(ung_vien_thu_muc)})')


def _cache_path(abspath):
    st = os.stat(abspath)
    key = hashlib.sha1(abspath.encode("utf-8")).hexdigest()[:16]
    # mtime + size trong ten cache: file doi noi dung (du cung giay) se khong khop -> chuyen lai
    return os.path.join(CACHE_DIR, f"{key}_{int(st.st_mtime)}_{st.st_size}.md")


def doc_to_markdown(abspath):
    """Chuyen file sang markdown, co cache theo (duong dan + mtime) de tim kiem
    lap lai tren cung 1 file khong phai chuyen lai (chuyen 1 lan ~1-2s)."""
    ext = os.path.splitext(abspath)[1].lower()
    if ext not in SUPPORTED_EXT:
        loi(f'Dinh dang "{ext}" chua ho tro. File .doc (Word cu) can luu lai thanh .docx hoac .pdf.')
    if os.path.getsize(abspath) > MAX_FILE_SIZE:
        loi(f"File qua lon (>{MAX_FILE_SIZE // 1024 // 1024}MB), tu choi de tranh treo may (RAM 6GB).")

    os.makedirs(CACHE_DIR, exist_ok=True)
    cp = _cache_path(abspath)
    if os.path.isfile(cp):
        with open(cp, "r", encoding="utf-8") as f:
            return f.read()

    try:
        from markitdown import MarkItDown
    except ImportError:
        loi('Chua cai markitdown. Chay: pip install "markitdown[pdf,docx,pptx,xlsx,xls,outlook]"')

    md = MarkItDown()
    try:
        result = md.convert(abspath)
    except Exception as e:
        loi(f"Loi doc file: {e}")

    text = (result.markdown or "").strip()
    if not text:
        loi("File rong hoac khong doc duoc noi dung (co the la PDF anh scan, can OCR truoc).")

    # don cache cu cua cung file (mtime/size khac) truoc khi ghi cache moi
    key = hashlib.sha1(abspath.encode("utf-8")).hexdigest()[:16]
    for old in glob.glob(os.path.join(CACHE_DIR, f"{key}_*.md")):
        try:
            os.remove(old)
        except OSError:
            pass
    # ghi atomic: tranh doc phai file dang ghi do neu co 2 tien trinh trung thoi diem
    tmp = cp + f".{os.getpid()}.tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, cp)
    return text


def cmd_list(args):
    thu_muc = args.thu_muc or DEFAULT_FOLDER
    if not os.path.isdir(thu_muc):
        loi(f"Thu muc khong ton tai: {thu_muc}")
    ds = sorted(
        f for f in os.listdir(thu_muc)
        if os.path.splitext(f)[1].lower() in SUPPORTED_EXT
    )
    print(f"{thu_muc} - {len(ds)} tep doc duoc:")
    for f in ds:
        try:
            size_kb = os.path.getsize(os.path.join(thu_muc, f)) // 1024
        except OSError:
            size_kb = "?"
        print(f"  {size_kb:>6} KB  {f}")


def cmd_toc(args):
    abspath = tim_tep(args.file)
    text = doc_to_markdown(abspath)
    print(f"### {os.path.basename(abspath)} - {len(text)} ky tu (markdown)\n")
    da_co = set()
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        la_heading = line.startswith("#")
        la_dieu_muc = False
        first_word = line.split(" ", 1)[0].rstrip(".").strip("*")
        if first_word.lower() in ("chương", "mục", "phần", "phụ", "điều") and len(line) < 200:
            la_dieu_muc = True
        if la_heading or la_dieu_muc:
            key = line.lower()
            if key in da_co:
                continue
            da_co.add(key)
            print(line.lstrip("#").strip()[:180])


def cmd_search(args):
    if not args.keyword.strip():
        loi("Tu khoa khong duoc de trong.")
    args.context = max(20, args.context)
    abspath = tim_tep(args.file)
    text = doc_to_markdown(abspath)
    low = text.lower()
    k = args.keyword.lower()
    i = 0
    n = 0
    while True:
        i = low.find(k, i)
        if i == -1 or n >= args.max:
            break
        start = max(0, i - args.context // 3)
        end = min(len(text), i + args.context)
        print(f"\n=== {os.path.basename(abspath)} [vi tri {i}] ===")
        print(text[start:end])
        i = end
        n += 1
    if n == 0:
        print(f'Khong thay "{args.keyword}" trong {os.path.basename(abspath)}')
    else:
        print(f"\n({n} ket qua, con lai chua liet ke neu co - tang --max de xem them)")


def cmd_tables(args):
    abspath = tim_tep(args.file)
    text = doc_to_markdown(abspath)
    lines = text.split("\n")
    blocks = []
    cur = []
    for line in lines:
        if line.strip().startswith("|"):
            cur.append(line)
        else:
            if cur:
                blocks.append(cur)
                cur = []
    if cur:
        blocks.append(cur)

    print(f"{os.path.basename(abspath)} - {len(blocks)} bang markdown")
    n = 0
    for b in blocks:
        block_text = "\n".join(b)
        if args.keyword and args.keyword.lower() not in block_text.lower():
            continue
        n += 1
        print(f"\n===== BANG {n} =====")
        print(block_text)
        if n >= args.max:
            break
    if n == 0:
        print("Khong co bang nao khop dieu kien." if args.keyword else "(khong co bang)")


def cmd_export(args):
    abspath = tim_tep(args.file)
    text = doc_to_markdown(abspath)
    out = args.out or os.path.join(
        os.environ.get("TEMP", "."), os.path.basename(abspath) + ".md"
    )
    with open(out, "w", encoding="utf-8") as f:
        f.write(text)
    so_dong = text.count("\n") + 1
    print(f"{len(text)} ky tu, {so_dong} dong -> {out}")
    print("(Doc file nay bang Read tool voi offset/limit thay vi dump toan bo de tiet kiem token)")


def main():
    p = argparse.ArgumentParser(description="Doc file (pdf/docx/pptx/xlsx/...) qua markitdown, tiet kiem token")
    sub = p.add_subparsers(dest="cmd")

    p_list = sub.add_parser("list", help="liet ke file doc duoc trong 1 thu muc")
    p_list.add_argument("thu_muc", nargs="?", default=None)
    p_list.set_defaults(func=cmd_list)

    p_toc = sub.add_parser("toc", help="in muc luc (Chuong/Dieu/heading)")
    p_toc.add_argument("file")
    p_toc.set_defaults(func=cmd_toc)

    p_search = sub.add_parser("search", help="tim tu khoa, in doan van quanh no")
    p_search.add_argument("file")
    p_search.add_argument("keyword")
    p_search.add_argument("--context", type=int, default=300)
    p_search.add_argument("--max", type=int, default=8)
    p_search.set_defaults(func=cmd_search)

    p_tables = sub.add_parser("tables", help="liet ke cac bang markdown trong file")
    p_tables.add_argument("file")
    p_tables.add_argument("--keyword", default=None)
    p_tables.add_argument("--max", type=int, default=10)
    p_tables.set_defaults(func=cmd_tables)

    p_export = sub.add_parser("export", help="ghi toan van markdown ra file (khong in ra man hinh)")
    p_export.add_argument("file")
    p_export.add_argument("-o", "--out", default=None)
    p_export.set_defaults(func=cmd_export)

    args = p.parse_args()
    if not args.cmd:
        p.print_help()
        sys.exit(1)
    args.func(args)


if __name__ == "__main__":
    main()
