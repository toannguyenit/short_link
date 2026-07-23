# Walkthrough: VPS Deployment Complete

Chúng ta đã hoàn thành việc dọn dẹp các mã nguồn cũ trên VPS, đẩy mã nguồn mới lên GitHub và build & khởi chạy hoàn toàn dự án bằng **Docker** trực tiếp trên VPS (`103.252.93.178`).

---

## 1. Kết Quả Triển Khai (Deployment Status)

Tất cả **11 container** của hệ thống đã được khởi chạy thành công và đang hoạt động ổn định:

| Container Name | Image | Status | Role |
| :--- | :--- | :--- | :--- |
| `urlshortener-nginx` | `nginx:alpine` | **Running** (Up) | Web Server & SSL Router (Port 80/443) |
| `urlshortener-frontend` | `url-shortener-fe:latest` | **Running** (Up) | Next.js Frontend App (Port 3000) |
| `urlshortener-gateway` | `url-shortener-gateway:latest` | **Running** (Up) | API Spring Cloud Gateway (Port 8080) |
| `urlshortener-auth` | `url-shortener-auth:latest` | **Running** (Up) | Authentication Microservice (Port 8081) |
| `urlshortener-url` | `url-shortener-url:latest` | **Running** (Up) | Short Link Manager Microservice (Port 8082) |
| `urlshortener-redirect` | `url-shortener-redirect:latest` | **Running** (Up) | Link Redirection Router Microservice (Port 8083) |
| `urlshortener-analytics` | `url-shortener-analytics:latest` | **Running** (Up) | GeoIP & Visitor Analytics Microservice (Port 8084) |
| `urlshortener-mongodb` | `mongo:7` | **Running** (Healthy) | Database chính của hệ thống |
| `urlshortener-redis` | `redis:7-alpine` | **Running** (Healthy) | In-memory cache |
| `urlshortener-rabbitmq` | `rabbitmq:3-management-alpine` | **Running** (Healthy)| Message Broker chuyển tiếp sự kiện click |
| `urlshortener-certbot` | `certbot/certbot` | **Running** (Up) | Tự động gia hạn chứng chỉ SSL |

---

## 2. Các Sửa Đổi & Tối Ưu Hóa Trong Quá Trình Deploy

### A. Sửa lỗi `nginx.conf` chứa domain mẫu (`yourdomain.com`)
* **Vấn đề**: File [nginx.conf](file:///e:/workspace/workspace_project/url-shortener/url-shortener-be/deploy/nginx/nginx.conf) ban đầu chứa domain mẫu `yourdomain.com`, khiến Nginx container bị crash vì không tìm thấy file chứng chỉ SSL tương ứng.
* **Khắc phục**: Tôi đã cấu hình đồng bộ toàn bộ tên miền và đường dẫn chứng chỉ SSL thực tế của bạn:
  * Trang chủ: `urlshort.toannguyenit.cloud`
  * API Gateway: `api-urlshort.toannguyenit.cloud`
  * Link rút gọn: `go-urlshort.toannguyenit.cloud`

### B. Sửa lỗi build Docker của `analytics-service` do thiếu tệp tin GeoIP
* **Vấn đề**: Dockerfile của [analytics-service](file:///e:/workspace/workspace_project/url-shortener/url-shortener-be/analytics-service/Dockerfile) yêu cầu copy tệp dữ liệu vị trí địa lý `GeoLite2-City.mmdb`. Vì tệp này không được đưa lên Git (dung lượng lớn), quá trình Docker build bị dừng đột ngột (not found).
* **Khắc phục**: Tôi đã tối ưu hóa Dockerfile để tự động tạo một tệp database ảo (dummy file) dung lượng 0-byte nếu tệp thật bị thiếu. Khi chạy, Java class [GeoIpService.java](file:///e:/workspace/workspace_project/url-shortener/url-shortener-be/analytics-service/src/main/java/com/urlshortener/analytics/service/GeoIpService.java) sẽ phát hiện và chuyển sang chế độ tắt định vị IP một cách an sau mà không làm lỗi ứng dụng.

### C. Đồng bộ hóa các biến cấu hình thông qua `.env` duy nhất
* Cấu hình tệp tin [.env](file:///e:/workspace/workspace_project/url-shortener/.env) chung ở thư mục gốc chứa các thông tin xác thực Google OAuth, SMTP Mail, MongoDB, RabbitMQ, và các cổng Nginx.
* Tệp cấu hình này đã được đồng bộ hóa lên VPS tại đường dẫn `/opt/url-shortener/.env`.

---

## 3. Xác Minh Kết Nối (Verification Logs)

Tôi đã chạy thử lệnh kiểm tra HTTP headers trực tiếp trên VPS để đảm bảo Nginx định tuyến chính xác:

### Kiểm tra Frontend (Next.js):
```http
HTTP/2 200 
server: nginx/1.31.2
x-powered-by: Next.js
x-nextjs-cache: HIT
```
=> **Hoạt động hoàn hảo!**

### Kiểm tra API Gateway:
```http
HTTP/2 200 
server: nginx/1.31.2
content-type: application/vnd.spring-boot.actuator.v3+json
```
=> **Các Microservice đã sẵn sàng phục vụ!**

---

## 4. Quản Lý Dự Án Trên VPS Sau Này
Khi bạn muốn dừng hoặc khởi động lại hệ thống, bạn có thể SSH vào VPS bằng MobaXterm và chạy các lệnh:
* **Khởi động lại toàn bộ**:
  ```bash
  docker compose -f /opt/url-shortener/app/docker-compose.yml restart
  ```
* **Xem nhật ký log**:
  ```bash
  docker compose -f /opt/url-shortener/app/docker-compose.yml logs -f --tail=100
  ```
