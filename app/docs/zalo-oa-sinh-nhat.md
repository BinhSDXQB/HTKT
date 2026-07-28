# Tích hợp Zalo OA để chúc mừng sinh nhật cán bộ

> Mục tiêu: gửi lời chúc sinh nhật qua Zalo (kênh phổ biến ở VN) thay/bổ sung cho Telegram.
> Hướng đã chọn: **ưu tiên miễn phí** → đăng **tin truyền thông (broadcast)** tới người đã "quan tâm" OA.

## 0. Ràng buộc cần nhớ (quan trọng)

- Bot/OA Zalo **KHÔNG** tự nhắn riêng cho một người vào ngày bất kỳ.
- Tin **miễn phí** (tin tư vấn/CS) chỉ gửi trong **48 giờ** kể từ khi người đó nhắn cho OA.
- Để chủ động vào đúng ngày sinh nhật mà **miễn phí** → chỉ có **broadcast tới follower** (công khai, có hạn mức/tháng, Zalo duyệt nội dung).
- Muốn gửi **riêng từng người theo SĐT, đúng ngày** → bắt buộc **ZNS có phí** (vài trăm đồng/tin, cần template duyệt + nạp tiền).

## 1. Kiểm tra Sở đã có Zalo OA chưa

1. Vào https://oa.zalo.me → đăng nhập bằng tài khoản Zalo của lãnh đạo/văn phòng.
2. Nếu hiện ra Official Account tên "Sở Xây dựng …" → **đã có OA**, ghi lại **OA ID**.
3. Nếu không có → cần **tạo mới**: https://oa.zalo.me → Tạo OA → loại **Cơ quan nhà nước / Doanh nghiệp** → nộp hồ sơ xác thực (quyết định thành lập, người đại diện…). Zalo duyệt vài ngày.

## 2. Tạo app và lấy khoá

1. Vào https://developers.zalo.me → Tạo ứng dụng.
2. Vào app → **Official Account** → **liên kết** OA của Sở (cần quyền admin OA).
3. Ghi lại: `app_id`, `secret_key` (Cài đặt ứng dụng).

## 3. Lấy Access Token + Refresh Token (OAuth v4)

1. Trong app → Official Account → "Cấp quyền cho ứng dụng" → lấy **authorization code** (oauth_code).
2. Đổi code lấy token:
   ```
   POST https://oauth.zaloapp.com/v4/oa/access_token
   Header: secret_key: <secret_key>
   Body (x-www-form-urlencoded): app_id, grant_type=authorization_code, code=<oauth_code>
   ```
   → trả về `access_token` (hết hạn ~1 giờ) và `refresh_token` (xoay vòng, ~3 tháng).
3. **Refresh_token phải được lưu lại và cập nhật mỗi lần gia hạn** (hệ thống sẽ tự làm, xem mục 5).

## 4. (Nếu sau này dùng ZNS) Đăng ký template + nạp tiền

- ZNS → Quản lý template → tạo mẫu loại "Chăm sóc khách hàng" với nội dung chúc mừng → chờ Zalo duyệt → lấy `template_id`.
- Nạp tiền tài khoản ZNS.

## 5. Cấu hình `.env` (điền sau khi có khoá)

```
ZALO_APP_ID=...
ZALO_APP_SECRET=...
ZALO_OA_ACCESS_TOKEN=...      # token đầu tiên (sẽ tự gia hạn)
ZALO_OA_REFRESH_TOKEN=...     # refresh token đầu tiên (sẽ tự xoay vòng + ghi lại)
# Nếu dùng ZNS:
# ZALO_ZNS_TEMPLATE_ID=...
```

Refresh token mới sau mỗi lần gia hạn sẽ được ghi vào `zalo-token.json` (đừng commit file này).

## 6. Mang về cho tôi để hoàn tất code

Chỉ cần **OA đã có + `app_id`, `secret_key`, access_token, refresh_token** → báo lại, tôi sẽ:
- Viết `scripts/zalo-lib.mjs`: tự gia hạn token, gửi broadcast (và/hoặc ZNS).
- Thêm chế độ `--zalo` vào `scripts/sinh-nhat.mjs`, chạy song song hoặc thay Telegram.
- Bổ sung webhook bắt sự kiện "quan tâm OA" để map user_id ↔ cán bộ (cho hướng follower).

Trong lúc chờ, Telegram (@Nhansusxd_bot) vẫn chạy bình thường 8:00 mỗi sáng.
