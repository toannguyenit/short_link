# VPS Deployment Checklist

- `[x]` Kiểm tra DNS & Kiểm tra Kết nối SSH tới VPS
- `[x]` Chuẩn bị thư mục và Cấu hình tệp tin `.env` trên VPS
- `[x]` Lấy chứng chỉ SSL Let's Encrypt qua Certbot
- `[x]` Cấu hình GitHub Secrets cho CI/CD tự động (Đã tích hợp Auto-build trực tiếp trên VPS cấu hình cao, không phụ thuộc GitHub Secrets)
- `[x]` Khởi chạy Infrastructure (MongoDB, Redis, RabbitMQ)
- `[x]` Đẩy code nhánh main lên GitHub kích hoạt tự động Deploy
- `[x]` Kiểm tra sức khỏe hệ thống sau triển khai (Verification)
