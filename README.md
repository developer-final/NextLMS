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
| `npm run type-check` | Kiểm tra lỗi kiểu dữ liệu TypeScript toàn dự án (`tsc --noEmit`) |
| `npm run lint` | Soát lỗi cú pháp và tiêu chuẩn mã nguồn |
| `npm test` | Chạy bộ kiểm thử tự động test cases với Vitest |
| `npm run ci` | Chạy toàn bộ chuỗi kiểm tra chất lượng (Type-check, Lint, Test) như GitHub Actions |
| `npx prisma db push` | Đẩy các thay đổi trong file `prisma/schema.prisma` vào Database |
| `npx prisma studio` | Mở giao diện đồ họa GUI trên trình duyệt để xem và sửa trực tiếp dữ liệu DB |
| `node prisma/seed.js` | Nạp lại dữ liệu mẫu (Khóa học SMC, tài khoản Admin, Giảng viên, Học viên) |

---

## 🔄 6. Hướng dẫn Tùy Biến & Chuyển Đổi Sang Lĩnh Vực / Ngành Khác

Nền tảng được thiết kế theo kiến trúc **Generic LMS (Quản lý Học tập Đa năng)**. Toàn bộ logic nghiệp vụ (trình phát video, đo lường tiến độ, thanh toán VietQR tự động, quản lý đơn hàng, cấp chứng chỉ và phân quyền) hoàn toàn trung lập và độc lập với nội dung tài chính.

Bạn có thể chuyển đổi hệ thống sang bất kỳ lĩnh vực nào (Lập trình, Ngoại ngữ, Marketing, Thiết kế, Kỹ năng mềm...) trong vòng **30 - 60 phút** theo 4 bước sau:

### Bước 1: Đổi Tên Thương Hiệu & Thông Tin Liên Hệ
* Mở file [`.env`](./.env) và [`src/lib/config.ts`](./src/lib/config.ts):
  * `NEXT_PUBLIC_APP_NAME`: Tên thương hiệu mới (VD: `CodeMaster Academy`, `IELTS Pro Lab`...).
  * `NEXT_PUBLIC_BANK_ACCOUNT_NAME`: Tên chủ tài khoản nhận học phí.
  * `appSlogan`, `appDescription`: Khẩu hiệu và mô tả tổng quan nền tảng.
  * `supportEmail`, `supportHotline`, `zaloUrl`, `facebookUrl`: Kênh hỗ trợ của bạn.

### Bước 2: Cập Nhật Nội Dung Giao Diện & Đa Ngôn Ngữ (i18n)
* Mở file từ điển Tiếng Việt [`src/lib/i18n/vi.ts`](./src/lib/i18n/vi.ts) và Tiếng Anh [`src/lib/i18n/en.ts`](./src/lib/i18n/en.ts):
  * `home.heroTitleLine1`, `home.heroTitleHighlight`, `home.heroDescription`: Tiêu đề và nội dung nổi bật của banner trang chủ.
  * `home.feature1Title`, `feature1Desc` ...: Các ưu điểm nổi bật của học viện.
  * `about.description`: Đoạn giới thiệu tầm nhìn, sứ mệnh của học viện mới.
  * `policy`: Điều khoản dịch vụ và chính sách bảo mật phù hợp với ngành mới.

### Bước 3: Thay Đổi Danh Mục & Khóa Học Mẫu (Seed Data)
* Mở file [`prisma/seed.js`](./prisma/seed.js):
  * Thay đổi danh mục đào tạo trong `categories` (xem bảng gợi ý bên dưới).
  * Thay đổi tên khóa học, mô tả, ảnh thumbnail, video YouTube bài giảng demo trong `courses` & `lessons`.
  * Thay đổi tên & tiểu sử giảng viên mẫu (`instructor`).
* Chạy lệnh nạp lại dữ liệu sạch vào hệ thống:
  ```bash
  node prisma/seed.js
  ```

### Bước 4: Cập Nhật Logo & Tiêu Đề SEO
* **Logo trên Navbar**: Chỉnh sửa tại [`src/components/layout/Navbar.tsx`](./src/components/layout/Navbar.tsx) (thay text logo hoặc thay bằng thẻ `<Image />` chứa logo thương hiệu).
* **Metadata SEO & Sitemap**: Cập nhật thẻ tiêu đề và từ khóa tại [`src/app/layout.tsx`](./src/app/layout.tsx) và domain tại [`src/app/sitemap.ts`](./src/app/sitemap.ts).

---

### 💡 Bảng Gợi Ý Danh Mục Theo Từng Ngành Nghề:

