# 🎓 NextLMS — Nền Tảng Học Viện & Đào Tạo Trực Tuyến Mã Nguồn Mở Hiện Đại

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](./Dockerfile)

**NextLMS** là nền tảng e-Learning / LMS mã nguồn mở hiện đại, tối ưu hóa cho giảng viên, chuyên gia đào tạo, trung tâm học viện và doanh nghiệp. Hệ thống được xây dựng trên nền tảng **Next.js 15 (App Router)**, **TypeScript**, **Prisma ORM** và **Tailwind CSS**, mang lại tốc độ tải trang cực nhanh cùng giao diện Dark Theme FinTech sang trọng.

Nền tảng tích hợp toàn diện quy trình: **Đăng ký học viên $\rightarrow$ Thanh toán đa kênh (VietQR NAPAS tự động, PayPal, Stripe, Crypto USDT) $\rightarrow$ Kích hoạt 1-click $\rightarrow$ Phòng học LMS chuyên nghiệp (Video Streaming, Đính kèm tài liệu, Q&A thảo luận) $\rightarrow$ Cấp chứng chỉ độc bản PDF**.

## 🚀 Trải Nghiệm & Triển Khai Nhanh

* 🔗 **Website Demo Trực Tuyến (Showcase World Trading Lab)**: [https://nextlms-pro.vercel.app](https://nextlms-pro.vercel.app?niche=ielts)  
* ⚡ **Triển Khai 1-Click Lên Vercel**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdeveloper-final%2FNextLMS&project-name=nextlms-platform&repository-name=nextlms-platform)

---

## 📑 Mục Lục Điều Hướng Nhanh (Table of Contents)

