# Lộ Trình Phát Triển Nghiệp Vụ LMS (E-Learning Business Roadmap)

Tài liệu này quy hoạch chi tiết các tính năng và nghiệp vụ của nền tảng **World Trading Lab E-Learning** cần phát triển trong các giai đoạn tiếp theo, sau khi đã hoàn thiện nền tảng kỹ thuật cốt lõi (Next.js & PostgreSQL).

---

## MỤC TIÊU TỔNG THỂ
Chuyển đổi nền tảng từ mô hình **Bán khóa học cơ bản (Course Catalog & Video Gate)** sang mô hình **Hệ thống Quản lý Học tập Chuyên nghiệp (Full-featured LMS)** đạt chuẩn chất lượng quốc tế (tương đương Udemy, Coursera), bảo vệ bản quyền kiến thức, tối ưu hóa tỷ lệ hoàn thành khóa học và tự động hóa 100% quy trình vận hành kinh doanh.

---

## GIAI ĐOẠN 1: HỆ THỐNG THANH TOÁN ĐA KÊNH & TỰ ĐỘNG HÓA 24/7 (MULTI-GATEWAY PAYMENTS) [HOÀN THÀNH]
> **Mục tiêu**: Xây dựng hệ thống thanh toán linh hoạt, hỗ trợ cả thị trường Nội địa Việt Nam và Quốc tế. Toàn bộ các cổng thanh toán được bật/tắt và cấu hình tập trung từ Admin Dashboard.

### 1.1. Kiến trúc Cổng Thanh toán Đa Kênh (Admin Controlled) [x]
Admin có thể bật/tắt độc lập và cấu hình thông số kỹ thuật cho từng cổng tại `/admin/settings`:

1. **Thị trường Nội địa Việt Nam**:
   - [x] **VietQR Tự động (PayOS / SePay)**:
     - [x] Admin tùy chọn nhà cung cấp hoạt động (`PAYOS` hoặc `SEPAY`).
     - [x] Tự động sinh mã VietQR động theo từng đơn hàng, tiền vào thẳng tài khoản ngân hàng của Admin.
     - [x] Webhook kích hoạt khóa học tự động 24/7 chỉ sau 3–5 giây.
     - [x] Cấu hình: Client ID, API Key, Checksum Key (PayOS) hoặc API Key / Webhook Token (SePay).
   - [x] **Chuyển khoản Ngân hàng Thủ công (Manual Bank Transfer)**:
     - [x] Dành cho học viên quen chuyển khoản thông thường hoặc khi cổng tự động bảo trì.
     - [x] Hiển thị thông tin tài khoản ngân hàng + mã VietQR kèm form upload ảnh biên lai (bill).
     - [x] Admin duyệt đơn thủ công trong trang Quản trị Đơn hàng (`/admin/orders`).

