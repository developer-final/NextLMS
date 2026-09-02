# 🎓 World Trading Lab — Hệ thống Đào tạo & Khóa học Trực tuyến Toàn diện

**World Trading Lab** là nền tảng e-Learning đào tạo trực tuyến hiện đại, tối ưu hóa cho lĩnh vực Phân tích Tài chính, Smart Money Concepts (SMC), Đầu tư Chứng khoán, Crypto và Thuật toán Trading (nhưng có khả năng tùy biến linh hoạt cho mọi ngành nghề đào tạo khác).

Hệ thống được thiết kế theo mô hình **SaaS Stack tối ưu chi phí (0$ Chi phí Cố định)**, tốc độ tải trang cực nhanh, giao diện Dark Theme FinTech sang trọng, tích hợp đầy đủ quy trình Đăng ký $\rightarrow$ Thanh toán VietQR $\rightarrow$ Duyệt kích hoạt 1-click $\rightarrow$ Học trực tuyến $\rightarrow$ Cấp chứng chỉ tốt nghiệp.

---

## 🚀 1. Công nghệ & Kiến trúc Hệ thống (Tech Stack)

* **Framework Fullstack**: **Next.js 15 (App Router, TypeScript, React 19/18)** — Tối ưu SEO vượt trội với Server Components và bảo mật phía Server với Server Actions / Route Handlers.
* **Cơ sở dữ liệu & ORM**: **PostgreSQL** (hoặc SQLite cho local dev) kết hợp **Prisma ORM** — Quản lý dữ liệu quan hệ type-safe, dễ bảo trì và mở rộng.
* **Xác thực & Phân quyền (Auth & RBAC)**: **NextAuth.js (JWT Session)** — Phân quyền chặt chẽ các vai trò `SUPER_ADMIN`, `ADMIN`, `INSTRUCTOR`, `STUDENT`.
* **Cổng Thanh toán**: 
  * **VietQR Động**: Tự động sinh mã QR chuẩn NAPAS kèm số tiền và mã đơn hàng `EL-XXXX`.
  * **Duyệt Thủ công**: Học viên upload ảnh biên lai (Bill), Admin kiểm tra và kích hoạt 1 chạm.
  * **Webhook Tự động**: Sẵn sàng tích hợp SePay / Casso để kích hoạt sau 5 giây.
* **Media & Storage**: Hỗ trợ nhúng **YouTube (API Embed / Unlisted)**, **Video CDN / Cloudflare R2 / HTML5 Player**.
* **Soạn thảo Nội dung**: Hỗ trợ Rich Text & Markdown (chèn biểu đồ phân tích kỹ thuật, hình ảnh, code block).

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
   NEXT_PUBLIC_BANK_ID="MB"
   NEXT_PUBLIC_BANK_ACCOUNT_NO="0988888888"
   NEXT_PUBLIC_BANK_ACCOUNT_NAME="WORLD TRADING LAB"
   NEXT_PUBLIC_APP_NAME="World Trading Lab"
   ```

3. **Khởi tạo Cơ sở dữ liệu & Nạp dữ liệu mẫu (Seed Data)**:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

4. **Khởi chạy máy chủ phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại: **`http://localhost:3000`**

5. **Kiểm tra biên dịch sản phẩm (Production Build)**:
   ```bash
   npm run build
   # hoặc: npx next build
   ```

---

## 🔑 3. Tài khoản Mẫu để Thử nghiệm (Sample Accounts)

Tại trang Đăng nhập (`/auth/login`), hệ thống có sẵn các nút bấm điền nhanh tài khoản:

| Vai trò | Email | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| 👑 **Quản trị viên (Admin)** | `admin@finlearn.vn` | `123456` | Xem Dashboard doanh thu, Duyệt đơn hàng 1-click, Tạo/Chỉnh sửa khóa học, Cấp quyền học viên |
| 👨‍🏫 **Giảng viên (Instructor)** | `instructor@finlearn.vn` | `123456` | Tạo bài giảng, trả lời câu hỏi Q&A học viên |
| 🎓 **Học viên mẫu (Student)** | `student@finlearn.vn` | `123456` | Đã sở hữu khóa học SMC Masterclass (tiến độ 40%), xem video bài giảng, thảo luận |

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