| Ngành Nghề Mục Tiêu | Danh Mục Đào Tạo Gợi Ý (`Category`) | Màu Sắc / Phong Cách Phù Hợp |
| :--- | :--- | :--- |
| 💻 **Lập Trình & CNTT (Tech / Coding)** | Lập trình Web Fullstack, Trí tuệ Nhân tạo & Python, Mobile App (Flutter/React Native), DevOps & Cloud | Rất hợp với Dark Theme hiện tại, dùng accent Xanh Emerald / Cyan |
| 🗣️ **Ngoại Ngữ (Language Learning)** | Tiếng Anh Giao Tiếp, Luyện thi IELTS/TOEIC, Tiếng Trung HSK, Tiếng Nhật JLPT | Giao diện hiện đại, thân thiện với học viên trẻ |
| 📈 **Digital Marketing & Kinh Doanh** | Facebook/TikTok Ads thực chiến, SEO & Content Marketing, Kinh doanh Sàn E-Commerce | Nhấn mạnh vào kết quả chuyển đổi và thực hành |
| 🎨 **Thiết Kế & Multimedia** | Thiết kế UI/UX Figma, Đồ họa Photoshop/Illustrator, Dựng phim Premiere/CapCut, 3D Blender | Tận dụng tốt hệ thống hiển thị thumbnail sắc nét và video HD |

---

## 📂 7. Cấu trúc Thư mục Dự án

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
│   │   ├── layout/          # Navbar, Footer, LanguageSwitcher
│   │   └── providers/       # AuthProvider, LanguageProvider, ToastProvider (Sonner)
│   ├── lib/
│   │   ├── auth.ts          # NextAuth Options & Session config
│   │   ├── config.ts        # Cấu hình thương hiệu & settings hệ thống
│   │   ├── i18n/            # Hệ thống từ điển đa ngôn ngữ (vi.ts, en.ts)
│   │   ├── prisma.ts        # Prisma Client singleton
│   │   ├── utils.ts         # Tiện ích format VND, thời gian, slugify, YouTube embed
│   │   └── vietqr.ts        # Generator mã QR VietQR chuẩn NAPAS
│   └── types/               # Kiểu dữ liệu TypeScript
├── .env                     # Biến môi trường
├── package.json             # Danh sách thư viện phụ thuộc
└── tailwind.config.ts       # Cấu hình bảng màu FinTech & hiệu ứng
```

---

## 🌐 8. Hướng Dẫn Triển Khai Hạ Tầng & CI/CD (Vercel + Neon/Supabase + GitHub Actions)

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng **World Trading Lab E-Learning** lên môi trường chạy thực tế (Production) theo kiến trúc **Serverless** đơn giản, bảo mật, tối ưu chi phí (0$ chi phí cố định ban đầu) và tự động hóa toàn diện.

---

### 8.1. Tổng Quan Kiến Trúc Hạ Tầng (Cloud Serverless)

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

### 8.2. Hướng Dẫn Đưa Dự Án Lên GitHub

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

### 8.3. Khởi Tạo Cơ Sở Dữ Liệu Cloud PostgreSQL (Miễn Phí với Neon hoặc Supabase)

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

### 8.4. Triển Khai Lên Vercel (Khuyên Dùng - Zero-DevOps)

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
   | `NEXT_PUBLIC_APP_NAME` | `World Trading Lab` | Tên hiển thị của thương hiệu |
   | `NEXT_PUBLIC_BANK_ID` | `MB` | Mã ngân hàng nhận chuyển khoản VietQR |
   | `NEXT_PUBLIC_BANK_ACCOUNT_NO` | `0988888888` | Số tài khoản nhận tiền học phí |
   | `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | `WORLD TRADING LAB` | Tên chủ tài khoản ngân hàng |
   | `PAYMENT_WEBHOOK_API_KEY` | `khoa_bi_mat_webhook_tuy_chon` | Khóa xác thực webhook từ Casso/SePay |

5. **Deploy**: Bấm nút **"Deploy"**.
   - Vercel sẽ tự động tải mã nguồn, chạy `prisma generate` và `next build`.
   - Trong vòng 1 - 2 phút, website sẽ chính thức online với chứng chỉ SSL HTTPS hoàn toàn miễn phí.

---

### 8.5. Triển Khai Lên Cloudflare Pages (Tùy Chọn)

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

### 8.6. Quy Trình CI/CD Tự Động Với GitHub Actions

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

© 2026 **World Trading Lab**. Đã đăng ký bản quyền. Xây dựng với tinh thần phụng sự.