2. **Thị trường Quốc tế (Cross-border Payments)**:
   - [x] **PayPal (Mặc định)**:
     - [x] Phương thức quốc tế mặc định, hỗ trợ ví điện tử PayPal và thẻ tín dụng/ghi nợ quốc tế (Visa, MasterCard, Amex) qua PayPal Smart Buttons.
     - [x] Tiền rút về ngân hàng Việt Nam bình thường, không đòi hỏi pháp nhân nước ngoài.
     - [x] Cấu hình: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` (`sandbox` / `live`).
   - [x] **Stripe (Tùy chọn kích hoạt)**:
     - [x] Dành cho kịch bản khi Admin có pháp nhân hoặc tài khoản quốc tế (Stripe Atlas / Singapore / US).
     - [x] Trải nghiệm thanh toán thẻ tín dụng trực tiếp (Stripe Elements / Checkout Session) chuẩn quốc tế.
     - [x] Cấu hình: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   - [x] **Tiền Mã Hóa Thủ Công - Crypto USDT (Đa Mạng BEP20 & TRC20)**:
     - [x] Hỗ trợ thanh toán Stablecoin USDT không biên giới qua 2 mạng lưới phổ biến nhất: BNB Smart Chain (BEP20) và Tron Network (TRC20).
     - [x] Địa chỉ ví được Admin cấu hình linh hoạt trong Dashboard (không có giá trị mặc định cứng).
     - [x] Hệ thống hiển thị cảnh báo nếu Admin chưa cấu hình địa chỉ ví khi học viên chọn phương thức này.
     - [x] Học viên quét mã QR ví, chuyển USDT và gửi mã TXID (Transaction Hash) hoặc ảnh biên lai để Admin duyệt đơn.

### 1.2. Luồng Xử Lý Webhook & Bảo Mật Giao Dịch [x]
- [x] **API Endpoints chuyên biệt cho từng cổng**:
  - [x] `POST /api/webhook/payos` (Xác thực chữ ký `HMAC-SHA256` với `CHECKSUM_KEY`).
  - [x] `POST /api/webhook/sepay` (Xác thực `API_KEY` trong header Authorization).
  - [x] `POST /api/webhook/paypal` (Xác thực webhook event qua PayPal SDK / API).
  - [x] `POST /api/webhook/stripe` (Xác thực chữ ký qua `stripe.webhooks.constructEvent`).
- [x] **Luồng xử lý nguyên tử (Prisma `$transaction` trong `src/lib/payment-service.ts`)**:
  - [x] 1. Kiểm tra tính hợp lệ của chữ ký Webhook (Security Signature Validation).
  - [x] 2. Cơ chế chống xử lý trùng lặp (**Idempotency & Optimistic Concurrency Control**): Kiểm tra trạng thái đơn hàng và mã giao dịch `gatewayRef`. Nếu đơn đã `COMPLETED`, trả về HTTP 200 ngay lập tức mà không xử lý lại.
  - [x] 3. Kiểm tra số tiền thực nhận $\ge$ `finalAmount` của đơn hàng (hỗ trợ dung sai làm tròn tỷ giá cho cổng quốc tế).
  - [x] 4. Thực thi transaction nguyên tử:
    - [x] Cập nhật `Order`: `status = "COMPLETED"`, `paymentMethod` tương ứng.
    - [x] Tạo bản ghi `Transaction`: lưu `orderId`, `gatewayRef`, `amount`, `bankCode`, `rawWebhookData`.
    - [x] Kích hoạt quyền học `Enrollment`: `status = "ACTIVE"`.
    - [x] Cập nhật số lượt dùng coupon `usedCount` (nếu có).
  - [x] 5. Gửi email xác nhận kèm biên lai điện tử tự động đến học viên qua Resend (`sendOrderConfirmationEmail`).

### 1.3. Trải Nghiệm Học Viên Tại Trang Thanh Toán (`/checkout/[slug]`) [x]
- [x] Hệ thống tự động truy vấn cấu hình các cổng đang `ENABLED` từ Database Settings:
  - [x] Bật VietQR Auto: Hiển thị Tab QR Động + Đồng hồ đếm ngược hết hạn (15 phút) + Trình lắng nghe Realtime / Polling trạng thái đơn hàng.
  - [x] Bật PayPal: Hiển thị Nút vàng thanh toán thông minh (PayPal Smart Buttons).
  - [x] Bật Stripe: Hiển thị Form nhập thẻ trực quan bảo mật (Stripe Card Element).
  - [x] Bật Chuyển khoản thủ công: Hiển thị Tab VietQR truyền thống kèm nút Upload bằng chứng thanh toán.
  - [x] Bật Crypto USDT: Hiển thị địa chỉ ví BEP20/TRC20, mã QR và form nộp TXID/biên lai.

### 1.4. Hoàn thiện Logic Mã Giảm Giá (Coupon Management) [x]
- [x] Sửa quy trình: Không trừ lượt `usedCount` khi đơn mới ở trạng thái `PENDING`. Chỉ trừ khi thanh toán thành công trong Prisma transaction.
- [x] Tự động dọn dẹp đơn hàng quá hạn thanh toán (`EXPIRED` sau 24h) qua worker định kỳ (`/api/cron/cleanup`).

---

## GIAI ĐOẠN 2: HỆ THỐNG ĐÁNH GIÁ & TRẮC NGHIỆM (QUIZZES & ASSESSMENTS)
> **Mục tiêu**: Đánh giá mức độ hiểu bài của học viên sau mỗi chương, đảm bảo chất lượng đào tạo trước khi cấp chứng chỉ.

### 2.1. Cấu trúc Cơ sở dữ liệu (Database Models)
- **Model `Quiz`**: `id`, `sectionId` (hoặc `courseId`), `title`, `description`, `passingScorePercent` (VD: 80%), `maxAttempts`, `timeLimitMinutes`.
- **Model `QuizQuestion`**: `id`, `quizId`, `questionText`, `questionType` (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`), `explanation`, `orderIndex`.
- **Model `QuizOption`**: `id`, `questionId`, `optionText`, `isCorrect`.
- **Model `QuizAttempt`**: `id`, `userId`, `quizId`, `scorePercent`, `isPassed`, `startedAt`, `completedAt`, `answersJson`.