---

## 💻 5. Tổng hợp Các Lệnh Thông Dụng (CLI Commands)

| Lệnh | Mục đích sử dụng |
| :--- | :--- |
| `npm run dev` | Khởi chạy máy chủ phát triển cục bộ tại `http://localhost:3000` |
| `npm run build` | Biên dịch tối ưu toàn bộ dự án cho môi trường Production |
| `npm start` | Chạy ứng dụng đã build ở chế độ Production |
| `npx prisma db push` | Đẩy các thay đổi trong file `prisma/schema.prisma` vào Database |
| `npx prisma studio` | Mở giao diện đồ họa GUI trên trình duyệt để xem và sửa trực tiếp dữ liệu DB |
| `node prisma/seed.js` | Nạp lại dữ liệu mẫu (Khóa học SMC, tài khoản Admin, Giảng viên, Học viên) |

---

## 📂 6. Cấu trúc Thư mục Dự án

```
eLearning/
├── prisma/
│   ├── schema.prisma        # Mô hình cơ sở dữ liệu quan hệ (15 bảng)
│   ├── seed.js              # Script khởi tạo dữ liệu mẫu thực tế
│   └── dev.db               # SQLite database cục bộ
├── src/
│   ├── app/                 # Next.js 15 App Router (Pages & API Routes)
│   │   ├── (auth)/          # Trang Đăng nhập & Đăng ký tài khoản
│   │   ├── about/           # Trang Giới thiệu học viện
│   │   ├── admin/           # Phân hệ Quản trị Dashboard, Orders, Courses, Students
│   │   ├── api/             # REST API Handlers (Auth, Orders, Progress, Comments, Coupons)
│   │   ├── categories/      # Danh mục chủ đề đào tạo
│   │   ├── checkout/        # Trang Thanh toán VietQR & Upload Bill
│   │   ├── courses/         # Trang Danh sách & Chi tiết Khóa học
│   │   ├── learn/           # LMS Classroom Player & Q&A
│   │   ├── my-courses/      # Trang Khóa học của tôi
│   │   ├── policy/          # Chính sách thanh toán, hoàn tiền, điều khoản
│   │   ├── globals.css      # Design System CSS, Dark theme, Glassmorphism
│   │   └── layout.tsx       # Root Layout
│   ├── components/
│   │   ├── cards/           # CourseCard, v.v.
│   │   ├── layout/          # Navbar, Footer
│   │   └── providers/       # AuthProvider, ToastProvider (Sonner)
│   ├── lib/
│   │   ├── auth.ts          # NextAuth Options & Session config
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   ├── utils.ts         # Tiện ích format VND, thời gian, slugify, YouTube embed
│   │   └── vietqr.ts        # Generator mã QR VietQR chuẩn NAPAS
│   └── types/               # Kiểu dữ liệu TypeScript
├── .env                     # Biến môi trường
├── package.json             # Danh sách thư viện phụ thuộc
└── tailwind.config.ts       # Cấu hình bảng màu FinTech & hiệu ứng
```

---

## 🌐 7. Hướng dẫn Triển khai Lên Môi trường Production (0$ Cloud Deploy)

1. **Cơ sở dữ liệu**: Tạo một Database PostgreSQL miễn phí tại **Supabase** hoặc **Neon.tech** $\rightarrow$ Dán chuỗi kết nối vào `DATABASE_URL` trong `.env`.
2. **Deploy Mã nguồn**: Đẩy code lên GitHub $\rightarrow$ Import dự án vào **Vercel** hoặc **Cloudflare Pages** (Deploy tự động với 1 click).
3. **Cấu hình Biến môi trường trên Vercel**: Điền `DATABASE_URL`, `NEXTAUTH_URL` (domain thật), `NEXTAUTH_SECRET`, `NEXT_PUBLIC_BANK_ID`, `NEXT_PUBLIC_BANK_ACCOUNT_NO`.

---

© 2026 **World Trading Lab**. Đã đăng ký bản quyền. Xây dựng với đam mê và tinh thần phụng sự học viên!
