# Lộ Trình Phát Triển Nghiệp Vụ LMS (E-Learning Business Roadmap)

Tài liệu này quy hoạch chi tiết các tính năng và nghiệp vụ của nền tảng **World Trading Lab E-Learning** cần phát triển trong các giai đoạn tiếp theo, sau khi đã hoàn thiện nền tảng kỹ thuật cốt lõi (Next.js & PostgreSQL).

---

## MỤC TIÊU TỔNG THỂ
Chuyển đổi nền tảng từ mô hình **Bán khóa học cơ bản (Course Catalog & Video Gate)** sang mô hình **Hệ thống Quản lý Học tập Chuyên nghiệp (Full-featured LMS)** đạt chuẩn chất lượng quốc tế (tương đương Udemy, Coursera), bảo vệ bản quyền kiến thức, tối ưu hóa tỷ lệ hoàn thành khóa học và tự động hóa 100% quy trình vận hành kinh doanh.

---

## GIAI ĐOẠN 1: HỆ THỐNG THANH TOÁN ĐA KÊNH & TỰ ĐỘNG HÓA 24/7 (MULTI-GATEWAY PAYMENTS)
> **Mục tiêu**: Xây dựng hệ thống thanh toán linh hoạt, hỗ trợ cả thị trường Nội địa Việt Nam và Quốc tế. Toàn bộ các cổng thanh toán được bật/tắt và cấu hình tập trung từ Admin Dashboard.

### 1.1. Kiến trúc Cổng Thanh toán Đa Kênh (Admin Controlled)
Admin có thể bật/tắt độc lập và cấu hình thông số kỹ thuật cho từng cổng tại `/admin/settings`:

1. **Thị trường Nội địa Việt Nam**:
   - **VietQR Tự động (PayOS / SePay)**:
     - Admin tùy chọn nhà cung cấp hoạt động (`PAYOS` hoặc `SEPAY`).
     - Tự động sinh mã VietQR động theo từng đơn hàng, tiền vào thẳng tài khoản ngân hàng của Admin.
     - Webhook kích hoạt khóa học tự động 24/7 chỉ sau 3–5 giây.
     - Cấu hình: Client ID, API Key, Checksum Key (PayOS) hoặc API Key / Webhook Token (SePay).
   - **Chuyển khoản Ngân hàng Thủ công (Manual Bank Transfer - Giữ nguyên)**:
     - Dành cho học viên quen chuyển khoản thông thường hoặc khi cổng tự động bảo trì.
     - Hiển thị thông tin tài khoản ngân hàng + mã VietQR kèm form upload ảnh biên lai (bill).
     - Admin duyệt đơn thủ công trong trang Quản trị Đơn hàng (`/admin/orders`).