### 2.2. Giao diện Học viên & Quản trị viên
- **Giao diện làm bài**: Đồng hồ đếm ngược, hiển thị câu hỏi trực quan, tự động nộp bài khi hết giờ.
- **Xem kết quả & Giải thích**: Học viên xem được điểm số, đáp án đúng/sai kèm lời giải thích chi tiết của giảng viên.
- **Quản trị**: Giảng viên có giao diện tạo/sửa ngân hàng câu hỏi, thiết lập điểm chuẩn.

---

## GIAI ĐOẠN 3: BÀI TẬP THỰC HÀNH & CHẤM ĐIỂM (ASSIGNMENTS & GRADING)
> **Mục tiêu**: Đặc thù đào tạo Trading & Kỹ thuật đòi hỏi thực hành phân tích biểu đồ, ghi nhật ký lệnh hoặc bài tập tình huống thực tế.

### 3.1. Chức năng Nộp bài (Student Submission)
- Giảng viên đính kèm đề bài thực hành ở cuối mỗi bài học hoặc mỗi chương.
- Học viên tải lên bài làm: Ảnh chụp biểu đồ phân tích, file PDF, file Excel nhật ký lệnh giao dịch, hoặc link TradingView.
- Trạng thái bài nộp: `SUBMITTED`, `GRADING`, `APPROVED`, `REVISION_REQUIRED` (cần sửa lại).

### 3.2. Cổng Giảng viên Chấm điểm (Instructor Grading Portal)
- Giảng viên nhận thông báo khi có bài tập mới cần chấm.
- Giao diện xem bài nộp trực tiếp, chấm điểm theo thang 100 và ghi chú nhận xét (feedback) chi tiết cho từng học viên.

---

## GIAI ĐOẠN 4: NÂNG CẤP TRẢI NGHIỆM HỌC TẬP CHUYÊN SÂU (ADVANCED LEARNING EXPERIENCE)
> **Mục tiêu**: Tạo sự thoải mái, thông minh và chủ động tối đa cho học viên khi tương tác với bài giảng video.

### 4.1. Lưu vị trí xem dở dang (Resume Video Playback) [ĐÃ TRIỂN KHAI PHẦN CLIENT]
- [x] Lưu vị trí xem dở dang vào trình duyệt (`localStorage`) theo từng bài học trong `CustomVideoPlayer.tsx`.
- [x] Khi học viên mở lại bài học, trình phát tự động tiếp tục từ giây đã dừng trước đó kèm thông báo: *"Đã tiếp tục phát từ MM:SS"*.
- [x] Tích hợp phím tắt phát/dừng, tua nhanh/chậm (Space, J, K, L, M, F) và menu điều chỉnh tốc độ phát (0.75x đến 2x).
- [ ] Kết nối đồng bộ trường `lastPositionSeconds` trong model `LessonProgress` qua API debounce định kỳ.

### 4.2. Ghi chú cá nhân theo Mốc thời gian (Timestamped Notes)
- Cho phép học viên ghi chú nhanh các ý quan trọng trong lúc xem video.
- Mỗi ghi chú gắn liền với mốc thời gian (VD: `05:20 - Điểm vào lệnh Buy`).
- Khi click vào mốc thời gian trong ghi chú, video sẽ lập tức nhảy đến đúng thời điểm đó.
- Học viên có thể xuất ghi chú ra file PDF/Word để ôn tập.

