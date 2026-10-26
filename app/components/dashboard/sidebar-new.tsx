'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  AlertTriangle,
  Wrench,
  FolderKanban,
  Package,
  BarChart3,
  BookOpen,
  Settings,
  ChevronRight,
  Map,
  FileSpreadsheet,
  TrendingUp,
  Link2,
  Zap,
  Route,
  Settings2,
  Factory,
  Upload,
  MessageSquare,
  Wallet,
  Briefcase,
  ShieldCheck,
  UserCircle2,
  CalendarDays,
  Clock,
  X,
  ChevronDown,
  Boxes,
  BellRing,
  Users,
  Award,
  ClipboardCheck,
  ScrollText,
  FileText,
  Droplets,
  Waves,
  TreePine,
  Lightbulb,
  Landmark,
  Network,
  Share2,
  Cpu,
  GraduationCap,
  Bus,
  Ship,
  Calculator,
  Gavel,
  FlaskConical,
  PencilRuler,
  Banknote,
  Scale,
  CalendarCheck,
  Sparkles,
  Baby,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SALARY_IMPORT_EMAILS } from '@/lib/salary-perms'
import { SidebarStats } from './sidebar-stats'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  superAdminOnly?: boolean
  salaryOnly?: boolean
  officeOnly?: boolean
  htktOnly?: boolean
  congViecOnly?: boolean
}

type NavGroup = {
  label: string
  icon: React.ElementType
  items: NavItem[]
  defaultOpen?: boolean
  superAdminOnly?: boolean   // cả nhóm chỉ admin (quyền cao nhất) mới thấy
  deptMa?: string            // nhóm theo phòng (to_chuc.ma): chỉ admin + cán bộ phòng đó thấy; hiện tất cả items
}

