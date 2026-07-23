# VPS Deployment Checklist (Session: 20260724_vps_deployment)

- `[x]` Kiểm tra DNS & Kiểm tra Kết nối SSH tới VPS
- `[x]` Chuẩn bị thư mục và Cấu hình tệp tin `.env` trên VPS
- `[x]` Lấy chứng chỉ SSL Let's Encrypt qua Certbot cho tên miền `.com`
- `[x]` Khởi chạy Infrastructure (MongoDB, Redis, RabbitMQ)
- `[x]` Sửa lỗi Google Sign-In bằng cách truyền build-arg `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `[x]` Tối ưu hiển thị mã QR (nền trắng cố định) khi bật Dark Mode
- `[x]` Tải bộ cơ sở dữ liệu GeoIP đầy đủ lên VPS và sửa lỗi hiển thị Country/City
- `[x]` Thiết lập và kích hoạt quy trình CI/CD tự động bằng GitHub Actions
- `[x]` Đẩy code nhánh main lên GitHub kích hoạt tự động Deploy
- `[x]` Kiểm tra sức khỏe hệ thống sau triển khai (Verification)