### 4.3. Cơ chế Khóa học Tuần tự & Drip Content
- **Khóa học điều kiện (Prerequisite Enforcement)**: Bắt buộc học viên phải hoàn thành bài 1 và đạt bài test của bài 1 mới được mở bài 2.
- **Ràng buộc thời gian xem tối thiểu**: Ngăn chặn tình trạng học viên bấm "Hoàn thành" liên tục để gian lận chứng chỉ (yêu cầu xem tối thiểu 80% video).
- **Drip Content**: Lên lịch mở khóa từng chương theo tuần (VD: Chương 1 mở ngay khi mua, Chương 2 mở sau 7 ngày).

---

## GIAI ĐOẠN 5: CHỨNG CHỈ CÔNG KHAI & BẢO VỆ BẢN QUYỀN (CERTIFICATION & ANTI-PIRACY)

### 5.1. Trang Xác Thực Chứng Chỉ Công Khai (`/certificates/[code]`) [HOÀN THÀNH]
- [x] Tự động sinh mã chứng chỉ duy nhất (`CERT-XXXXXXXXXXXX`) khi học viên đạt 100% tiến độ khóa học (`/api/progress/complete`).
- [x] Mỗi chứng chỉ hoàn thành khóa học có đường link công khai duy nhất: `/certificates/[code]`.
- [x] Giao diện chứng chỉ chuẩn mực, có dấu mộc số, huy hiệu bảo mật (`Verified Certificate`), đầy đủ thông tin học viên, khóa học, giảng viên.
- [x] Tích hợp mã QR động trên chứng chỉ, người xem hoặc nhà tuyển dụng có thể quét mã để kiểm tra tính xác thực trực tiếp.
- [x] Tối ưu hóa xuất / in file PDF chứng chỉ chất lượng cao khổ A4 Landscape (`window.print`).
- [ ] Cung cấp tính năng thêm vào LinkedIn ("Add to LinkedIn Profile").

### 5.2. Chống Sao Chép Lậu Bài Giảng (Anti-Piracy & Watermarking)
- [x] Vô hiệu hóa menu chuột phải (`onContextMenu` preventDefault) trên trình phát video.
- [x] Ẩn nút tải video trình duyệt mặc định (`controlsList="nodownload"`).
- [ ] **Dynamic Watermarking**: Hiển thị mờ mờ Email hoặc Số điện thoại của học viên đang đăng nhập chạy ngẫu nhiên trên màn hình trình phát video để ngăn chặn quay màn hình.

---

## GIAI ĐOẠN 6: TÀI KHOẢN, XÁC THỰC & CHĂM SÓC HỌC VIÊN (RETENTION & ENGAGEMENT) [HOÀN THÀNH]

### 6.1. Đăng nhập Một Chạm (Social OAuth) [x]
- [x] Tích hợp đăng nhập nhanh bằng **Google** qua NextAuth (theo yêu cầu Chú: chỉ dùng Google).
- [x] Tối ưu tỷ lệ chuyển đổi khi đăng ký, loại bỏ rào cản quên mật khẩu, tự động liên kết tài khoản OAuth.

### 6.2. Luồng Quên Mật Khẩu & Xác Thực Email [x]
- [x] Tích hợp dịch vụ gửi email Resend kèm cơ chế giả lập console trong môi trường Dev.
- [x] Tính năng "Quên mật khẩu": Tạo token bảo mật có thời hạn 15 phút và gửi link đặt lại mật khẩu về email (`/auth/forgot-password` & `/auth/reset-password`).
- [x] Xác thực email khi đăng ký mới để tránh tài khoản rác (`/auth/verify-email` & `/api/auth/resend-verification`).

### 6.3. Email Chăm Sóc Giao Dịch Tự Động (Transactional Emails) [x]
- [x] Email hóa đơn thanh toán & hướng dẫn bắt đầu học ngay sau khi mua (tự động kích hoạt khi duyệt đơn hàng).
- [x] Email nhắc nhở giữ nhịp học tập: Tự động gửi sau 5 ngày nếu học viên không có hoạt động học tập (`/api/cron/study-reminders`).
- [x] Email thông báo khi giảng viên trả lời bình luận trong phần Hỏi đáp (Q&A) (`/api/comments`).

---