const navGroups: NavGroup[] = [
  {
    label: 'Cá nhân & Cơ bản',
    icon: UserCircle2,
    defaultOpen: true,
    items: [
      { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Hồ sơ của tôi', href: '/dashboard/ho-so-ca-nhan', icon: UserCircle2 },
      { label: 'Nghỉ phép', href: '/dashboard/nghi-phep', icon: CalendarDays },
      { label: 'Chấm công làm thêm giờ', href: '/dashboard/cham-cong-lam-them', icon: Clock },
    ],
  },
  {
    label: 'Quản lý Hạ tầng',
    icon: Building2,
    defaultOpen: false,
    items: [
      { label: 'Bản đồ GIS', href: '/dashboard/ban-do', icon: Map },
      { label: 'Tài sản hạ tầng', href: '/dashboard/tai-san', icon: Building2 },
      { label: 'Bình đồ tuyến đường', href: '/dashboard/tai-san/binh-do', icon: Map },
      { label: 'Tuyến mạng lưới', href: '/dashboard/ha-tang/tuyen-mang-luoi', icon: Route },
      { label: 'Trạm bơm', href: '/dashboard/ha-tang/tram-bom', icon: Settings2 },
      { label: 'Nhà máy XLNT', href: '/dashboard/ha-tang/nha-may-xu-ly', icon: Factory },
      { label: 'Import GIS / DXF / KML', href: '/dashboard/ha-tang/import', icon: Upload },
    ],
  },
  {
    label: 'Chỉnh trang đô thị PCCC (QĐ72)',
    icon: ShieldCheck,
    items: [
      { label: 'Hồ sơ khảo sát', href: '/dashboard/qd72', icon: ClipboardList },
      { label: 'Bản đồ GIS QĐ72', href: '/dashboard/qd72/ban-do', icon: Map },
      { label: 'Báo cáo tổng hợp', href: '/dashboard/qd72/bao-cao', icon: BarChart3 },
      { label: 'Năng lực HĐXD (liên thông)', href: '/dashboard/nang-luc-hdxd', icon: ShieldCheck },
    ],
  },
  {
    label: 'BIM / Mô hình công trình',
    icon: Boxes,
    defaultOpen: false,
    items: [
      { label: 'Danh sách mô hình', href: '/dashboard/bim', icon: Boxes },
      { label: 'Tiếp nhận mô hình', href: '/dashboard/bim/tiep-nhan', icon: Upload, adminOnly: true },
    ],
  },
  {
    label: 'Quản lý Công việc',
    icon: Wrench,
    defaultOpen: false,
    items: [
      { label: 'Kiểm tra hiện trạng', href: '/dashboard/kiem-tra', icon: ClipboardList },
      { label: 'Sự cố & Phản ánh', href: '/dashboard/su-co', icon: AlertTriangle },
      { label: 'Phiếu công việc', href: '/dashboard/phieu-cong-viec', icon: Wrench },
      { label: 'Dự án công trình', href: '/dashboard/du-an', icon: FolderKanban },
      { label: 'Kho tài liệu tra cứu', href: '/dashboard/tai-lieu', icon: BookOpen, officeOnly: true },
    ],
  },
  {
    label: 'Cấp phép & Vật tư',
    icon: Package,
    defaultOpen: false,
    items: [
      { label: 'Cấp phép đường bộ', href: '/dashboard/cap-phep', icon: ShieldCheck },
      { label: 'Vật tư & Kho', href: '/dashboard/vat-tu', icon: Package },
    ],
  },
  {
    label: 'Báo cáo & Thống kê',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { label: 'Dashboard tổng hợp', href: '/dashboard/bao-cao/tong-hop', icon: TrendingUp },
      { label: 'Dữ liệu phường/xã', href: '/dashboard/bao-cao/du-lieu-phuong-xa', icon: FileSpreadsheet },
      { label: 'Điện chiếu sáng thông minh', href: '/dashboard/bao-cao/den-chieu-sang', icon: Zap },
      { label: 'Nhập liệu biểu mẫu HTKT', href: '/dashboard/bao-cao/nhap-lieu', icon: FileSpreadsheet },
      { label: 'Hồ sơ HTKT & số hiệu đường', href: '/dashboard/bao-cao/ha-tang-xa', icon: Link2 },
    ],
  },
  {
    // Nhóm nghiệp vụ Văn phòng Sở — hiện cho admin / cán bộ VPS / có office:menu_access
    // (điều khiển qua officeOnly = canOffice). Tách khỏi nhóm "Cấu hình" admin-only để
    // cán bộ VP Sở (không phải admin) vẫn thấy được menu.
    label: 'Văn phòng Sở',
    icon: Briefcase,
    defaultOpen: true,
    items: [
      { label: 'Tổng quan VP Sở', href: '/dashboard/van-phong-so', icon: Briefcase, officeOnly: true },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList, officeOnly: true },
      { label: 'Cảnh báo & việc cần làm', href: '/dashboard/van-phong-so/canh-bao', icon: BellRing, officeOnly: true },
      { label: 'Hồ sơ cán bộ', href: '/dashboard/van-phong-so/ho-so', icon: Users, officeOnly: true },
      { label: 'Quản lý lương', href: '/dashboard/van-phong-so/luong', icon: Wallet, officeOnly: true },
      { label: 'Các cháu & thành tích', href: '/dashboard/van-phong-so/cac-chau', icon: Baby, officeOnly: true },
      { label: 'Nâng lương (quy trình)', href: '/dashboard/van-phong-so/nang-luong', icon: ScrollText, officeOnly: true },
      { label: 'Thi đua, khen thưởng', href: '/dashboard/van-phong-so/thi-dua-khen-thuong', icon: Award, officeOnly: true },
      { label: 'Đánh giá, xếp loại & kỷ luật', href: '/dashboard/van-phong-so/danh-gia', icon: ClipboardCheck, officeOnly: true },
      { label: 'Nghỉ phép (toàn Sở)', href: '/dashboard/van-phong-so/nghi-phep', icon: CalendarDays, officeOnly: true },
      { label: 'Kho văn bản đã sinh', href: '/dashboard/van-phong-so/van-ban', icon: FileText, officeOnly: true },
      { label: 'Đào tạo, bồi dưỡng', href: '/dashboard/van-phong-so/dao-tao-boi-duong', icon: GraduationCap, officeOnly: true },
      { label: 'Pháp chế', href: '/dashboard/van-phong-so/phap-che', icon: Gavel, officeOnly: true },
      { label: 'Quy trình rà soát VBQPPL – TTHC', href: '/dashboard/van-phong-so/tham-dinh', icon: ScrollText, officeOnly: true },
      { label: 'ISO & Cải cách hành chính', href: '/dashboard/van-phong-so/iso-cchc', icon: ClipboardCheck, officeOnly: true },
      { label: 'Chuyển đổi số & Đề án 06', href: '/dashboard/van-phong-so/chuyen-doi-so', icon: Network, officeOnly: true },
      { label: 'Văn thư – Lưu trữ', href: '/dashboard/van-phong-so/van-thu-luu-tru', icon: ScrollText, officeOnly: true },
      { label: 'Hành chính – Quản trị', href: '/dashboard/van-phong-so/hanh-chinh-quan-tri', icon: Package, officeOnly: true },
      { label: 'Báo cáo tổng hợp', href: '/dashboard/van-phong-so/bao-cao', icon: BarChart3, officeOnly: true },
    ],
  },
  {
    // Nhóm nghiệp vụ Phòng Hạ tầng kỹ thuật — hiện cho admin / cán bộ HTKT / có htkt:menu_access
    // (điều khiển qua htktOnly = canHtkt). Chức năng theo QĐ 331/QĐ-SXD mục 7.
    label: 'Phòng Hạ tầng kỹ thuật',
    icon: Building2,
    defaultOpen: true,
    items: [
      { label: 'Tổng quan phòng HTKT', href: '/dashboard/phong-htkt', icon: Building2, htktOnly: true },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList, htktOnly: true },
      { label: 'Đơn vị hành chính (DT - dân số)', href: '/dashboard/phong-htkt/don-vi-hanh-chinh', icon: Map, htktOnly: true },
      { label: 'Kế hoạch kiểm tra QLNN', href: '/dashboard/phong-htkt/ke-hoach-kiem-tra', icon: CalendarCheck, htktOnly: true },
      { label: 'Kiểm kê hồ sơ & Soạn thảo AI', href: '/dashboard/phong-htkt/soan-thao', icon: Sparkles, htktOnly: true },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-htkt/phap-ly', icon: Gavel, htktOnly: true },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-htkt/tham-dinh', icon: ClipboardCheck, htktOnly: true },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-htkt/tham-muu', icon: Lightbulb, htktOnly: true },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-htkt/mau-bieu', icon: FileText, htktOnly: true },
      { label: 'Cấp nước sạch đô thị', href: '/dashboard/phong-htkt/cap-nuoc', icon: Droplets, htktOnly: true },
      { label: 'Thoát nước & xử lý nước thải', href: '/dashboard/phong-htkt/thoat-nuoc', icon: Waves, htktOnly: true },
      { label: 'Công viên, cây xanh đô thị', href: '/dashboard/phong-htkt/cay-xanh', icon: TreePine, htktOnly: true },
      { label: 'Chiếu sáng đô thị', href: '/dashboard/phong-htkt/chieu-sang', icon: Lightbulb, htktOnly: true },
      { label: 'HTKT & chiếu sáng thông minh', href: '/dashboard/phong-htkt/do-thi-thong-minh', icon: Cpu, htktOnly: true },
      { label: 'Nghĩa trang & cơ sở hỏa táng', href: '/dashboard/phong-htkt/nghia-trang', icon: Landmark, htktOnly: true },
      { label: 'Hạ tầng giao thông đô thị', href: '/dashboard/phong-htkt/giao-thong-do-thi', icon: Route, htktOnly: true },
      { label: 'Không gian xây dựng ngầm', href: '/dashboard/phong-htkt/khong-gian-ngam', icon: Network, htktOnly: true },
      { label: 'Sử dụng chung công trình HTKT', href: '/dashboard/phong-htkt/su-dung-chung', icon: Share2, htktOnly: true },
      { label: 'Báo cáo đường bảo trì (TT Bảo trì)', href: '/dashboard/phong-htkt/bao-tri-duong', icon: Wrench, htktOnly: true },
    ],
  },
  // ── Các phòng chuyên môn khác (QĐ 331) — gate theo mã phòng (to_chuc.ma).
  // Admin + cán bộ phòng đó thấy. Hiện mới có mục "Công việc của phòng"; nghiệp vụ
  // riêng từng phòng sẽ bổ sung dần.
  {
    label: 'Phòng Kế hoạch - Tài chính', icon: Wallet, defaultOpen: false, deptMa: 'PHONG_KH_TC',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-kh-tc', icon: Wallet },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-kh-tc/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-kh-tc/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-kh-tc/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-kh-tc/mau-bieu', icon: FileText },
      { label: 'Kế hoạch phát triển ngành', href: '/dashboard/phong-kh-tc/ke-hoach-phat-trien', icon: TrendingUp },
      { label: 'Đấu thầu', href: '/dashboard/phong-kh-tc/dau-thau', icon: ClipboardCheck },
      { label: 'Kế hoạch vốn & dự toán', href: '/dashboard/phong-kh-tc/ke-hoach-von', icon: Banknote },
      { label: 'Tài chính - kế toán', href: '/dashboard/phong-kh-tc/tai-chinh-ke-toan', icon: Calculator },
      { label: 'Thống kê ngành', href: '/dashboard/phong-kh-tc/thong-ke', icon: BarChart3 },
    ],
  },
  {
    label: 'Phòng Quản lý hoạt động xây dựng', icon: Wrench, defaultOpen: false, deptMa: 'PHONG_QLHD_XD',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-qlhd-xd', icon: Wrench },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-qlhd-xd/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-qlhd-xd/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-qlhd-xd/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-qlhd-xd/mau-bieu', icon: FileText },
      { label: 'Cấp phép xây dựng', href: '/dashboard/phong-qlhd-xd/cap-phep-xay-dung', icon: ShieldCheck },
      { label: 'Quản lý trật tự xây dựng', href: '/dashboard/phong-qlhd-xd/trat-tu-xay-dung', icon: AlertTriangle },
      { label: 'Thẩm định dự án, thiết kế', href: '/dashboard/phong-qlhd-xd/tham-dinh-du-an', icon: ClipboardCheck },
      { label: 'Chứng chỉ & nhà thầu nước ngoài', href: '/dashboard/phong-qlhd-xd/chung-chi-nha-thau', icon: Award },
      { label: 'Hồ sơ cấp chứng chỉ hành nghề', href: '/dashboard/phong-qlhd-xd/chung-chi-nha-thau/ho-so', icon: FileText },
      { label: 'Thí nghiệm chuyên ngành', href: '/dashboard/phong-qlhd-xd/thi-nghiem-chuyen-nganh', icon: FlaskConical },
    ],
  },
  {
    label: 'Phòng Kinh tế và Vật liệu xây dựng', icon: Package, defaultOpen: false, deptMa: 'PHONG_KT_VL',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-kt-vl', icon: Package },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-kt-vl/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-kt-vl/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-kt-vl/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-kt-vl/mau-bieu', icon: FileText },
      { label: 'Định mức, đơn giá, chỉ số giá XD', href: '/dashboard/phong-kt-vl/dinh-muc-don-gia', icon: BarChart3 },
      { label: 'Công bố giá VLXD', href: '/dashboard/phong-kt-vl/cong-bo-gia-vlxd', icon: FileSpreadsheet },
      { label: 'Thẩm định dự toán quy hoạch', href: '/dashboard/phong-kt-vl/tham-dinh-du-toan-qh', icon: ClipboardCheck },
      { label: 'Quản lý VLXD & khoáng sản', href: '/dashboard/phong-kt-vl/quan-ly-vlxd-khoang-san', icon: Factory },
    ],
  },
  {
    label: 'Phòng Phát triển đô thị', icon: TrendingUp, defaultOpen: false, deptMa: 'PHONG_PTDT',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-ptdt', icon: TrendingUp },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-ptdt/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-ptdt/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-ptdt/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-ptdt/mau-bieu', icon: FileText },
      { label: 'Chương trình phát triển đô thị', href: '/dashboard/phong-ptdt/chuong-trinh-ptdt', icon: Building2 },
      { label: 'Phân loại đô thị', href: '/dashboard/phong-ptdt/phan-loai-do-thi', icon: Landmark },
      { label: 'Đô thị thông minh & TT xanh', href: '/dashboard/phong-ptdt/do-thi-thong-minh', icon: Zap },
      { label: 'Góp ý dự án khu đô thị', href: '/dashboard/phong-ptdt/tham-dinh-htkt-khu-do-thi', icon: Network },
      { label: 'CSDL phát triển đô thị', href: '/dashboard/phong-ptdt/csdl-ptdt', icon: Boxes },
    ],
  },
  {
    label: 'Phòng Quy hoạch - Kiến trúc', icon: Map, defaultOpen: false, deptMa: 'PHONG_QH_KT',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-qh-kt', icon: Map },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-qh-kt/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-qh-kt/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-qh-kt/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-qh-kt/mau-bieu', icon: FileText },
      { label: 'CSDL quy hoạch ĐT-NT', href: '/dashboard/phong-qh-kt/csdl-quy-hoach', icon: Boxes },
      { label: 'Thẩm định, phê duyệt quy hoạch', href: '/dashboard/phong-qh-kt/tham-dinh-quy-hoach', icon: ClipboardCheck },
      { label: 'Thiết kế đô thị', href: '/dashboard/phong-qh-kt/thiet-ke-do-thi', icon: PencilRuler },
      { label: 'Quy chế quản lý kiến trúc', href: '/dashboard/phong-qh-kt/quy-che-kien-truc', icon: Landmark },
      { label: 'Chứng chỉ hành nghề kiến trúc', href: '/dashboard/phong-qh-kt/chung-chi-kien-truc', icon: Award },
    ],
  },
  {
    label: 'Phòng Quản lý nhà & BĐS', icon: Landmark, defaultOpen: false, deptMa: 'PHONG_QL_NHA',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-ql-nha', icon: Landmark },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-ql-nha/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-ql-nha/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-ql-nha/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-ql-nha/mau-bieu', icon: FileText },
      { label: 'Chương trình phát triển nhà ở', href: '/dashboard/phong-ql-nha/phat-trien-nha-o', icon: Building2 },
      { label: 'Nhà ở xã hội, nhà công vụ', href: '/dashboard/phong-ql-nha/nha-o-xa-hoi', icon: Users },
      { label: 'Định giá nhà', href: '/dashboard/phong-ql-nha/dinh-gia-nha', icon: Calculator },
      { label: 'Thị trường BĐS & môi giới', href: '/dashboard/phong-ql-nha/thi-truong-bds', icon: TrendingUp },
      { label: 'Hệ thống thông tin nhà ở & BĐS', href: '/dashboard/phong-ql-nha/he-thong-thong-tin', icon: Boxes },
    ],
  },
  {
    label: 'Phòng Quản lý vận tải', icon: Bus, defaultOpen: false, deptMa: 'PHONG_QL_VT',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-ql-vt', icon: Bus },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-ql-vt/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-ql-vt/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-ql-vt/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-ql-vt/mau-bieu', icon: FileText },
      { label: 'Đăng ký, đăng kiểm đường thủy', href: '/dashboard/phong-ql-vt/dang-kiem-duong-thuy', icon: Ship },
      { label: 'Đào tạo, sát hạch GPLX', href: '/dashboard/phong-ql-vt/dao-tao-sat-hach', icon: GraduationCap },
      { label: 'Quản lý vận tải, bến xe, taxi', href: '/dashboard/phong-ql-vt/quan-ly-van-tai', icon: Route },
      { label: 'Vận tải hành khách công cộng', href: '/dashboard/phong-ql-vt/van-tai-cong-cong', icon: Bus },
      { label: 'Hợp tác xã GTVT', href: '/dashboard/phong-ql-vt/htx-gtvt', icon: Users },
    ],
  },
  {
    label: 'Phòng Quản lý kết cấu HT giao thông', icon: Settings2, defaultOpen: false, deptMa: 'PHONG_QLKCHT',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-qlkcht', icon: Settings2 },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-qlkcht/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-qlkcht/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-qlkcht/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-qlkcht/mau-bieu', icon: FileText },
      { label: 'Kết cấu hạ tầng giao thông', href: '/dashboard/phong-qlkcht/ket-cau-ha-tang', icon: Route },
      { label: 'An toàn giao thông', href: '/dashboard/phong-qlkcht/an-toan-giao-thong', icon: AlertTriangle },
      { label: 'Cấp phép thi công đường bộ', href: '/dashboard/phong-qlkcht/cap-phep-thi-cong', icon: ShieldCheck },
      { label: 'Bến xe, bãi đỗ, cảng bến', href: '/dashboard/phong-qlkcht/ben-xe-cang-ben', icon: Building2 },
      { label: 'Phá dỡ tàu biển & NTM', href: '/dashboard/phong-qlkcht/pha-do-nong-thon-moi', icon: Ship },
    ],
  },
  {
    label: 'Phòng QLCL công trình giao thông', icon: ShieldCheck, defaultOpen: false, deptMa: 'PHONG_CLCT',
    items: [
      { label: 'Tổng quan phòng', href: '/dashboard/phong-clct', icon: ShieldCheck },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Cơ sở pháp lý', href: '/dashboard/phong-clct/phap-ly', icon: Scale },
      { label: 'Quy trình thẩm định', href: '/dashboard/phong-clct/tham-dinh', icon: ClipboardCheck },
      { label: 'Công tác tham mưu', href: '/dashboard/phong-clct/tham-muu', icon: Lightbulb },
      { label: 'Mẫu biểu & văn bản', href: '/dashboard/phong-clct/mau-bieu', icon: FileText },
      { label: 'Thẩm định BCNCKT, thiết kế', href: '/dashboard/phong-clct/tham-dinh-thiet-ke', icon: ClipboardCheck },
      { label: 'Kiểm tra công tác nghiệm thu', href: '/dashboard/phong-clct/kiem-tra-nghiem-thu', icon: ClipboardList },
      { label: 'Chất lượng & an toàn thi công', href: '/dashboard/phong-clct/chat-luong-an-toan', icon: ShieldCheck },
      { label: 'Bảo trì công trình giao thông', href: '/dashboard/phong-clct/bao-tri-cong-trinh', icon: Wrench },
      { label: 'Giám định tư pháp & định mức', href: '/dashboard/phong-clct/giam-dinh-dinh-muc', icon: Gavel },
    ],
  },
  {
    label: 'TT Quản lý, bảo trì GT & HTKT', icon: Wrench, defaultOpen: false, deptMa: 'BAN_BAO_TRI_GT',
    items: [
      { label: 'Tổng quan Trung tâm', href: '/dashboard/trung-tam-bao-tri', icon: Wrench },
      { label: 'Công việc của phòng', href: '/dashboard/cong-viec', icon: ClipboardList },
      { label: 'Tuyến đường mặt cắt ≥ 20m', href: '/dashboard/trung-tam-bao-tri/tuyen-duong-mat-cat-lon', icon: Route },
      { label: 'Chiếu sáng & Đèn tín hiệu', href: '/dashboard/trung-tam-bao-tri/chieu-sang', icon: Lightbulb },
      { label: 'Thoát nước', href: '/dashboard/trung-tam-bao-tri/thoat-nuoc', icon: Droplets },
    ],
  },
  {
    label: 'Cấu hình',
    icon: Settings,
    defaultOpen: false,
    superAdminOnly: true,   // chỉ admin thấy toàn bộ nhóm Cấu hình
    items: [
      { label: 'Danh mục', href: '/dashboard/danh-muc', icon: BookOpen },
      { label: 'Import dữ liệu lương', href: '/dashboard/cai-dat/luong', icon: Wallet, salaryOnly: true },
      { label: 'Tích hợp Cổng Công dân', href: '/dashboard/cai-dat/tich-hop', icon: Link2, adminOnly: true },
      { label: 'Quản trị hệ thống', href: '/dashboard/cai-dat', icon: Settings, superAdminOnly: true },
      { label: 'Thống kê Chatbot AI', href: '/dashboard/cai-dat/chatbot-log', icon: MessageSquare, superAdminOnly: true },
    ],
  },
]