2. **Thị trường Quốc tế (Cross-border Payments)**:
   - **PayPal (Mặc định)**:
     - Phương thức quốc tế mặc định, hỗ trợ ví điện tử PayPal và thẻ tín dụng/ghi nợ quốc tế (Visa, MasterCard, Amex) qua PayPal Guest Checkout.
     - Tiền rút về ngân hàng Việt Nam bình thường, không đòi hỏi pháp nhân nước ngoài.
     - Cấu hình: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` (`sandbox` / `live`).
   - **Stripe (Tùy chọn kích hoạt)**:
     - Dành cho kịch bản khi Admin có pháp nhân hoặc tài khoản quốc tế (Stripe Atlas / Singapore / US).
     - Trải nghiệm thanh toán thẻ tín dụng trực tiếp (Stripe Elements / Checkout Session) chuẩn quốc tế.
     - Cấu hình: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   - **Tiền Mã Hóa Thủ Công - Crypto USDT (Đa Mạng BEP20 & TRC20)**:
     - Hỗ trợ thanh toán Stablecoin USDT không biên giới qua 2 mạng lưới phổ biến nhất: BNB Smart Chain (BEP20) và Tron Network (TRC20).
     - Địa chỉ ví được Admin cấu hình linh hoạt trong Dashboard (không có giá trị mặc định cứng).
     - Hệ thống hiển thị cảnh báo nếu Admin chưa cấu hình địa chỉ ví khi học viên chọn phương thức này.
     - Học viên quét mã QR ví, chuyển USDT và gửi mã TXID (Transaction Hash) hoặc ảnh biên lai để Admin duyệt đơn.

### 1.2. Luồng Xử Lý Webhook & Bảo Mật Giao Dịch
- **API Endpoints chuyên biệt cho từng cổng**:
  - `POST /api/webhook/payos` (Xác thực chữ ký `HMAC-SHA256` với `CHECKSUM_KEY`).
  - `POST /api/webhook/sepay` (Xác thực `API_KEY` trong header Authorization).
  - `POST /api/webhook/paypal` (Xác thực webhook event qua PayPal SDK / API).
  - `POST /api/webhook/stripe` (Xác thực chữ ký qua `stripe.webhooks.constructEvent`).
- **Luồng xử lý nguyên tử (Prisma `$transaction`)**:
  1. Kiểm tra tính hợp lệ của chữ ký Webhook (Security Signature Validation).
  2. Cơ chế chống xử lý trùng lặp (**Idempotency**): Kiểm tra trạng thái đơn hàng và mã giao dịch `gatewayRef`. Nếu đơn đã `COMPLETED`, trả về HTTP 200 ngay lập tức mà không xử lý lại.
  3. Kiểm tra số tiền thực nhận $\ge$ `finalAmount` của đơn hàng.
  4. Thực thi transaction nguyên tử:
     - Cập nhật `Order`: `status = "COMPLETED"`, `paymentMethod` tương ứng.
     - Tạo bản ghi `Transaction`: lưu `orderId`, `gatewayRef`, `amount`, `bankCode`, `rawWebhookData`.
     - Kích hoạt quyền học `Enrollment`: `status = "ACTIVE"`.
     - Cập nhật số lượt dùng coupon `usedCount` (nếu có).
  5. Gửi email xác nhận kèm biên lai điện tử tự động đến học viên.

### 1.3. Trải Nghiệm Học Viên Tại Trang Thanh Toán (`/checkout/[slug]`)
- Hệ thống tự động truy vấn cấu hình các cổng đang `ENABLED` từ Database Settings:
  - Nếu bật VietQR Auto: Hiển thị Tab QR Động + Đồng hồ đếm ngược hết hạn (15 phút) + Trình lắng nghe Realtime / Polling trạng thái đơn hàng.
  - Nếu bật PayPal: Hiển thị Nút vàng thanh toán thông minh (PayPal Smart Buttons).
  - Nếu bật Stripe: Hiển thị Form nhập thẻ trực quan bảo mật (Stripe Card Element).
  - Nếu bật Chuyển khoản thủ công: Hiển thị Tab VietQR truyền thống kèm nút Upload bằng chứng thanh toán.

### 1.4. Hoàn thiện Logic Mã Giảm Giá (Coupon Management)
- Sửa quy trình: Không trừ lượt `usedCount` khi đơn mới ở trạng thái `PENDING`. Chỉ trừ khi thanh toán thành công.
- Tự động hoàn lại lượt sử dụng nếu đơn hàng bị `CANCELLED` hoặc quá hạn thanh toán (`EXPIRED` sau 24h).
- Bổ sung cấu hình: Mã áp dụng cho từng khóa học cụ thể, giới hạn 1 lần dùng/1 tài khoản học viên.

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

### 4.1. Lưu vị trí xem dở dang (Resume Video Playback)
- Kết nối trường `lastPositionSeconds` trong model `LessonProgress`.
- Khi học viên tạm dừng hoặc tắt trình duyệt, client tự động đồng bộ thời gian xem hiện tại (qua debounce 5 giây).
- Khi học viên mở lại bài học, trình phát tự động tiếp tục từ giây đã dừng trước đó kèm thông báo: *"Tiếp tục từ phút 08:35"*.

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

### 5.1. Trang Xác Thực Chứng Chỉ Công Khai (`/certificates/[code]`)
- Mỗi chứng chỉ hoàn thành khóa học có đường link công khai duy nhất: `worldtradinglab.edu.vn/certificates/CERT-WTL-XXXX`.
- Cung cấp tính năng thêm vào LinkedIn ("Add to LinkedIn Profile") và tải file PDF chứng chỉ chất lượng cao (có dấu mộc số và chữ ký giảng viên).
- Nhà tuyển dụng hoặc cộng đồng có thể quét mã QR trên chứng chỉ để kiểm tra tính xác thực.

### 5.2. Chống Sao Chép Lậu Bài Giảng (Dynamic Watermarking)
- Hiển thị mờ mờ Email hoặc Số điện thoại của học viên đang đăng nhập chạy ngẫu nhiên trên màn hình trình phát video.
- Ngăn chặn học viên quay lại màn hình để chia sẻ hoặc bán lậu khóa học ra bên ngoài.

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
- **Combo Khóa học (Course Bundles)**: Cho phép mua nhiều khóa học trong 1 gói với mức giá ưu đãi.
- **Hệ thống Tiếp thị Liên kết (Affiliate / Referral)**: Cấp mã giới thiệu cho học viên cũ chia sẻ để nhận hoa hồng.
- **Đánh giá khóa học có kiểm duyệt**: Cho phép học viên gửi review, đánh giá sao kèm hình ảnh thực tế kết quả giao dịch.