## GIAI ĐOẠN 7: MỞ RỘNG KINH DOANH (PACKAGES, AFFILIATE & REVIEWS)

### 7.1. Combo Khóa học (Course Bundles)
- Cho phép mua nhiều khóa học trong 1 gói với mức giá ưu đãi.

### 7.2. Hệ thống Tiếp thị Liên kết (Affiliate / Referral System) [HOÀN THÀNH]
> **Mục tiêu**: Xây dựng kênh tăng trưởng người dùng tự nhiên (Organic Growth) bằng cách trao quyền cho học viên và cộng tác viên chia sẻ khóa học, nhận hoa hồng tự động, minh bạch và rút tiền thuận tiện.

1. **Cơ chế Tracking & Attribution**:
   - [x] Mã giới thiệu cá nhân duy nhất (`referralCode`) tự động tạo cho từng học viên.
   - [x] Link chia sẻ đa năng: Hỗ trợ link giới thiệu toàn sàn (`?ref=CODE`) và link gắn trực tiếp vào từng khóa học (`/courses/[slug]?ref=CODE`).
   - [x] Cơ chế Last-Click Cookie (30 ngày): Tự động ghi nhận chuyển đổi cho đối tác gần nhất mà người mua nhấp vào trước khi đặt hàng.
   - [x] Cơ chế chống tự mua hàng (Anti-Self-Referral Fraud): Chặn không cho học viên tự dùng mã giới thiệu của mình để trục lợi hoa hồng.

2. **Mô hình Dữ liệu & Vòng đời Hoa hồng (Commission Lifecycle)**:
   - [x] Model `Commission`: Lưu `orderId`, `affiliateId`, `orderAmount`, `commissionRate`, `commissionAmount`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `PAID`), `availableAt`.
   - [x] Phân bổ hoa hồng nguyên tử (Prisma `$transaction` trong `payment-service.ts`): Tự động tạo bản ghi hoa hồng ngay khi đơn hàng hoàn tất thanh toán.
   - [x] Chu kỳ giữ hoa hồng bảo vệ (Holding Period 7 ngày): Hoa hồng ở trạng thái `PENDING` trong 7 ngày (trùng thời hạn cam kết hoàn tiền `refundDays`). Sau 7 ngày, worker tự động chuyển sang `APPROVED` (đủ điều kiện rút). Nếu đơn hàng bị `REFUNDED`, hoa hồng tự động bị `REJECTED`.

3. **Cổng Học viên / Đối tác (Affiliate Portal - `/affiliate`)**:
   - [x] Thống kê KPI thời gian thực: Số dư khả dụng, Hoa hồng đang chờ duyệt, Đã thanh toán, Tổng đơn hàng thành công.
   - [x] Bộ công cụ tạo link giới thiệu nhanh cho từng khóa học (1 chạm sao chép).
   - [x] Bảng lịch sử hoa hồng chi tiết theo từng đơn hàng.
   - [x] Quản lý thông tin tài khoản ngân hàng nhận tiền.
   - [x] Form gửi yêu cầu rút tiền (Payout Request) với hạn mức tối thiểu (VD: 200,000 VND).

4. **Cổng Quản trị Viên (Admin Affiliate Hub - `/admin/affiliates` & `/admin/settings`)**:
   - [x] Cấu hình hệ thống: Bật/Tắt Affiliate, Tỷ lệ hoa hồng mặc định (VD: 20%), Thời hạn Cookie, Số ngày giữ hoa hồng, Hạn mức rút tiền tối thiểu.
   - [x] Cài đặt tỷ lệ hoa hồng riêng cho đối tác VIP / KOL (`customCommissionRate`).
   - [x] Quản lý danh sách đối tác và tổng doanh số mang lại.
   - [x] Quản lý yêu cầu rút tiền: Xem thông tin tài khoản ngân hàng của đối tác, nút bấm Duyệt chi (kèm upload ảnh bill chuyển khoản) hoặc Từ chối lệnh rút kèm lý do.

### 7.3. Đánh giá khóa học có kiểm duyệt (Course Reviews)
- Cho phép học viên gửi review, đánh giá sao kèm hình ảnh thực tế kết quả giao dịch và Admin duyệt trước khi hiển thị công khai.