type SidebarProps = {
  roleName: string
  email: string
  canOffice?: boolean
  canHtkt?: boolean
  canCongViec?: boolean
  toChucMa?: string | null
  mobileOpen?: boolean
  onClose?: () => void
}

export function SidebarNew({ roleName, email, canOffice = false, canHtkt = false, canCongViec = false, toChucMa = null, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = roleName === 'admin'
  // Lãnh đạo Sở (GĐ/PGĐ thuộc nhóm LANH_DAO_SO) — xem được module của TẤT CẢ các phòng.
  const isLeader = toChucMa === 'LANH_DAO_SO'
  const isAdminOrManager = isAdmin || roleName === 'manager'
  const canSalary = isAdmin || SALARY_IMPORT_EMAILS.has(email)

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navGroups.filter((g) => g.defaultOpen).map((g) => g.label))
  )

  const toggleGroup = (label: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(label)) {
      newExpanded.delete(label)
    } else {
      newExpanded.add(label)
    }
    setExpandedGroups(newExpanded)
  }

  const isItemVisible = (item: NavItem): boolean => {
    if (item.superAdminOnly) return isAdmin
    if (item.salaryOnly) return canSalary
    if (item.officeOnly) return canOffice
    if (item.htktOnly) return canHtkt
    if (item.congViecOnly) return canCongViec
    if (item.adminOnly) return isAdminOrManager
    return true
  }

  return (
    <>
      {/* Overlay mờ phía sau menu (chỉ mobile khi mở) */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 border-r border-slate-800',
          'transform transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <img
            src="/logo-htkt.png"
            alt="Logo HTKT"
            className="w-10 h-10 rounded-lg object-contain bg-white shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-black text-white uppercase leading-tight" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>
              HỆ THỐNG QLHT
            </p>
            <p className="font-black text-white uppercase leading-tight" style={{ fontSize: '11px', letterSpacing: '0.03em' }}>
              KỸ THUẬT ĐÔ THỊ
            </p>
            <p className="text-[10px] text-amber-300 font-semibold uppercase mt-0.5">TỈNH QUẢNG TRỊ</p>
          </div>
          {/* Nút đóng menu (chỉ mobile) */}
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 -mr-1 shrink-0"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <SidebarStats />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {navGroups.map((group) => {
            if (group.superAdminOnly && !isAdmin) return null
            // Nhóm theo phòng: admin + lãnh đạo Sở + cán bộ phòng đó thấy; hiện tất cả items.
            if (group.deptMa && !(isAdmin || isLeader || toChucMa === group.deptMa)) return null
            const visibleItems = group.deptMa ? group.items : group.items.filter(isItemVisible)
            if (visibleItems.length === 0) return null

            const isExpanded = expandedGroups.has(group.label)
            const GroupIcon = group.icon

            return (
              <div key={group.label} className="space-y-0.5">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-2 border-l border-slate-700 ml-2">
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const isActive =
                        item.href === '/dashboard'
                          ? pathname === '/dashboard'
                          : pathname.startsWith(item.href)

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                            isActive
                              ? 'bg-blue-700 text-white shadow-sm'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'
                            )}
                          />
                          <span className="truncate flex-1 text-xs">{item.label}</span>
                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center">v1.0.0 — QL HTKT</p>
        </div>
      </aside>
    </>
  )
}