* [🚀 1. Công nghệ & Kiến trúc Hệ thống (Tech Stack)](#-1-công-nghệ--kiến-trúc-hệ-thống-tech-stack)
* [📦 2. Cài đặt & Khởi chạy Nhanh (Quick Start)](#-2-cài-đặt--khởi-chạy-nhanh-quick-start)
* [🔑 3. Tài khoản Mẫu để Thử nghiệm (Sample Accounts)](#-3-tài-khoản-mẫu-để-thử-nghiệm-sample-accounts)
* [📋 4. Hướng dẫn Thao tác Nghiệp vụ Chi tiết](#-4-hướng-dẫn-thao-tác-nghiệp-vụ-chi-tiết)
  * [4.1. Nghiệp vụ Quản trị Khóa học & Bài giảng](#41-nghiệp-vụ-quản-trị-khóa-học--bài-giảng-dành-cho-admin--giảng-viên)
  * [4.2. Nghiệp vụ Đăng ký, Thanh toán & Kích hoạt Khóa học](#42-nghiệp-vụ-đăng-ký-thanh-toán--kích-hoạt-khóa-học)
  * [4.3. Nghiệp vụ Cấp quyền Học viên Thủ công (Manual Enrollment)](#43-nghiệp-vụ-cấp-quyền-học-viên-thủ-công-manual-enrollment)
  * [4.4. Nghiệp vụ Học tập & Cấp Chứng chỉ Tốt nghiệp](#44-nghiệp-vụ-học-tập--cấp-chứng-chỉ-tốt-nghiệp-học-viên)
  * [4.5. Nghiệp vụ Tiếp thị Liên kết & Rút Hoa Hồng (Affiliate & Partner Hub)](#45-nghiệp-vụ-tiếp-thị-liên-kết--rút-hoa-hồng-affiliate--partner-hub)
* [💻 5. Tổng hợp Các Lệnh Thông Dụng (CLI Commands)](#-5-tổng-hợp-các-lệnh-thông-dụng-cli-commands)
* [🎯 6. Động Cơ Demo Đa Ngách Động (Dynamic Multi-Niche Demo Engine)](#-6-động-cơ-demo-đa-ngách-động-dynamic-multi-niche-demo-engine)
  * [6.1. Bảng 7 Ngách Đào Tạo Mẫu Có Sẵn](#61-bảng-7-ngách-đào-tạo-mẫu-có-sẵn-out-of-the-box-niches)
  * [6.2. Cú Pháp Đường Dẫn & Cá Nhân Hóa Khách Hàng](#62-cú-pháp-đường-dẫn--cá-nhân-hóa-khách-hàng-personalized-demo-links)
  * [6.3. Cơ Chế Lưu Cookie Tự Động & Trải Nghiệm Mượt Mà](#63-cơ-chế-lưu-cookie-tự-động--trải-nghiệm-mượt-mà)
  * [6.4. Tiện Ích Trực Quan "Demo Niche Studio"](#64-tiện-ích-trực-quan-demo-niche-studio)
  * [6.5. Nạp Dữ Liệu Mẫu Đa Ngách Vào Database (Seed Data)](#65-nạp-dữ-liệu-mẫu-đa-ngách-vào-database-seed-data)
  * [6.6. Hướng Dẫn Mở Rộng Thêm Ngách Mới (Tùy Chọn)](#66-hướng-dẫn-mở-rộng-thêm-ngách-mới-tùy-chọn)
* [🔄 7. Chuẩn Hóa Nhãn Trắng 100% — Tùy Biến Sang Thương Hiệu Mới (Pure White-Labeling)](#-7-chuẩn-hóa-nhãn-trắng-100--tùy-biến-sang-thương-hiệu-mới-pure-white-labeling)
* [📂 8. Cấu trúc Thư mục Dự án](#-8-cấu-trúc-thư-mục-dự-án)
* [📧 9. Hướng Dẫn Cấu Hình Hệ Thống Gửi Email (Gmail SMTP & Resend API)](#-9-hướng-dẫn-cấu-hình-hệ-thống-gửi-email-gmail-smtp--resend-api)
  * [9.1. Giải Pháp 1: Gửi Qua Gmail SMTP](#91-giải-pháp-1-gửi-qua-gmail-smtp-khuyên-dùng-khi-dùng-subdomain-vercel-hoặc-chưa-có-tên-miền-riêng)
  * [9.2. Giải Pháp 2: Gửi Qua Resend REST API](#92-giải-pháp-2-gửi-qua-resend-rest-api-dành-cho-khi-đã-có-tên-miền-riêng)
  * [9.3. Các Tính Năng Tự Động Gửi Email Trong Hệ Thống](#93-các-tính-năng-tự-động-gửi-email-trong-hệ-thống)
* [🌐 10. Hướng Dẫn Triển Khai Hạ Tầng & CI/CD (Vercel + Neon/Supabase + GitHub Actions)](#-10-hướng-dẫn-triển-khai-hạ-tầng--cicd-vercel--neonsupabase--github-actions)
  * [10.1. Tổng Quan Kiến Trúc Hạ Tầng (Cloud Serverless)](#101-tổng-quan-kiến-trúc-hạ-tầng-cloud-serverless)
  * [10.2. Hướng Dẫn Đưa Dự Án Lên GitHub](#102-hướng-dẫn-đưa-dự-án-lên-github)
  * [10.3. Khởi Tạo Cơ Sở Dữ Liệu Cloud PostgreSQL (Miễn Phí với Neon hoặc Supabase)](#103-khởi-tạo-cơ-sở-dữ-liệu-cloud-postgresql-miễn-phí-với-neon-hoặc-supabase)
  * [10.4. Triển Khai Lên Vercel (Khuyên Dùng - Zero-DevOps)](#104-triển-khai-lên-vercel-khuyên-dùng---zero-devops)
  * [10.5. Triển Khai Lên Cloudflare Pages (Tùy Chọn)](#105-triển-khai-lên-cloudflare-pages-tùy-chọn)
  * [10.6. Quy Trình CI/CD Tự Động Với GitHub Actions](#106-quy-trình-cicd-tự-động-với-github-actions)
  * [10.7. Hướng Dẫn Triển Khai Tác Vụ Chạy Nền & Cron Jobs Tự Động](#107-hướng-dẫn-triển-khai-tác-vụ-chạy-nền--cron-jobs-tự-động-background-tasks--maintenance)
  * [10.8. Triển Khai & Cập Nhật Tự Động Trên Máy Chủ Riêng / VPS (Self-Hosted VPS & Docker)](#108-triển-khai--cập-nhật-tự-động-trên-máy-chủ-riêng--vps-self-hosted-vps--docker)
* [🤖 11. AI Copilot — Trợ Lý Sáng Tạo Nội Dung Tích Hợp (AI Content Assistant)](#-11-ai-copilot--trợ-lý-sáng-tạo-nội-dung-tích-hợp-ai-content-assistant)
  * [11.1. Tổng Quan Kiến Trúc & 3 Chế Độ Vận Hành](#111-tổng-quan-kiến-trúc--3-chế-độ-vận-hành)
  * [11.2. Hướng Dẫn Cài Đặt & Cấu Hình](#112-hướng-dẫn-cài-đặt--cấu-hình)
  * [11.3. Quy Trình Sử Dụng AI Copilot Trong Admin](#113-quy-trình-sử-dụng-ai-copilot-trong-admin)
  * [11.4. Nhà Cung Cấp AI Được Hỗ Trợ](#114-nhà-cung-cấp-ai-được-hỗ-trợ)
* [🛠️ Dịch Vụ Hỗ Trợ Triển Khai & Phát Triển Tính Năng Theo Yêu Cầu](#️-dịch-vụ-hỗ-trợ-triển-khai--phát-triển-tính-năng-theo-yêu-cầu)

---

## 🚀 1. Công nghệ & Kiến trúc Hệ thống (Tech Stack)

* **Framework Fullstack**: **Next.js 15 (App Router, TypeScript, React 19/18)** — Tối ưu SEO vượt trội với Server Components và bảo mật phía Server với Server Actions / Route Handlers.
* **Cơ sở dữ liệu & ORM**: **PostgreSQL** (hoặc SQLite cho local dev) kết hợp **Prisma ORM** — Quản lý dữ liệu quan hệ type-safe, dễ bảo trì và mở rộng.
* **Xác thực & Phân quyền (Auth & RBAC)**: **NextAuth.js (JWT Session)** — Phân quyền chặt chẽ các vai trò `SUPER_ADMIN`, `ADMIN`, `INSTRUCTOR`, `STUDENT`.
* **Cổng Thanh toán Đa Kênh Toàn Diện**: 
  * **VietQR Động Tự Động**: Tích hợp **PayOS** & **SePay** — Sinh mã QR NAPAS chuẩn số tiền và nội dung, tự động kích hoạt khóa học sau 5 giây qua Webhook.
  * **Thanh Toán Quốc Tế**: Hỗ trợ **PayPal** & **Stripe** — Tự động quy đổi VND sang USD theo tỷ giá hệ thống, thanh toán thẻ tín dụng quốc tế an toàn.
  * **Tiền Mã Hóa (Crypto USDT)**: Hỗ trợ thanh toán USDT qua mạng **BEP-20** và **TRC-20** kèm mã QR ví nhận tiền.
  * **Duyệt Chuyển Khoản Thủ Công**: Học viên tải ảnh biên lai (Bill), Admin kiểm tra đối soát và kích hoạt 1-chạm.
* **Media & Storage Đám Mây**: Hỗ trợ **YouTube (API Embed / Unlisted)**, **Cloudflare R2** (Miễn phí 10GB & 100% băng thông tải về), **AWS S3** hoặc Video CDN HTML5.
* **Soạn thảo Nội dung & SEO**: Hỗ trợ Markdown & Rich Text, tự động tạo Sitemap XML, Robots.txt và thẻ Schema JSON-LD chuẩn Google Rich Snippets.

---

## 📦 2. Cài đặt & Khởi chạy Nhanh (Quick Start)

### Yêu cầu hệ thống:
* **Node.js**: Phiên bản 18.x trở lên (khuyên dùng Node 20+ hoặc 24+).
* **NPM**: Phiên bản 9.x trở lên.

### Các bước cài đặt:

1. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**:
   Sao chép file `.env.example` thành `.env` (mặc định đã được cấu hình sẵn SQLite cho máy cục bộ):
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="super-secret-jwt-key-for-elearning-platform-dev-mode-2026"
   
   # Cấu hình Ngân hàng nhận thanh toán VietQR
   BANK_ID="MB"
   BANK_ACCOUNT_NO="0988888888"
   BANK_ACCOUNT_NAME="WORLD TRADING LAB"
   APP_NAME="World Trading Lab"
   ```

3. **Khởi tạo Cơ sở dữ liệu & Tạo Quản trị viên (Super Admin)**:
   * **Cách 1 (Khuyên dùng cho học viện mới — Dữ liệu sạch 100%)**:
     ```bash
     npx prisma db push
     npm run create-admin
     ```
   * **Cách 2 (Thử nghiệm dữ liệu mẫu 4 ngách Trading/IELTS/Baking/Fitness)**:
     ```bash
     npx prisma db push
     node prisma/seed.js
     ```

4. **Khởi chạy máy chủ phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: **`http://localhost:3000`**

### 🐳 Khởi chạy Nhanh Bằng Docker (Dành cho máy chủ VPS riêng):
```bash
# 1. Khởi chạy toàn bộ hệ thống gồm Web App + Database PostgreSQL:
docker compose up -d

# 2. Tạo tài khoản Super Admin:
docker compose exec app node scripts/create-admin.mjs
```

5. **Kiểm tra biên dịch sản phẩm (Production Build)**:
   ```bash
   npm run build
   # hoặc: npx next build
   ```

6. **Sao lưu toàn bộ tệp từ Supabase / S3 về máy cục bộ (`Storage/S3`)**:
   ```bash
   npm run storage:backup
   # hoặc môi trường Production: npm run storage:backup:prod
   ```

7. **Phục hồi hoặc Tải toàn bộ thư mục `Storage/S3` lên Bucket mới (Bất kỳ nhà cung cấp S3/R2 nào)**:
   ```bash
   npm run storage:restore
   # hoặc: npm run storage:upload
   # hoặc môi trường Production: npm run storage:restore:prod
   ```

8. **Cập nhật đồng loạt đường dẫn URL ảnh/media trong Database sang nhà cung cấp mới**:
   ```bash
   # Xem trước danh sách các bản ghi sẽ thay đổi (Dry run an toàn)
   npm run storage:migrate-urls -- --from="https://old-storage.com" --to="https://new-storage.com"

   # Xác nhận cập nhật vĩnh viễn vào Database
   npm run storage:migrate-urls -- --from="https://old-storage.com" --to="https://new-storage.com" --confirm
   ```

---

## 🔑 3. Tài khoản Mẫu để Thử nghiệm (Sample Accounts)

Tại trang Đăng nhập (`/auth/login`), hệ thống có sẵn các nút bấm điền nhanh tài khoản:

| Vai trò | Email | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| 👑 **Quản trị viên (Admin)** | `admin@finlearn.vn` | `123456` | Xem Dashboard doanh thu, Duyệt đơn hàng 1-click, Tạo/Chỉnh sửa khóa học, Cấp quyền học viên |
| 👨‍🏫 **Giảng viên (Instructor)** | `instructor@finlearn.vn` | `123456` | Tạo bài giảng, trả lời câu hỏi Q&A học viên |
| 🎓 **Học viên mẫu (Student)** | `student@finlearn.vn` | `123456` | Đã sở hữu khóa học Masterclass (tiến độ 40%), xem video bài giảng, thảo luận |

> [!TIP]
> **Trạng thái Xác thực Email của Tài khoản Mẫu & Cơ Chế Chống Khóa Quản Trị (Lockout Guard):**
> * Toàn bộ tài khoản mẫu trên đều đã được hệ thống kích hoạt sẵn trạng thái **Đã xác thực Email** (`emailVerified: new Date()`) trong kịch bản nạp dữ liệu (`npm run db:seed`), đảm bảo khách hàng có thể bấm đăng nhập nhanh và trải nghiệm trọn vẹn ngay lập tức.
> * Ngoài ra, hệ thống tích hợp sẵn cơ chế **Chống khóa ngoài Quản trị viên (Lockout Prevention)**: Tài khoản có vai trò `ADMIN` / `SUPER_ADMIN` khi nhập đúng mật khẩu sẽ luôn được tự động xác thực để không bao giờ bị khóa ngoài hệ thống dù bạn bật `REQUIRE_EMAIL_VERIFICATION="true"` trên máy chủ chưa cấu hình kịp dịch vụ gửi thư SMTP.
> * Nếu bạn muốn tạm tắt yêu cầu xác thực email khi tự đăng ký tài khoản mới trong giai đoạn demo/thử nghiệm, chỉ cần đặt `REQUIRE_EMAIL_VERIFICATION="false"` trong file cấu hình `.env`.

---

## 📋 4. Hướng dẫn Thao tác Nghiệp vụ Chi tiết

### 4.1. Nghiệp vụ Quản trị Khóa học & Bài giảng (Dành cho Admin / Giảng viên)

1. **Tạo Khóa học mới**:
   * Truy cập Menu Admin $\rightarrow$ **Tạo Khóa học Mới** (`/admin/courses/new`).
   * Điền các thông tin: *Tiêu đề khóa học, Danh mục, Trình độ, Giá niêm yết, Giá khuyến mãi (Sale), Ảnh Thumbnail, Video giới thiệu (YouTube Embed/CDN)*.
   * Soạn thảo *Mô tả ngắn* và *Mô tả chi tiết bài giảng* (hỗ trợ Markdown).
2. **Thiết lập Đề cương Giáo trình (Chương & Bài học)**:
   * Bấm **"+ Thêm Chương mới"** để tạo từng phần kiến thức (VD: *Chương 1: Cấu trúc thị trường*).
   * Trong mỗi chương, bấm **"+ Thêm bài học"**:
     * Nhập tên bài học.
     * Điền đường link Video YouTube (VD: `https://www.youtube.com/watch?v=...`) hoặc Video CDN MP4.
     * Nhập thời lượng bài giảng (tính theo giây, VD: `1200` = 20 phút).
     * Tích chọn **"Xem thử"** nếu muốn mở miễn phí bài học này cho khách trải nghiệm trước khi mua.
   * Bấm **"Xuất bản Khóa học Ngay"**.

### 4.2. Nghiệp vụ Đăng ký, Thanh toán & Kích hoạt Khóa học

1. **Khóa học Miễn phí (Free Course)**:
   * Học viên bấm "Đăng ký học Miễn phí" $\rightarrow$ Hệ thống tự động kích hoạt quyền học và chuyển ngay vào phòng học.
2. **Khóa học Trả phí qua VietQR**:
   * Học viên chọn khóa học $\rightarrow$ Bấm "Đăng ký Khóa học Ngay".
   * Có thể nhập Mã giảm giá (Coupon): `WTL50` (Giảm 50%) hoặc `TRADER200` (Giảm 200.000 ₫).
   * Bấm **"Tiến hành Thanh toán"** $\rightarrow$ Hệ thống sinh mã đơn hàng (VD: `EL-98234`) và mã VietQR động chuẩn số tiền.
   * Học viên quét mã QR bằng App ngân hàng $\rightarrow$ Bấm **"Tôi đã chuyển khoản xong"** (có thể kèm link ảnh chụp bill).
3. **Duyệt Đơn hàng 1-Click (Admin)**:
   * Admin vào mục **Quản lý Đơn hàng** (`/admin/orders`).
   * Xem danh sách các đơn hàng có trạng thái `Chờ duyệt`.
   * Bấm nút **"Xem Bill"** để kiểm tra ảnh biên lai chuyển tiền.
   * Bấm nút **"✓ Duyệt & Kích hoạt"** $\rightarrow$ Hệ thống tự động chuyển trạng thái đơn sang `Đã thanh toán` và cấp quyền vào học ngay cho học viên.

### 4.3. Nghiệp vụ Cấp quyền Học viên Thủ công (Manual Enrollment)

* Áp dụng khi tặng khóa học cho đối tác, học viên VIP hoặc thanh toán tiền mặt trực tiếp:
* Admin vào mục **Quản lý Học viên** (`/admin/students`).
* Tìm kiếm học viên theo Tên hoặc Email $\rightarrow$ Bấm nút **"Cấp quyền học"**.
* Chọn khóa học muốn cấp $\rightarrow$ Bấm **"Xác nhận Cấp quyền"**.

### 4.4. Nghiệp vụ Học tập & Cấp Chứng chỉ Tốt nghiệp (Học viên)

* Học viên vào mục **Khóa học của tôi** (`/my-courses`) $\rightarrow$ Bấm **"Tiếp tục học"**.
* Trình phát LMS mở bài giảng (Video HD không bị phân tâm bởi quảng cáo).
* Học viên có thể đặt câu hỏi tại tab **"Hỏi đáp & Thảo luận"** dưới video.
* Sau khi học xong, bấm **"Đánh dấu Hoàn thành"** $\rightarrow$ Thanh tiến độ tăng `%` và tự động nhảy sang bài tiếp theo.
* Khi hoàn thành **100%** bài học $\rightarrow$ Hệ thống tự động bật Modal vinh danh và cấp mã chứng chỉ độc bản `CERT-WTL-PRO` để tải file PDF.

### 4.5. Nghiệp vụ Tiếp thị Liên kết & Rút Hoa Hồng (Affiliate & Partner Hub)

Hệ thống tích hợp sẵn mạng lưới **Tiếp thị liên kết tự động (Referral Marketing)** giúp biến mọi học viên và đối tác thành cộng tác viên phân phối khóa học:

1. **Dành cho Đối tác / Học viên Tiếp thị (`/affiliate`)**:
   * **Lấy link & mã giới thiệu**: Truy cập menu **Tiếp thị liên kết** trên thanh điều hướng hoặc đường dẫn `/affiliate`. Hệ thống tự động cấp mã ref độc quyền (ví dụ: `REF-A83F1`). Đối tác có thể sao chép đường link tiếp thị dạng:
     `https://ten-mien-cua-ban.com/?ref=REF-A83F1` (hoặc `?aff=REF-A83F1`).
   * **Theo dõi hiệu quả chiến dịch thời gian thực**:
     * **Số lượt nhấp (Clicks)**: Đo lường mức độ quan tâm của người dùng nhấp vào link.
     * **Số đơn giới thiệu (Referrals)**: Số lượng học viên đã mua khóa học qua mã ref.
     * **Số dư hoa hồng đa tầng**: Phân tách rõ ràng giữa *Chờ duyệt (Pending)*, *Khả dụng (Approved)*, và *Đã thanh toán (Paid)*.
   * **Cập nhật tài khoản ngân hàng thụ hưởng**:
     * Điền thông tin: *Tên ngân hàng (Vietcombank, MB, Techcombank,...), Số tài khoản, Tên chủ tài khoản*.
     * Bấm **"Cập nhật thông tin nhận tiền"** để lưu an toàn vào hệ thống.
   * **Tạo yêu cầu rút tiền (Payout Request)**:
     * Khi số dư khả dụng đạt tối thiểu **200.000 ₫**, nhập số tiền muốn rút và bấm **"Gửi yêu cầu rút tiền"**.
     * Hệ thống ghi nhận yêu cầu và đối tác có thể theo dõi tiến độ duyệt trực tiếp trong lịch sử giao dịch.

2. **Dành cho Quản trị viên (Admin Partner Hub - `/admin/affiliates`)**:
   * **Bảng điều khiển KPI toàn diện**: Theo dõi tổng doanh thu do đối tác mang lại, tổng hoa hồng đã phát sinh, hoa hồng đang chờ thanh toán và số lượng đối tác tích cực.
   * **Quản lý danh sách Đối tác (Affiliates)**:
     * Xem chi tiết từng đối tác: Tên, Email, Mã ref, Doanh số mang về, Số lượt mua thành công.
     * **Tùy chỉnh tỷ lệ hoa hồng riêng (`customCommissionRate`)**: Bấm biểu tượng ✏️ Chỉnh sửa để gán mức hoa hồng đặc biệt cho từng đối tác (ví dụ: 30% cho học viên VIP, 40% cho KOLs/KOCs). Nếu để trống hoặc `0`, hệ thống tự động áp dụng tỷ lệ chuẩn sàn (mặc định 20%).
   * **Tra cứu lịch sử hoa hồng (Commissions Log)**:
     * Kiểm tra từng khoản hoa hồng phát sinh gắn với Mã đơn hàng, Tên khóa học, Học viên mua, Doanh thu đơn hàng, Tỷ lệ hoa hồng và Trạng thái (`PENDING` $\rightarrow$ `APPROVED` $\rightarrow$ `PAID`).
   * **Xét duyệt yêu cầu rút tiền (Payout Requests)**:
     * Xem danh sách các lệnh rút tiền đang chờ xử lý kèm đầy đủ số tài khoản và ngân hàng thụ hưởng của đối tác.
     * Sau khi chuyển khoản ngân hàng thành công, Admin bấm **"✓ Duyệt thanh toán"** $\rightarrow$ Hệ thống tự động chuyển trạng thái lệnh sang `APPROVED` và cập nhật các khoản hoa hồng liên quan sang `PAID`.
     * Nếu có sai lệch, Admin có thể bấm **"✕ Từ chối"** kèm lý do $\rightarrow$ Số tiền sẽ được hoàn lại số dư khả dụng của đối tác.

3. **Cơ chế Bảo vệ & Tự động hóa Vận hành**:
   * **Last-click Cookie Tracking (30 ngày)**: Cookie `wtl_ref` được lưu an toàn tại trình duyệt người mua trong 30 ngày. Khách hàng duyệt nhiều trang hoặc quay lại mua sau vài tuần vẫn ghi nhận hoa hồng chính xác cho đối tác cuối cùng giới thiệu.
   * **Ngăn chặn tự giới thiệu (Anti-Self-Referral Guard)**: Hệ thống tự động chặn tuyệt đối trường hợp học viên tự dùng mã ref của chính mình để mua khóa học nhằm trục lợi chiết khấu.
   * **Chu kỳ tạm giữ 7 ngày an toàn (Holding Period)**: Hoa hồng mới phát sinh được đưa vào trạng thái `PENDING` trong 7 ngày để phòng ngừa rủi ro hoàn tiền hoặc tranh chấp đơn hàng.
   * **Tự động kích hoạt hoa hồng khả dụng**: Tác vụ nền hàng ngày (`/api/cron/cleanup`) sẽ tự động quét và chuyển các khoản hoa hồng đã vượt qua thời hạn tạm giữ 7 ngày sang trạng thái `APPROVED` để đối tác có thể rút tiền.

---

## 💻 5. Tổng hợp Các Lệnh Thông Dụng (CLI Commands)

| Lệnh | Mục đích sử dụng |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển cục bộ tại `http://localhost:3000` |
| `npm run build` | Biên dịch tối ưu toàn bộ dự án cho môi trường Production (Standalone bundle) |
| `npm start` | Chạy ứng dụng đã build ở chế độ Production |
| `npm run create-admin` | CLI khởi tạo tài khoản Super Admin sạch đầu tiên cho học viện mới |
| `npm run create-admin:prod` | Khởi tạo tài khoản Super Admin trực tiếp trên Database Production |
| `docker compose up -d` | Khởi chạy toàn bộ hệ thống gồm Next.js App + PostgreSQL trong Docker |
| `npm run type-check` | Kiểm tra lỗi kiểu dữ liệu TypeScript toàn dự án (`tsc --noEmit`) |
| `npm run lint` | Soát lỗi cú pháp và tiêu chuẩn mã nguồn |
| `npm test` | Chạy bộ kiểm thử tự động 270+ test cases với Vitest |
| `npm run ci` | Chạy toàn bộ chuỗi kiểm tra chất lượng (Type-check, Lint, Test) như GitHub Actions |
| `npm run db:migrate` | Áp dụng các migration CSDL mới nhất vào Database (`prisma migrate deploy`) |
| `npm run deploy:docker` | Kéo code mới, tự động chạy migration CSDL và triển khai lại toàn bộ container Docker |
| `npm run dev:ai` | Khởi chạy Dev AI Bridge Worker — trợ lý AI tự động sinh nội dung cho môi trường phát triển |
| `npm run deploy:vps` | Kéo code mới, chạy migration CSDL trước, build Next.js và reload PM2 trên VPS |
| `npx prisma db push` | Đẩy trực tiếp thay đổi schema vào Database nội bộ (chỉ nên dùng khi local prototyping) |
| `npx prisma studio` | Mở giao diện đồ họa GUI trên trình duyệt để xem và sửa trực tiếp dữ liệu DB |
| `npm run db:seed` | Nạp dữ liệu mẫu 7 ngách cho môi trường Dev (Trading, IELTS, Bánh, Gym, IT, demo Affiliate) |
| `npm run db:seed:prod` | Seed an toàn cho Production (`prisma/seed-prod.js`): Không xóa dữ liệu, upsert Settings (Affiliate, VietQR), Categories chuẩn & cấp `referralCode` cho User |
| `npm run db:seed:prod:safe` | Chạy trực tiếp script seed an toàn Production không qua dotenv (dành cho Docker / CI/CD / Vercel Build) |

---

## 🎯 6. Động Cơ Demo Đa Ngách Động (Dynamic Multi-Niche Demo Engine)

Nền tảng được trang bị **Dynamic Multi-Niche Engine** — giải pháp tối ưu giúp bạn **chỉ cần duy nhất một trang web demo đã triển khai (Vercel / tên miền riêng)** nhưng có thể trình diễn thuyết phục cho mọi đối tác và khách hàng ở các lĩnh vực kinh doanh khác nhau.

Không còn nỗi lo *"chào hàng giải pháp e-Learning cho chuyên gia làm bánh hay trung tâm tiếng Anh nhưng nội dung demo lại hiển thị biểu đồ phân tích nến Trading"*. Bằng cách sử dụng tham số URL hoặc tiện ích điều khiển trực quan, toàn bộ hệ thống (từ Logo, Khẩu hiệu, Giảng viên đại diện, Khóa học, Thống kê, Trang Giới thiệu đến Bài viết Blog) sẽ lập tức biến đổi đồng bộ theo ngành nghề tương ứng!

---

### 6.1. Bảng 7 Ngách Đào Tạo Mẫu Có Sẵn (Out-of-the-Box Niches)

Hệ thống được thiết kế sẵn 7 bộ nội dung & dữ liệu mẫu hoàn chỉnh:

| Mã Ngách (`niche`) | Tên Học Viện / Thương Hiệu | Giảng Viên Đại Diện | Lĩnh Vực Đào Tạo & Khóa Học Nổi Bật | Tông Màu & Phong Cách |
| :--- | :--- | :--- | :--- | :--- |
| **`trading`** *(Mặc định)* | **World Trading Lab** | Chuyên gia **Alex Vance** | Masterclass, Phân tích Kỹ thuật, Crypto & Forex Algo | FinTech Dark Emerald, Đẳng cấp & Sang trọng |
| **`ielts`** | **IELTS Elite Academy** | Thầy **Đặng Tuấn Nam** *(8.5 IELTS)* | Luyện thi IELTS Intensive 7.5+, Phát âm Chuẩn Quốc tế Pro | Học thuật Indigo / Purple, Trí tuệ & Chuyên sâu |
| **`baking`** | **La Crème Pastry Academy** | Chef **Mai Hương** | Nghệ thuật Bánh ngọt Pháp Cổ điển, Sourdough Men tự nhiên | Rose / Amber ấm áp, Tinh tế chuẩn Âu |
| **`fitness`** | **IronPulse Fitness** | HLV **Trọng Dũng** | Biến đổi Hình thể Toàn diện 90 ngày, Khoa học Dinh dưỡng Gym | Orange / Slate mạnh mẽ, Tràn đầy năng lượng |
| **`it`** | **TechZone Academy** | Kỹ sư **Minh Hoàng** | Lập trình Web Fullstack Next.js, Trí tuệ nhân tạo AI & Python | Cyan / Slate hiện đại, Phong cách Công nghệ |
| **`electronics`** | **SmartChip Lab** | ThS. **Vũ Nam** | Thiết kế Bo mạch Vi điều khiển PCB, Phần cứng Nhúng IoT | Teal / Emerald đậm chất Kỹ thuật điện tử |
| **`mechanical`** | **AutoMech 3D Center** | Thầy **Quang Huy** | Thiết kế Cơ khí CAD/CAM 3D, Gia công CNC Cơ điện tử | Blue / Slate công nghiệp, Chuẩn mực chính xác |

---

### 6.2. Cú Pháp Đường Dẫn & Cá Nhân Hóa Khách Hàng (Personalized Demo Links)

Bạn có thể gửi trực tiếp các đường link đã gắn tham số cho từng đối tượng khách hàng qua Zalo, Messenger, Email hoặc trình chiếu trong các buổi pitching:

#### 1. Chuyển đổi ngành nghề cơ bản:
* 🥖 **Lĩnh vực Làm bánh / Ẩm thực**:  
  `https://ten-mien-cua-ban.com/?niche=baking`
* 🇬🇧 **Lĩnh vực Tiếng Anh / Ngoại ngữ**:  
  `https://ten-mien-cua-ban.com/?niche=ielts`
* 🏋️ **Lĩnh vực Gym / Thể hình / Sức khỏe**:  
  `https://ten-mien-cua-ban.com/?niche=fitness`
* 💻 **Lĩnh vực Công nghệ thông tin / Lập trình**:  
  `https://ten-mien-cua-ban.com/?niche=it`
* ⚡ **Lĩnh vực Thiết kế Phần cứng Điện tử & Bo mạch PCB**:  
  `https://ten-mien-cua-ban.com/?niche=electronics`
* ⚙️ **Lĩnh vực Thiết kế Cơ khí & Cơ điện tử 3D**:  
  `https://ten-mien-cua-ban.com/?niche=mechanical`
* 📈 **Lĩnh vực Tài chính / Trading**:  
  `https://ten-mien-cua-ban.com/?niche=trading` *(hoặc truy cập trang chủ không kèm tham số)*

#### 2. Cá nhân hóa tức thì theo Tên Thương Hiệu & Giảng Viên của Khách hàng:
Tăng gấp nhiều lần tỷ lệ chốt hợp đồng bằng cách đưa chính **tên trung tâm / thương hiệu** và **tên giảng viên** của khách hàng lên trang demo:

* **Tham số hỗ trợ**:
  * `brand`: Ghi đè tên thương hiệu học viện trên Navbar, Footer, Hero Banner, Trang Giới thiệu, Bản quyền, v.v.
  * `teacher`: Ghi đè tên giảng viên / chuyên gia trên Hero, Giới thiệu và chi tiết khóa học.
* **Ví dụ thực tế**:
  * Chào hàng cho Tiệm bánh *Bếp Mẹ Hoa* của Chị Hoa:  
    `https://ten-mien-cua-ban.com/?niche=baking&brand=Tiệm+Bánh+Bếp+Mẹ+Hoa&teacher=Chef+Mai+Hoa`
  * Chào hàng cho Trung tâm Anh ngữ *Ms. Lan IELTS*:  
    `https://ten-mien-cua-ban.com/?niche=ielts&brand=Ms.+Lan+IELTS+Academy&teacher=Cô+Lan+IELTS+8.5`
  * Chào hàng cho Học viện CNTT *TechZone Academy*:  
    `https://ten-mien-cua-ban.com/?niche=it&brand=TechZone+Academy&teacher=Kỹ+sư+Minh+Hoàng`
  * Chào hàng cho Viện Nghiên Cứu Phần Cứng *SmartChip Lab*:  
    `https://ten-mien-cua-ban.com/?niche=electronics&brand=SmartChip+Lab&teacher=ThS.+Vũ+Nam`
  * Chào hàng cho Trung tâm CAD/CAM *AutoMech 3D*:  
    `https://ten-mien-cua-ban.com/?niche=mechanical&brand=AutoMech+3D+Center&teacher=Thầy+Quang+Huy`

> [!TIP]
> Bạn có thể gõ tiếng Việt có dấu trực tiếp trên thanh địa chỉ trình duyệt, hoặc dùng nút **"Sao chép link Demo"** trong tiện ích Studio để hệ thống tự động mã hóa ký tự UTF-8 chuẩn xác.

---

### 6.3. Cơ Chế Lưu Cookie Tự Động & Trải Nghiệm Mượt Mà

Hệ thống được thiết kế với cơ chế đồng bộ cấp độ kiến trúc (Server-side Middleware & Next.js Cookies):

1. **Ghi nhớ trạng thái xuyên suốt phiên duyệt web**:
   Khi người dùng nhấp vào link demo, Middleware lập tức lưu các giá trị `demo_niche`, `demo_brand`, `demo_teacher` vào Cookie trình duyệt (thời hạn 30 ngày). Khách hàng có thể tự do bấm sang xem trang Khóa học (`/courses`), Giới thiệu (`/about`), Danh mục (`/categories`), Blog (`/blog`) hay Đăng ký mà **không bị mất ngữ cảnh ngành nghề**.
2. **Tự động dọn dẹp giá trị đè cũ (Auto-clean Lingering Overrides)**:
   Khi đổi từ ngách này sang ngách khác (ví dụ: đang xem `baking` với `brand=Bếp Mẹ Hoa`, sau đó click sang `?niche=ielts`), Middleware và bộ lọc Server-side sẽ tự động phát hiện và xóa sạch thương hiệu cũ của tiệm bánh, giúp trung tâm IELTS hiển thị đúng nội dung chuẩn mực mà không bị lẫn lộn thương hiệu ngách trước đó.
3. **An toàn chuẩn Header HTTP**:
   Toàn bộ ký tự tiếng Việt UTF-8 được mã hóa hai chiều an toàn giữa Middleware và Server Components, loại bỏ hoàn toàn nguy cơ lỗi ByteString trên môi trường Serverless (Vercel / Node.js).

---

### 6.4. Tiện Ích Trực Quan "Demo Niche Studio"

Trên mọi trang giao diện công khai, ở góc dưới màn hình luôn có sẵn widget nổi **Demo Niche Studio** (có thể thu nhỏ hoặc mở rộng):

* 🔘 **Chọn nhanh 7 ngách đào tạo**: Chuyển đổi tức thì giữa Tài chính & Trading, IELTS, Làm bánh, Thể hình, CNTT & Lập trình, Phần cứng điện tử và Thiết kế cơ khí.
* ✏️ **Nhập trực tiếp Thương hiệu & Giảng viên**: Thử nghiệm ngay diện mạo mới của website mà không cần chỉnh sửa thanh địa chỉ URL.
* 📋 **Nút "Sao chép link Demo"**: Tự động tạo link rút gọn kèm tham số để gửi ngay cho đối tác qua Zalo/Telegram.
* 🔄 **Nút "Reset"**: Xóa toàn bộ cookie tùy biến và đưa giao diện về trạng thái World Trading Lab nguyên bản.

---

### 6.5. Quản Trị Dữ Liệu Seed Giữa Môi Trường Dev & Production

Hệ thống phân định nghiêm ngặt giữa hai kịch bản Seed để bảo vệ an toàn dữ liệu trên Production:

#### 1. Môi trường Phát triển (Development Seed — `prisma/seed.js`):
* **Mục đích**: Dựng nhanh môi trường thử nghiệm với đầy đủ dữ liệu mẫu cho 7 ngách:
  * **7 Giảng viên chuyên ngành** với ảnh đại diện, chức danh và tiểu sử riêng biệt.
  * **15 Danh mục khóa học** phân theo từng ngành nghề.
  * **42 Khóa học thực tế** đa dạng từ cơ bản, miễn phí đến chuyên sâu.
  * **7 Bài viết Blog chất lượng cao**.
  * **Dữ liệu mẫu Tiếp thị liên kết (Affiliate)**: Tài khoản đối tác có sẵn mã `referralCode`, đơn hàng được giới thiệu, hoa hồng chờ duyệt (`PENDING`), hoa hồng khả dụng (`APPROVED`) và lệnh rút tiền (`PayoutRequest`).
* **Cơ chế**: Tự động dọn dẹp sạch sẽ các bảng (Wipe & Rebuild) theo đúng thứ tự ràng buộc khóa ngoại (Foreign Key).

```bash
# Nạp / làm mới toàn bộ dữ liệu mẫu trong môi trường Dev (Dev Local / Supabase Dev)
npm run db:seed
```

#### 2. Môi trường Production Thực tế (Production Safe Seed — `prisma/seed-prod.js`):
* **Mục đích**: Khởi tạo và đồng bộ các cấu hình hệ thống trên cơ sở dữ liệu thực tế mà **TUYỆT ĐỐI KHÔNG XÓA DỮ LIỆU HIỆN CÓ** (100% Non-destructive & Idempotent):
  * **Upsert Cài đặt hệ thống (`Setting`)**: Khởi tạo các thông số Affiliate (bật hệ thống, hoa hồng mặc định 20%, cookie 30 ngày, bảo lưu 7 ngày, hạn mức rút 200.000 VNĐ), cấu hình VietQR, PayPal, Stripe, Crypto và chính sách hoàn tiền. Các cấu hình Admin đã chỉnh sửa trước đó được bảo toàn nguyên vẹn.
  * **Upsert Danh mục chuẩn (`Category`)**: Đảm bảo các danh mục cốt lõi tồn tại theo `slug` mà không làm thay đổi hay xóa khóa học của học viện.
  * **Backfill mã giới thiệu (`referralCode`)**: Tự động rà soát toàn bộ người dùng trong DB, sinh và gán mã giới thiệu duy nhất cho các tài khoản cũ chưa có mã.
  * **Đảm bảo tài khoản Quản trị (`Super Admin Assurance`)**: Kiểm tra và bảo đảm luôn có tài khoản Admin điều hành hệ thống.

```bash
# Seed an toàn trên môi trường Production (kết nối qua .env.production.local)
npm run db:seed:prod

# Hoặc chạy trực tiếp độc lập (dành cho Docker Container / CI/CD Pipeline / Vercel Build)
npm run db:seed:prod:safe
```

---

### 6.6. Hướng Dẫn Mở Rộng Thêm Ngách Mới (Tùy Chọn)

Để thêm ngách thứ 5 (ví dụ: `coding`, `marketing`, `photography`):
1. Mở file [`src/lib/niches.ts`](./src/lib/niches.ts):
   * Thêm định danh mới vào kiểu `NicheKey`: `'trading' | 'ielts' | 'baking' | 'fitness' | 'coding'`.
   * Khai báo cấu hình nội dung cho ngách mới trong đối tượng `NICHE_CONFIGS` (Bao gồm: Tiêu đề Hero, Thống kê, Giá trị cốt lõi, Giới thiệu About, Tiêu đề Danh mục & Blog, Khóa học gợi ý).
2. Mở file [`prisma/seed.js`](./prisma/seed.js):
   * Bổ sung tài khoản Giảng viên mẫu, Danh mục và các Khóa học tương ứng với ngách mới.
   * Chạy `npm run db:seed` để cập nhật cơ sở dữ liệu.

---

## 🔄 7. Chuẩn Hóa Nhãn Trắng 100% — Tùy Biến Sang Thương Hiệu Mới (Pure White-Labeling)

Nền tảng được thiết kế theo kiến trúc **Pure White-Label LMS**. Mọi thành phần của hệ thống (tiêu đề website, Navbar, Footer, trang chi tiết khóa học, phôi chứng chỉ tốt nghiệp PDF, bài viết Blog và thẻ SEO Google) đều được **liên kết động 100%** với cấu hình thương hiệu. Bạn có thể chuyển đổi toàn bộ website sang học viện của riêng bạn trong **vòng 1 phút** mà **không cần chỉnh sửa một dòng code nào**!

### 🌟 Cách 1: Tùy Biến Trực Quan Từ Admin Dashboard (Khuyên Dùng - 0 Dòng Code)
1. Đăng nhập với tài khoản Quản trị viên (`ADMIN` hoặc `SUPER_ADMIN`).
2. Truy cập mục **Cài Đặt Hệ Thống** (`/admin/settings`).
3. Tùy chỉnh trực tiếp:
   * **Thông tin thương hiệu**: Tên học viện, Khẩu hiệu (Slogan), Mô tả học viện, Hotline, Email hỗ trợ, Link Zalo, Telegram, Facebook.
   * **Cấu hình thanh toán**: Ngân hàng nhận VietQR (MB, Vietcombank, Techcombank...), Số tài khoản, Tên chủ tài khoản, Bật/Tắt PayOS, SePay, PayPal, Stripe, Crypto USDT.
   * **Số liệu trang chủ**: Số lượng học viên, Tỷ lệ hài lòng, Tỷ lệ thực hành, Thời gian hỗ trợ.
4. Bấm **"Lưu Cài Đặt"** $\rightarrow$ Hệ thống tự động làm mới bộ nhớ đệm (Cache) và cập nhật diện mạo toàn bộ website ngay lập tức!

### ⚙️ Cách 2: Tùy Biến Qua Biến Môi Trường (`.env`)
Khi triển khai trên Vercel, Docker hoặc VPS, bạn chỉ cần thiết lập các biến sau:
```env
# Tên thương hiệu hiển thị toàn bộ website & thẻ tiêu đề SEO Google
APP_NAME="Học Viện Đào Tạo Của Bạn"
APP_SLOGAN="Khẩu hiệu của bạn tại đây"
APP_DESCRIPTION="Mô tả tóm tắt về học viện đào tạo của bạn"

# Kênh liên hệ
SUPPORT_EMAIL="support@your-academy.com"
SUPPORT_HOTLINE="0988.888.888"
ZALO_URL="https://zalo.me/0988888888"
TELEGRAM_URL="https://t.me/your_academy"

# Thông tin tài khoản nhận học phí VietQR
BANK_ID="MB"
BANK_NAME="MB Bank (Ngân hàng Quân Đội)"
BANK_ACCOUNT_NO="0988888888"
BANK_ACCOUNT_NAME="CONG TY GIAO DUC CUA BAN"
```

### 🖼️ Thay Đổi Logo & Bộ Màu Sắc Nhận Diện
* **Logo Thương Hiệu**:
  * Mặc định: Navbar tự động hiển thị tên thương hiệu `APP_NAME` cùng biểu tượng mũ học thuật sang trọng.
  * Nếu dùng Logo ảnh: Thay thế file logo thương hiệu vào thư mục `public/logo.png` hoặc cập nhật đường dẫn ảnh trong `src/components/layout/NavbarClient.tsx`.
* **Chủ Đề Màu Sắc (Themes)**:
  * Hệ thống tích hợp sẵn các bảng màu: `emerald` (Xanh tài chính), `indigo` (Tím học thuật), `rose` (Ấm áp ẩm thực), `amber` (Vàng hoàng gia), `cyan` (Công nghệ hiện đại).
  * Người dùng có thể tùy chọn theme yêu thích hoặc cố định theme mặc định theo nhận diện thương hiệu.

---

### 💡 Bảng Gợi Ý Danh Mục Theo Từng Ngành Nghề:

| Ngành Nghề Mục Tiêu | Danh Mục Đào Tạo Gợi Ý (`Category`) | Màu Sắc / Phong Cách Phù Hợp |
| :--- | :--- | :--- |
| 💻 **Lập Trình & CNTT (Tech / Coding)** | Lập trình Web Fullstack, Trí tuệ Nhân tạo & Python, Mobile App (Flutter/React Native), DevOps & Cloud | Rất hợp với Dark Theme hiện tại, dùng accent Xanh Emerald / Cyan |
| 🗣️ **Ngoại Ngữ (Language Learning)** | Tiếng Anh Giao Tiếp, Luyện thi IELTS/TOEIC, Tiếng Trung HSK, Tiếng Nhật JLPT | Giao diện hiện đại, thân thiện với học viên trẻ |
| 📈 **Digital Marketing & Kinh Doanh** | Facebook/TikTok Ads thực chiến, SEO & Content Marketing, Kinh doanh Sàn E-Commerce | Nhấn mạnh vào kết quả chuyển đổi và thực hành |
| 🎨 **Thiết Kế & Multimedia** | Thiết kế UI/UX Figma, Đồ họa Photoshop/Illustrator, Dựng phim Premiere/CapCut, 3D Blender | Tận dụng tốt hệ thống hiển thị thumbnail sắc nét và video HD |

---

## 📂 8. Cấu trúc Thư mục Dự án

```
eLearning/
├── prisma/
│   ├── schema.prisma        # Mô hình cơ sở dữ liệu quan hệ (15 bảng)
│   ├── seed.js              # Script khởi tạo dữ liệu mẫu 4 ngách thực tế
│   └── dev.db               # SQLite database cục bộ
├── src/
│   ├── app/                 # Next.js 15 App Router (Pages & API Routes)
│   │   ├── (auth)/          # Trang Đăng nhập & Đăng ký tài khoản
│   │   ├── about/           # Trang Giới thiệu học viện (Tự động thích ứng theo ngách)
│   │   ├── admin/           # Phân hệ Quản trị Dashboard, Orders, Courses, Students
│   │   ├── api/             # REST API Handlers (Auth, Orders, Progress, Comments, Coupons)
│   │   ├── blog/            # Trang Tin tức & Bài viết chuyên ngành (Đa ngách)
│   │   ├── categories/      # Danh mục chủ đề đào tạo (Tự động lọc theo ngách)
│   │   ├── checkout/        # Trang Thanh toán VietQR & Upload Bill
│   │   ├── courses/         # Trang Danh sách & Chi tiết Khóa học (Lọc theo ngách)
│   │   ├── learn/           # LMS Classroom Player & Q&A
│   │   ├── my-courses/      # Trang Khóa học của tôi
│   │   ├── policy/          # Chính sách thanh toán, hoàn tiền, điều khoản
│   │   ├── globals.css      # Design System CSS, Dark theme, Glassmorphism
│   │   └── layout.tsx       # Root Layout & Dynamic Demo Switcher
│   ├── components/
│   │   ├── cards/           # CourseCard, v.v.
│   │   ├── demo/            # DemoNicheSwitcher (Tiện ích chuyển đổi ngách nổi)
│   │   ├── layout/          # Navbar, Footer (Đồng bộ thương hiệu ngách), LanguageSwitcher
│   │   └── providers/       # AuthProvider, LanguageProvider, ToastProvider (Sonner)
│   ├── lib/
│   │   ├── auth.ts          # NextAuth Options & Session config
│   │   ├── config.ts        # Cấu hình thương hiệu gốc & settings hệ thống
│   │   ├── i18n/            # Hệ thống từ điển đa ngôn ngữ (vi.ts, en.ts)
│   │   ├── niches.ts        # Cấu hình dữ liệu 7 ngách đào tạo (Trading, IELTS, Baking, Fitness, IT, Electronics, Mechanical)
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   ├── server-niche.ts  # Bộ giải mã ngách & thương hiệu an toàn phía Server
│   │   ├── utils.ts         # Tiện ích format VND, thời gian, slugify, YouTube embed
│   │   └── vietqr.ts        # Generator mã QR VietQR chuẩn NAPAS
│   ├── middleware.ts        # Xử lý tham số ngách URL, ghi nhớ Cookie & an toàn Header HTTP
│   └── types/               # Kiểu dữ liệu TypeScript
├── .env                     # Biến môi trường
├── package.json             # Danh sách thư viện phụ thuộc
└── tailwind.config.ts       # Cấu hình bảng màu FinTech & hiệu ứng
```

---

## 📧 9. Hướng Dẫn Cấu Hình Hệ Thống Gửi Email (Gmail SMTP & Resend API)

Hệ thống E-Learning hỗ trợ cơ chế gửi email thông minh với **thứ tự ưu tiên tự động (Waterfall Priority)**:

```
[ Yêu cầu gửi Email ]
        │
        ▼
[ Có SMTP_USER & SMTP_PASS? ] ─── CÓ (Ưu tiên 1) ───► [ Gửi qua GMAIL SMTP ]
        │ KHÔNG
        ▼
[ Có RESEND_API_KEY? ] ───────── CÓ (Ưu tiên 2) ───► [ Gửi qua RESEND REST API ]
        │ KHÔNG
        ▼
[ Chế độ Dev Simulation ] ──────────────────────────► [ In nội dung & Link ra Console ]
```

---

### 9.1. Giải Pháp 1: Gửi Qua Gmail SMTP (Khuyên Dùng khi dùng subdomain Vercel hoặc chưa có tên miền riêng)

* **Ưu điểm**: Hoàn toàn **miễn phí**, **không cần tên miền riêng**, tỉ lệ vào Inbox của học viên cực cao, hỗ trợ chạy mượt mà ngay trên `*.vercel.app`.
* **Giới hạn**: Tối đa **500 email / 24 giờ** với tài khoản Gmail cá nhân miễn phí (hoặc **2.000 email / ngày** với tài khoản Google Workspace).

#### Các bước lấy Mật khẩu ứng dụng Google (Google App Password 16 ký tự):
1. Đăng nhập tài khoản Google và truy cập trang Bảo mật: [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Đảm bảo tính năng **Xác minh 2 bước (2-Step Verification)** đã được **Bật**.
3. Truy cập trang tạo Mật khẩu ứng dụng: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Nhập tên ứng dụng (ví dụ: `Elearning Web`) $\rightarrow$ Bấm nút **Tạo (Create)**.
5. Sao chép chuỗi mật khẩu 16 chữ cái do Google cấp (ví dụ: `abcd efgh ijkl mnop`).

#### Cấu hình vào tệp `.env.production.local` (hoặc Environment Variables trên Vercel):
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="dia_chi_gmail_cua_ban@gmail.com"
SMTP_PASS="abcdefghijklmnop"
EMAIL_FROM="World Trading Lab <dia_chi_gmail_cua_ban@gmail.com>"
```

#### Lệnh kiểm tra kết nối và gửi thử email:
```bash
node scripts/test-smtp.mjs dia_chi_nhan@gmail.com
```

---

### 9.2. Giải Pháp 2: Gửi Qua Resend REST API (Dành cho khi đã có tên miền riêng)

Khi website đã sở hữu tên miền riêng chính thức (ví dụ: `worldtradinglab.com`), bạn có thể sử dụng Resend để gửi hàng chục ngàn email/tháng:
1. Đăng ký tài khoản tại [https://resend.com](https://resend.com).
2. Vào mục **API Keys** $\rightarrow$ Tạo API Key mới bắt đầu bằng `re_...`.
3. Vào mục **Domains** $\rightarrow$ Thêm tên miền riêng của bạn và cấu hình các bản ghi DNS (**DKIM, SPF, MX**) trên nhà cung cấp quản lý tên miền (Cloudflare, GoDaddy, v.v.).
4. Cấu hình vào biến môi trường:
   ```env
   # Xóa hoặc để trống SMTP_USER để hệ thống tự động chuyển sang Resend
   SMTP_USER=""
   SMTP_PASS=""
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
   EMAIL_FROM="World Trading Lab <noreply@worldtradinglab.com>"
   ```

---

### 9.3. Các Tính Năng Tự Động Gửi Email Trong Hệ Thống
* 🔐 **Xác thực tài khoản mới**: Tự động gửi link kích hoạt & OTP khi bật `REQUIRE_EMAIL_VERIFICATION="true"`.
* 🔑 **Quên & Đặt lại mật khẩu**: Gửi link reset mật khẩu có chữ ký bảo mật hết hạn sau 15 phút.
* 🧾 **Hóa đơn thanh toán thành công**: Gửi email biên nhận kèm link vào học ngay khi đơn hàng được duyệt.
* 💬 **Thông báo Hỏi đáp (Q&A)**: Báo cho học viên khi giảng viên hoặc người khác trả lời câu hỏi của bài học.
* ⏰ **Nhắc nhở học tập (Cron Job)**: Tự động nhắc nhở những học viên chưa hoàn thành khóa và vắng mặt $\ge$ 5 ngày.

---

## 🌐 10. Hướng Dẫn Triển Khai Hạ Tầng & CI/CD (Vercel + Neon/Supabase + GitHub Actions)

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng **World Trading Lab E-Learning** lên môi trường chạy thực tế (Production) theo kiến trúc **Serverless** đơn giản, bảo mật, tối ưu chi phí (0$ chi phí cố định ban đầu) và tự động hóa toàn diện.

---

### 10.1. Tổng Quan Kiến Trúc Hạ Tầng (Cloud Serverless)

```
[ Lập trình viên ]
          │
          ▼  git push / pull request
[ GitHub Repository ]
          │
          ├─────────────────────────────────────────────────┐
          ▼                                                 ▼
[ GitHub Actions CI ]                             [ Vercel Serverless ]
- Type-check (TypeScript)                         - Tự động Deploy khi CI pass
- Linting (ESLint)                                - Tự động cấp HTTPS / SSL
- Unit Tests (Vitest)                             - Global Edge CDN & Caching
- Build Verification                              - Tự động quản lý preview URL cho PR
                                                            │
                                                            ▼ (Query / Mutation)
                                                  [ Cloud PostgreSQL ]
                                                  (Neon.tech hoặc Supabase)
                                                  - Tự động backup
                                                  - Connection Pooling
```

---

### 10.2. Hướng Dẫn Đưa Dự Án Lên GitHub

1. **Khởi tạo và kiểm tra trạng thái Git cục bộ**:
   ```bash
   git status
   ```
2. **Thêm toàn bộ file vào Stage & Commit**:
   ```bash
   git add .
   git commit -m "feat: complete production-ready eLearning platform"
   ```
3. **Tạo Repository mới trên GitHub** (chọn chế độ `Public` hoặc `Private`).
4. **Liên kết và Đẩy mã nguồn lên GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```

---

### 10.3. Khởi Tạo Cơ Sở Dữ Liệu Cloud PostgreSQL (Miễn Phí với Neon hoặc Supabase)

> [!NOTE]
> Khi chạy trên môi trường Serverless Cloud (như Vercel/Cloudflare), hệ thống cần cơ sở dữ liệu đám mây PostgreSQL thay vì file SQLite cục bộ. Khuyến nghị sử dụng **Neon.tech** (tối ưu hóa cho Serverless Next.js, có sẵn Connection Pooling và độ trễ thấp).

#### Cách tạo trên Neon.tech (khoảng 1 phút):
1. Truy cập [https://neon.tech](https://neon.tech) và đăng nhập bằng tài khoản GitHub hoặc Google.
2. Bấm **Create Project**:
   - **Project name**: `elearning-platform`
   - **Postgres version**: Mặc định (16 hoặc 15)
   - **Region**: Chọn vùng gần Việt Nam nhất (ví dụ: `Singapore - ap-southeast-1`).
3. Sau khi tạo xong, Neon sẽ hiển thị chuỗi kết nối dạng:
   ```text
   postgresql://alex:AbC123dEf@ep-cool-mountain-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Sao chép chuỗi kết nối này.

#### Cập Nhật Cấu Hình Prisma & Đẩy Dữ Liệu Lên DB Cloud:
1. Mở file [`.env`](./.env) (hoặc `.env.production.local`) và dán chuỗi kết nối:
   ```env
   DATABASE_URL="postgresql://alex:AbC123dEf@ep-cool-mountain-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
2. Mở file [`prisma/schema.prisma`](./prisma/schema.prisma), đảm bảo provider là `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Chạy lệnh đồng bộ bảng dữ liệu lên PostgreSQL Cloud:
   ```bash
   npx prisma db push
   ```
   *(Lệnh này sẽ tự động tạo tất cả các bảng: users, courses, lessons, orders,... trên cơ sở dữ liệu cloud)*
4. Chạy lệnh nạp dữ liệu mẫu ban đầu (khóa học, danh mục, tài khoản admin):
   ```bash
   npm run db:seed
   ```
5. Kiểm tra dữ liệu trực tiếp bằng giao diện trực quan của Prisma Studio (nếu muốn):
   ```bash
   npx prisma studio
   ```

---

### 10.4. Triển Khai Lên Vercel (Khuyên Dùng - Zero-DevOps)

Vercel là nền tảng máy chủ tối ưu nhất cho Next.js với tốc độ phản hồi Server Actions và Edge CDN toàn cầu cực nhanh.

1. **Đăng nhập Vercel**: Truy cập [https://vercel.com](https://vercel.com) $\rightarrow$ Đăng nhập bằng tài khoản GitHub.
2. **Import Repository**:
   - Bấm **Add New...** $\rightarrow$ Chọn **Project**.
   - Chọn kho mã nguồn (Repository) của dự án `eLearning` $\rightarrow$ Bấm **Import**.
3. **Configure Project**:
   - **Framework Preset**: Tự động nhận diện là `Next.js`.
   - **Root Directory**: `./` (để mặc định).
4. **Cài đặt Biến Môi Trường (Environment Variables)**:
   Mở mục **Environment Variables** trên Vercel và điền các biến cấu hình cần thiết:

   | Tên Biến Môi Trường | Giá Trị Mẫu | Mô Tả |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://alex:...@...neon.tech/neondb?sslmode=require` | Chuỗi kết nối PostgreSQL lấy từ Neon/Supabase |
   | `NEXTAUTH_SECRET` | Chạy lệnh `openssl rand -base64 32` để tạo mã | Khóa bí mật mã hóa phiên đăng nhập JWT |
   | `NEXTAUTH_URL` | `https://ten-du-an-cua-ban.vercel.app` | Địa chỉ URL chạy chính thức của website |
   | `APP_NAME` | `Học Viện Của Bạn` | Tên hiển thị thương hiệu toàn hệ thống |
   | `BANK_ID` | `MB` | Mã ngân hàng nhận chuyển khoản VietQR |
   | `BANK_ACCOUNT_NO` | `0988888888` | Số tài khoản nhận tiền học phí |
   | `BANK_ACCOUNT_NAME` | `TEN CHU TAI KHOAN` | Tên chủ tài khoản ngân hàng |
   | `PAYOS_CLIENT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Tùy chọn: Client ID cổng VietQR tự động PayOS |
   | `PAYOS_API_KEY` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | Tùy chọn: API Key cổng PayOS |
   | `PAYOS_CHECKSUM_KEY` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Tùy chọn: Checksum Key cổng PayOS |
   | `PAYPAL_CLIENT_ID` | `client_id_lay_tu_paypal_developer` | Tùy chọn: Client ID cổng thanh toán PayPal |
   | `PAYPAL_SECRET` | `secret_lay_tu_paypal_developer` | Tùy chọn: Secret Key cổng PayPal |
   | `STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxx` | Tùy chọn: Publishable Key thẻ tín dụng Stripe |
   | `STRIPE_SECRET_KEY` | `sk_live_xxxxxxxxxxxx` | Tùy chọn: Secret Key cổng Stripe |
   | `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Tùy chọn: Endpoint Cloudflare R2 / S3 |
   | `S3_ACCESS_KEY_ID` | `r2_access_key_id` | Tùy chọn: S3 Access Key ID |
   | `S3_SECRET_ACCESS_KEY` | `r2_secret_access_key` | Tùy chọn: S3 Secret Access Key |
   | `S3_BUCKET_NAME` | `elearning-media` | Tùy chọn: Tên S3 Bucket lưu trữ video/ảnh |
   | `SMTP_HOST` | `smtp.gmail.com` | Máy chủ SMTP gửi email (Mặc định Gmail) |
   | `SMTP_PORT` | `465` | Cổng bảo mật SSL SMTP |
   | `SMTP_SECURE` | `true` | Sử dụng giao thức bảo mật SSL |
   | `SMTP_USER` | `your_gmail_address@gmail.com` | Tài khoản Gmail dùng để gửi thư |
   | `SMTP_PASS` | `your_16char_app_password` | Mật khẩu ứng dụng 16 ký tự của Google |
   | `EMAIL_FROM` | `Học Viện <your_gmail_address@gmail.com>` | Tên và địa chỉ người gửi hiển thị cho học viên |
   | `RESEND_API_KEY` | `re_xxxxxxxxxxxx` | Tùy chọn: Khóa API Resend (khi có domain riêng) |
   | `PAYMENT_WEBHOOK_API_KEY` | `khoa_bi_mat_webhook_tuy_chon` | Khóa xác thực webhook từ Casso/SePay |
   | `CRON_SECRET` | `wtl-cron-secret-key-32chars...` | Khóa bí mật bảo vệ API Cron (/api/cron/cleanup & study-reminders) |

5. **Deploy**: Bấm nút **"Deploy"**.
   - Vercel sẽ tự động ưu tiên thực thi script `"vercel-build"` được cấu hình sẵn trong `package.json`:
     ```bash
     prisma generate && prisma migrate deploy && next build
     ```
   - Quá trình này **tự động kết nối vào Database và áp dụng các migration mới nhất trước khi build mã nguồn**. Nếu migration có lỗi, Vercel sẽ tự động hủy đợt deploy để bảo toàn website hiện tại.
   - Trong vòng 1 - 2 phút, website sẽ chính thức online với chứng chỉ SSL HTTPS hoàn toàn miễn phí.

---

### 10.5. Triển Khai Lên Cloudflare Pages (Tùy Chọn)

1. **Đăng nhập Cloudflare**: Vào Dashboard Cloudflare $\rightarrow$ Chọn **Compute (Workers & Pages)** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. **Chọn Repository**: Chọn repo GitHub của dự án.
3. **Cài đặt Build Settings**:
   - **Framework Preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages` (hoặc `prisma generate && next build`)
   - **Build output directory**: `.vercel/output/static`
   - **Node.js Compatibility Flag**: Bật `nodejs_compat` trong phần Settings $\rightarrow$ Functions $\rightarrow$ Compatibility Flags.
4. **Thêm Environment Variables**: Thêm đầy đủ các biến môi trường như bảng ở mục Vercel.
5. **Save and Deploy**.

---

### 10.6. Quy Trình CI/CD Tự Động Với GitHub Actions

Kịch bản tự động hóa CI/CD đã được cấu hình sẵn tại `.github/workflows/ci.yml`.

#### Cơ chế hoạt động:
- Mỗi khi lập trình viên `git push` hoặc tạo `Pull Request` lên nhánh `main`, `master`, hoặc `develop`:
  - GitHub Actions sẽ tự động khởi động một máy chủ ảo Ubuntu độc lập.
  - Tự động chạy chuỗi 4 lớp kiểm tra chất lượng mã nguồn:
    1. **Type Check**: Chạy `tsc --noEmit` để đảm bảo không có lỗi ép kiểu, lỗi logic TypeScript.
    2. **Linting**: Chạy `npm run lint` kiểm tra chuẩn viết mã nguồn.
    3. **Unit Tests**: Tự động thực thi toàn bộ test cases với Vitest.
    4. **Build Verification**: Thử nghiệm đóng gói dự án Next.js (`next build`) để phát hiện sớm các lỗi trang tĩnh hoặc bundle.
- Nếu tất cả các bước đều vượt qua (dấu tích xanh ✅), code mới được coi là an toàn để deploy lên Production.
- Nếu có bất kỳ lỗi nào (dấu x đỏ ❌), GitHub sẽ cảnh báo và chặn việc merge code lỗi vào nhánh chính.

---

### 10.7. Hướng Dẫn Triển Khai Tác Vụ Chạy Nền & Cron Jobs Tự Động (Background Tasks & Maintenance)

Hệ thống SaaS cung cấp 2 giải pháp linh hoạt để tự động hóa các tác vụ bảo trì cơ sở dữ liệu, tự động hủy đơn hàng dang dở, dọn dẹp dữ liệu rác và gửi email chạy ngầm an toàn:

#### 🟢 Giải Pháp 1: Sử Dụng Supabase `pg_cron` (Khuyên Dùng cho Database - Hoàn Toàn Miễn Phí)
`pg_cron` là extension chạy trực tiếp bên trong engine PostgreSQL của Supabase, thao tác dữ liệu nội bộ với tốc độ mili-giây và không bị ảnh hưởng bởi giới hạn thời gian (timeout) của serverless function.

**Các bước kích hoạt:**
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) $\rightarrow$ Chọn Project của bạn.
2. Tại menu điều hướng bên trái, chọn mục **SQL Editor**.
3. Mở tệp [`prisma/supabase_cron_setup.sql`](./prisma/supabase_cron_setup.sql) trong mã nguồn dự án, sao chép toàn bộ nội dung, dán vào SQL Editor và bấm nút **Run**.
4. **Các tác vụ nền sẽ được kích hoạt tự động theo lịch trình:**
   * **`cancel-stale-pending-orders`** (Chạy mỗi tiếng tại phút 0: `0 * * * *`): Quét và tự động chuyển các đơn hàng ở trạng thái `PENDING` quá 24 giờ sang `CANCELLED` để giải phóng slot và chuẩn hóa báo cáo doanh thu.
   * **`cleanup-expired-auth-tokens`** (Chạy hàng ngày lúc 03:00 UTC: `0 3 * * *`): Xóa sạch các mã xác nhận email và token đặt lại mật khẩu đã hết hạn (`expiresAt < NOW()`).
   * **`cleanup-orphaned-attachments`** (Chạy hàng ngày lúc 03:30 UTC: `30 3 * * *`): Xóa các bản ghi tải lên bị mồ côi (không gắn với bất kỳ bài học, khóa học hay bài viết nào sau 24 giờ).

**Các câu lệnh SQL quản trị & giám sát trong Supabase:**
```sql
-- 1. Xem danh sách các cron job đang hoạt động:
SELECT jobid, jobname, schedule, command, active FROM cron.job;

-- 2. Xem lịch sử thực thi và nhật ký chi tiết của các lần chạy:
SELECT jobid, runid, job_pid, status, return_message, start_time, end_time 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;

-- 3. Hủy một cron job nếu không còn nhu cầu:
SELECT cron.unschedule('cancel-stale-pending-orders');
```

---

#### 🔵 Giải Pháp 2: Sử Dụng Vercel Cron (Next.js App Router API Routes)
Dành cho môi trường triển khai trên Vercel. Lịch trình đã được đăng ký sẵn trong [`vercel.json`](./vercel.json):
* **`/api/cron/cleanup`** (`0 2 * * *` - 2:00 sáng hàng ngày): Tự động hủy đơn quá hạn 24h, xóa token hết hạn, xóa bản ghi tệp mồ côi và **xóa trực tiếp tệp vật lý trên Cloudflare R2 / AWS S3** thông qua S3 SDK, đồng thời thanh lọc các bài viết đã xóa mềm (`deletedAt`) quá 90 ngày (chuẩn tương thích gói Vercel Hobby miễn phí).
* **`/api/cron/study-reminders`** (`0 9 * * *` - 9:00 sáng hàng ngày): Quét các học viên có tiến độ chưa hoàn thành và đã không vào học từ 5 ngày trở lên để gửi email nhắc nhở học tập.

**Cấu hình biến môi trường bảo vệ:**
1. Thêm biến `CRON_SECRET` vào mục **Settings $\rightarrow$ Environment Variables** trên Vercel Dashboard (ví dụ: chuỗi ký tự bí mật dài 32+ ký tự).
2. Khi Vercel Cron kích hoạt, nó sẽ tự động gửi header `Authorization: Bearer <CRON_SECRET>` để xác thực danh tính an toàn.

**Thử nghiệm gọi thủ công (Manual Trigger):**
```bash
# Gọi qua tham số query bí mật:
curl -X GET "https://your-domain.com/api/cron/cleanup?secret=YOUR_CRON_SECRET"

# Hoặc gọi qua Header Bearer:
curl -X POST "https://your-domain.com/api/cron/cleanup" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

#### ⚡ Cơ Chế Gửi Email Chạy Ngầm An Toàn (Next.js 15 `after()`)
Trên các môi trường Serverless như Vercel hay AWS Lambda, việc gọi gửi email bất đồng bộ mà không có `await` (kiểu fire-and-forget `.catch()`) có thể khiến tiến trình bị ngắt đột ngột ngay khi server trả về HTTP Response, dẫn tới việc học viên không nhận được email.

Hệ thống đã giải quyết triệt để vấn đề này bằng module [`src/lib/async-task.ts`](./src/lib/async-task.ts) (`runInBackground`) ứng dụng hook `after()` chuẩn của **Next.js 15**:
* **Phạm vi bảo vệ:** Gửi email xác thực khi đăng ký, gửi lại mã kích hoạt, quên mật khẩu, email hóa đơn thanh toán thành công và thông báo phản hồi hỏi đáp Q&A.
* **Lợi ích:** Phản hồi giao diện người dùng ngay lập tức (< 50ms), đồng thời máy chủ serverless tiếp tục giữ kết nối chạy ngầm để đảm bảo email được chuyển giao trọn vẹn qua Resend REST API.

---

### 10.8. Triển Khai & Cập Nhật Tự Động Trên Máy Chủ Riêng / VPS (Self-Hosted VPS & Docker)

Đối với các tổ chức, doanh nghiệp muốn tự lưu trữ (Self-hosted) toàn bộ dữ liệu trên máy chủ riêng (VPS Ubuntu/Debian hoặc Cloud Server), hệ thống đã xây dựng sẵn bộ công cụ tự động hóa, **đảm bảo cơ sở dữ liệu luôn được chạy Migration an toàn trước khi chạy mã nguồn mới**:

#### 🐳 Phương Án 1: Triển khai & Cập nhật bằng Docker (Khuyên Dùng Nhất)

Hệ thống cung cấp sẵn [`Dockerfile`](./Dockerfile) đa tầng siêu nhẹ và [`docker-compose.yml`](./docker-compose.yml) tích hợp sẵn PostgreSQL 16 và Next.js 15 Standalone.

1. **Khởi chạy hệ thống lần đầu:**
   ```bash
   # Bước 1: Tạo file cấu hình production từ mẫu
   cp .env.example .env.production.local
   # Chỉnh sửa các biến bí mật (DATABASE_URL, NEXTAUTH_SECRET, v.v.) trong .env.production.local

   # Bước 2: Khởi chạy toàn bộ hệ thống
   docker compose up -d
   ```
   > [!NOTE]
   > File [`docker-entrypoint.sh`](./docker-entrypoint.sh) được cấu hình tự động kích hoạt trước khi container Next.js khởi động, tự động thực thi `prisma migrate deploy` để khởi tạo và đồng bộ cấu trúc CSDL hoàn chỉnh.

2. **Cập nhật mã nguồn & Migration khi có phiên bản mới:**
   Khi mã nguồn có các tính năng mới hoặc thay đổi schema, bạn chỉ cần chạy **duy nhất 1 lệnh**:
   ```bash
   npm run deploy:docker
   # Hoặc chạy trực tiếp script: bash scripts/deploy-docker.sh
   ```
   **Quy trình tự động hóa thực hiện:**
   - Tự động kéo mã nguồn mới nhất từ Git (`git pull origin main`).
   - Biên dịch lại Docker image mới nhất.
   - **Chạy Migration CSDL an toàn trước:** `docker compose run --rm app ./node_modules/.bin/prisma migrate deploy`. Nếu migration gặp sự cố, script sẽ dừng ngay lập tức để bảo vệ dữ liệu hiện tại.
   - Khởi động lại các container mà không làm gián đoạn hệ thống (`docker compose up -d`).
   - Tự động dọn dẹp các images cũ để giải phóng dung lượng ổ cứng.

---

#### ⚡ Phương Án 2: Triển khai & Cập nhật trên VPS Node.js / PM2 (Bare-Metal)

Dành cho môi trường VPS chạy trực tiếp Node.js 20+ và quản lý tiến trình bằng PM2 hoặc Systemd:

1. **Khởi tạo hệ thống lần đầu trên VPS:**
   ```bash
   # Bước 1: Cài đặt các gói phụ thuộc
   npm install

   # Bước 2: Tạo file cấu hình môi trường
   cp .env.example .env.production.local
   nano .env.production.local

   # Bước 3: Áp dụng migration CSDL
   npm run db:migrate:deploy:prod

   # Bước 4: Khởi tạo tài khoản Super Admin & Seed dữ liệu an toàn
   npm run db:seed:prod
   npm run create-admin:prod

   # Bước 5: Build và khởi động bằng PM2
   npm run build
   pm2 start npm --name "nextlms" -- start
   pm2 save
   ```

2. **Cập nhật mã nguồn & Migration khi có phiên bản mới:**
   Chỉ cần chạy lệnh cập nhật tự động:
   ```bash
   npm run deploy:vps
   # Hoặc chạy trực tiếp script: bash scripts/deploy-vps.sh
   ```
   **Quy trình tự động hóa thực hiện:**
   - `git pull origin main` kéo mã nguồn mới nhất.
   - `npm install` cập nhật các thư viện mới.
   - **Thực thi `prisma migrate deploy` CSDL trước**: Nếu migration thất bại, script sẽ dừng quy trình ngay lập tức để ngăn chặn tình trạng lệch cấu trúc schema giữa code và database.
   - `npx prisma generate` sinh Prisma Client mới.
   - `npm run build` đóng gói Next.js bản sản xuất.
   - Tự động nạp lại tiến trình qua PM2 (`pm2 reload nextlms --update-env`) với Zero-Downtime.

---

#### 🗄️ Tiện Ích Chạy Migration CSDL Độc Lập

Nếu bạn chỉ muốn kiểm tra hoặc áp dụng các migration CSDL mới mà không cần build lại mã nguồn:
```bash
# Tự động nhận diện môi trường (.env.production.local hoặc .env):
./scripts/migrate-db.sh

# Hoặc chỉ định rõ môi trường:
./scripts/migrate-db.sh --prod   # Chạy trên môi trường Production
./scripts/migrate-db.sh --dev    # Chạy trên môi trường Development
```

---

## 🤖 11. AI Copilot — Trợ Lý Sáng Tạo Nội Dung Tích Hợp (AI Content Assistant)

Nền tảng tích hợp sẵn **AI Copilot** — công cụ trợ lý thông minh giúp Admin và Giảng viên **tạo bài viết, soạn nội dung khóa học, sinh SEO metadata và gợi ý từ khóa** trực tiếp ngay trong giao diện quản trị, không cần rời khỏi trang.

![AI Copilot — Trợ lý Soạn thảo AI tích hợp trong Admin Dashboard](./Images/AICopilot.png)

> [!NOTE]
> AI Copilot hoạt động hoàn toàn tách biệt với hệ thống LMS chính. Trong môi trường Development, tính năng chạy tự động mà **không cần API key bên ngoài** nhờ bộ sinh nội dung cục bộ chất lượng cao (Autonomous Engine). Trên Production, bạn có thể kết nối với Gemini, OpenAI, Claude hoặc DeepSeek.

---

### 11.1. Tổng Quan Kiến Trúc & 3 Chế Độ Vận Hành

```
[ Admin Dashboard — Tạo/Sửa Bài Viết ]
        │
        ▼  Click "AI Copilot" hoặc nhập prompt
[ AICopilotDrawer (React Component) ]
        │
        ├── Chế độ 1: Local Mock Proxy (Mặc định Dev)
        │   └── Trả kết quả ngay lập tức bằng bộ sinh nội dung cục bộ
        │
        ├── Chế độ 2: Dev AI Bridge Worker (`npm run dev:ai`)
        │   └── Worker riêng giám sát hàng đợi, gọi LLM API thật hoặc Autonomous Engine
        │
        └── Chế độ 3: Production API (Gemini / OpenAI / Claude / DeepSeek)
            └── Gọi trực tiếp API nhà cung cấp qua Route Handler
```

| Chế Độ | Yêu Cầu Cấu Hình | Chất Lượng Nội Dung | Phù Hợp Cho |
| :--- | :--- | :--- | :--- |
| **Mock Proxy** (Tự động bật khi Dev) | Không cần gì thêm | Nội dung mẫu đa lĩnh vực, đủ để trải nghiệm giao diện | Demo nhanh, thử nghiệm UI |
| **Dev AI Bridge** (`npm run dev:ai`) | Chạy thêm 1 terminal | Nội dung chuyên sâu theo chủ đề, hỗ trợ hội thoại đa lượt | Phát triển & kiểm thử thực tế |
| **Production API** | API Key nhà cung cấp (Gemini, OpenAI...) | Chất lượng cao nhất từ LLM thương mại | Triển khai cho người dùng cuối |

---

### 11.2. Hướng Dẫn Cài Đặt & Cấu Hình

#### Chế Độ 1: Local Mock Proxy (Zero Config — Mặc Định)
Không cần cấu hình gì thêm. Khi chạy `npm run dev`, hệ thống tự động kích hoạt Mock Proxy với bộ sinh nội dung cục bộ hỗ trợ đa lĩnh vực (Trading, Ngoại ngữ, CNTT, Ẩm thực...).

#### Chế Độ 2: Dev AI Bridge Worker (Khuyên Dùng Cho Dev)
Mở **thêm 1 terminal** song song với `npm run dev`:
```bash
# Terminal 1: Khởi chạy ứng dụng Next.js
npm run dev

# Terminal 2: Khởi chạy AI Bridge Worker
npm run dev:ai
```

Worker sẽ tự động:
- Giám sát thư mục hàng đợi `.dev-ai-tasks/queue/`
- Gửi heartbeat để Dashboard biết trạng thái "🟢 Trực tuyến"
- Sinh nội dung bằng **Autonomous Engine** (không cần API key) hoặc gọi LLM API thật nếu có key
- Hỗ trợ **hội thoại đa lượt** — bạn có thể yêu cầu AI chỉnh sửa tiêu đề, mở rộng chủ đề, hoặc đổi góc nhìn

#### Chế Độ 3: Production (Kết Nối LLM API Thật)
Thêm API key vào biến môi trường `.env` hoặc cấu hình trong **Admin → Cài Đặt Hệ Thống**:
```env
# Chọn 1 hoặc nhiều nhà cung cấp:
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
DEEPSEEK_API_KEY="sk-..."
```

Hoặc cấu hình trực tiếp qua giao diện Admin Dashboard tại trang **Cài Đặt** (key được lưu an toàn vào Database, ưu tiên cao hơn biến môi trường).

---

### 11.3. Quy Trình Sử Dụng AI Copilot Trong Admin

1. **Mở AI Copilot**: Tại trang **Tạo Bài Viết Mới** (`/admin/posts/new`) hoặc **Chỉnh Sửa Bài Viết** (`/admin/posts/[id]/edit`), bấm nút **"✨ AI Copilot"** trên thanh công cụ.
2. **Nhập yêu cầu**: Gõ mô tả chủ đề bằng ngôn ngữ tự nhiên, ví dụ:
   - *"Viết bài phân tích xu hướng thị trường Forex quý 4/2026"*
   - *"Hãy lên ý tưởng bài viết về phương pháp học tiếng Nhật hiệu quả"*
   - *"Tạo bài hướng dẫn setup môi trường Next.js 15 cho người mới"*
3. **Xem nội dung AI sinh ra**: Nội dung được truyền về dạng streaming (từng đoạn) với hiệu ứng đánh máy thời gian thực.
4. **Tương tác đa lượt** *(Multi-turn)*: Bạn có thể tiếp tục trò chuyện để yêu cầu AI:
   - Đổi tiêu đề → *"Đổi tiêu đề thành: Bí quyết Trading thành công"*
   - Mở rộng nội dung → *"Phân tích sâu hơn phần phân tích kỹ thuật"*
   - Thay đổi phong cách → *"Viết lại theo phong cách dễ hiểu cho người mới"*
5. **Chèn nội dung vào biểu mẫu**: Bấm **"📥 Áp dụng bài viết"** để AI tự động điền:
   - **Tiêu đề bài viết** (Title)
   - **Tóm tắt** (Summary)
   - **Nội dung chính** (Content — Markdown)
   - **SEO Meta Title, Meta Description, Meta Keywords**
   - **Tags / Từ khóa**
6. **Chỉnh sửa & Xuất bản**: Rà soát, tinh chỉnh nội dung theo ý muốn rồi bấm **"Xuất bản"**.

> [!TIP]
> AI Copilot sử dụng bộ phân tích thông minh `extractPostData` để tự động tách các trường (Tiêu đề, Tóm tắt, SEO, Tags) từ văn bản AI trả về. Bạn không cần format cứng — chỉ cần gõ yêu cầu bằng ngôn ngữ tự nhiên.

---

### 11.4. Nhà Cung Cấp AI Được Hỗ Trợ

| Nhà Cung Cấp | Biến Môi Trường | Ghi Chú |
| :--- | :--- | :--- |
| **Google Gemini** *(Mặc định)* | `GEMINI_API_KEY` | Miễn phí với Gemini Flash, chất lượng cao với Gemini Pro |
| **OpenAI (GPT-4o)** | `OPENAI_API_KEY` | Chất lượng hàng đầu, phù hợp nội dung dài |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | Xuất sắc với nội dung phân tích chuyên sâu |
| **DeepSeek** | `DEEPSEEK_API_KEY` | Chi phí thấp, hỗ trợ tiếng Việt tốt |
| **Autonomous Engine** *(Dev)* | Không cần API key | Bộ sinh nội dung cục bộ tích hợp sẵn, hoạt động 100% offline |

> [!IMPORTANT]
> Khi cấu hình nhiều API key cùng lúc, hệ thống sẽ ưu tiên sử dụng nhà cung cấp được chọn trong **Admin → Cài Đặt → AI Provider mặc định** (key `aiDefaultProvider` trong bảng `Setting`). Nếu chưa cấu hình, mặc định sử dụng **Gemini**.

---

## 🛠️ Dịch Vụ Hỗ Trợ Triển Khai & Phát Triển Tính Năng Theo Yêu Cầu

Nền tảng được cung cấp mã nguồn mở theo giấy phép **GNU AGPLv3** để bạn tự do nghiên cứu, kiểm thử và tự host. Nếu doanh nghiệp hoặc học viện của bạn cần triển khai chuyên nghiệp, tối ưu hóa hạ tầng hoặc phát triển tính năng đặc thù, chúng tôi cung cấp các gói dịch vụ:

| Gói Dịch Vụ | Nội Dung & Hạng Mục Thực Hiện | Phù Hợp Cho |
| :--- | :--- | :--- |
| 🚀 **1. Cài Đặt Trọn Gói (Turnkey Setup)** | Cài đặt hoàn chỉnh lên VPS hoặc Cloud (Vercel, Supabase, Neon, Cloudflare R2), cấu hình tên miền riêng, chứng chỉ SSL HTTPS, máy chủ email SMTP và kết nối cổng thanh toán VietQR / PayPal. | Giảng viên, trung tâm muốn vận hành ngay trong 24h mà không cần lo về kỹ thuật. |
| 🎨 **2. Tùy Biến Thương Hiệu (White-Label)** | Thay đổi 100% nhận diện thương hiệu (Logo, Favicon, Bảng màu theo nhận diện, Banner, Phôi chứng chỉ tốt nghiệp PDF độc bản, Điều khoản & Chính sách). | Các học viện đào tạo muốn hệ thống mang thương hiệu riêng biệt. |
| ⚡ **3. Lập Trình Tính Năng Riêng (Custom Dev)** | Phát triển module chuyên sâu theo yêu cầu: Lớp học trực tuyến Zoom / Google Meet, Hệ thống thi trắc nghiệm Quiz/Exam nâng cao, Xuất hóa đơn điện tử VAT, Hệ thống hoa hồng Affiliate/CTV... | Các đơn vị đào tạo có mô hình giảng dạy hoặc kinh doanh đặc thù. |
| 🛡️ **4. Giấy Phép Thương Mại (Commercial License)** | Giấy phép cho phép tích hợp mã nguồn đóng, phân phối nội bộ hoặc kinh doanh SaaS đa người thuê (Multi-tenant) mà không cần công khai mã nguồn. | Doanh nghiệp & tập đoàn giáo dục. |

### 📞 Kênh Tiếp Nhận & Tư Vấn Kỹ Thuật:
* 📱 **Zalo**: [+84971929521](https://zalo.me/84971929521)
* ✈️ **Telegram**: [https://t.me/trading_world_support](https://t.me/trading_world_support)

---

© 2026 **NextLMS**. Phát hành theo giấy phép mã nguồn mở GNU AGPLv3. Xây dựng với tinh thần phụng sự.
