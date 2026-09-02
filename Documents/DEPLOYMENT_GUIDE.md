# Hướng Dẫn Triển Khai Hệ Thống E-Learning (Vercel + Neon/Supabase + CI/CD)

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng **World Trading Lab E-Learning** lên môi trường chạy thực tế (Production) theo kiến trúc **Serverless** đơn giản, bảo mật và hoàn toàn miễn phí ban đầu.

---

## 1. Tổng Quan Kiến Trúc Hạ Tầng

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

## 2. Bước 1: Khởi Tạo Cơ Sở Dữ Liệu PostgreSQL (Miễn Phí)

Khuyến nghị sử dụng **Neon.tech** (tối ưu hóa cho Serverless Next.js, có sẵn Connection Pooling và độ trễ thấp).

### Cách tạo trên Neon.tech (khoảng 1 phút):
1. Truy cập [https://neon.tech](https://neon.tech) và đăng nhập bằng tài khoản GitHub hoặc Google.
2. Bấm **Create Project**:
   - Project name: `elearning-platform`
   - Postgres version: Mặc định (16 hoặc 15)
   - Region: Chọn vùng gần Việt Nam nhất (ví dụ: `Singapore - ap-southeast-1`).
3. Sau khi tạo xong, Neon sẽ hiển thị chuỗi kết nối dạng:
   ```text
   postgresql://alex:AbC123dEf@ep-cool-mountain-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Sao chép chuỗi kết nối này.

---

## 3. Bước 2: Cập Nhật Biến Môi Trường Cục Bộ & Đẩy Dữ Liệu Lên DB

1. Mở file `.env` trên máy và dán chuỗi kết nối vừa sao chép:
   ```env
   DATABASE_URL="postgresql://alex:AbC123dEf@ep-cool-mountain-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
2. Mở terminal và chạy lệnh đồng bộ bảng dữ liệu lên Neon:
   ```bash
   npx prisma db push
   ```
   *(Lệnh này sẽ tự động tạo tất cả các bảng: users, courses, lessons, orders,... trên cơ sở dữ liệu cloud)*
3. Chạy lệnh nạp dữ liệu mẫu ban đầu (khóa học, danh mục, tài khoản admin):
   ```bash
   npm run db:seed
   ```
4. Kiểm tra dữ liệu trực tiếp bằng giao diện trực quan của Prisma Studio (nếu muốn):
   ```bash
   npx prisma studio
   ```

---

## 4. Bước 3: Triển Khai Lên Vercel (Zero-DevOps)

1. Đăng nhập vào [https://vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **Add New...** -> **Project**.
3. Chọn kho mã nguồn (Repository) của dự án `eLearning`.
4. Tại phần **Configure Project**:
   - **Framework Preset**: Tự động nhận diện là `Next.js`.
   - **Root Directory**: `./` (để mặc định).
5. Mở phần **Environment Variables** và thêm các biến quan trọng sau:

| Tên Biến Môi Trường | Giá Trị Mẫu | Mô Tả |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://alex:...@...neon.tech/neondb?sslmode=require` | Chuỗi kết nối PostgreSQL lấy từ Neon |
| `NEXTAUTH_SECRET` | Chạy lệnh `openssl rand -base64 32` để tạo mã bí mật | Khóa bí mật mã hóa phiên đăng nhập JWT |
| `NEXTAUTH_URL` | `https://ten-du-an-cua-chu.vercel.app` (hoặc tên miền riêng) | Địa chỉ URL chạy chính thức của website |
| `NEXT_PUBLIC_APP_NAME` | `World Trading Lab` | Tên hiển thị của thương hiệu |
| `NEXT_PUBLIC_BANK_ID` | `MB` | Mã ngân hàng nhận chuyển khoản VietQR |
| `NEXT_PUBLIC_BANK_ACCOUNT_NO` | `0988888888` | Số tài khoản nhận tiền học phí |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | `WORLD TRADING LAB` | Tên chủ tài khoản ngân hàng |
| `PAYMENT_WEBHOOK_API_KEY` | `khoa_bi_mat_webhook_tuy_chon` | Khóa xác thực webhook từ Casso/SePay |

6. Bấm nút **Deploy**.
   - Vercel sẽ tự động tải mã nguồn, chạy `prisma generate` và `next build`.
   - Trong vòng 1 - 2 phút, website sẽ chính thức online với chứng chỉ SSL HTTPS hoàn toàn miễn phí.

---

## 5. Bước 4: Quy Trình CI/CD Tự Động Với GitHub Actions

Kịch bản tự động hóa đã được thiết lập tại `.github/workflows/ci.yml`.

### Cơ chế hoạt động:
- Mỗi khi thành viên trong đội ngũ `git push` lên nhánh `main`, `master`, hoặc `develop`:
  - GitHub Actions sẽ tự động khởi động một máy chủ ảo Ubuntu độc lập.
  - Tự động chạy chuỗi kiểm tra chất lượng:
    1. **Type Check**: `tsc --noEmit` để đảm bảo không có lỗi ép kiểu, lỗi logic TypeScript.
    2. **Linting**: `npm run lint` kiểm tra chuẩn viết code.
    3. **Unit Tests**: Chạy 92 kịch bản kiểm thử tự động với Vitest.
    4. **Build Test**: Thử nghiệm đóng gói dự án Next.js để phát hiện sớm các lỗi trang tĩnh hoặc bundle.
- Nếu tất cả các bước đều vượt qua (dấu tích xanh ✅), code mới được coi là an toàn.
- Nếu có bất kỳ lỗi nào (dấu x đỏ ❌), GitHub sẽ gửi email cảnh báo và chặn việc merge code lỗi vào nhánh chính.

---

## 6. Lệnh Vận Hành Thường Dùng (Cheatsheet)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run type-check` | Kiểm tra lỗi kiểu dữ liệu TypeScript toàn dự án |
| `npm run lint` | Soát lỗi cú pháp và tiêu chuẩn mã nguồn |
| `npm test` | Chạy bộ kiểm thử tự động 92 test cases |
| `npm run ci` | Chạy toàn bộ các bước kiểm tra chất lượng như trên GitHub Actions |
| `npm run db:push` | Đẩy các cập nhật mới trong `schema.prisma` lên PostgreSQL |
| `npm run db:seed` | Nạp dữ liệu tài khoản, danh mục, khóa học mẫu ban đầu |
