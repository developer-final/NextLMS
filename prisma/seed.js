const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seed for World Trading Lab...");

  // Clean old data
  await prisma.comment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Nguyễn Văn Admin",
      email: "admin@finlearn.vn",
      passwordHash,
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      headline: "Nhà sáng lập & Quản trị Hệ thống World Trading Lab",
      bio: "Hơn 12 năm kinh nghiệm trong thị trường tài chính và phát triển hệ thống giáo dục trực tuyến.",
    },
  });

  const instructor = await prisma.user.create({
    data: {
      name: "Trần Minh Quang (SMC Master)",
      email: "instructor@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
      headline: "Chuyên gia Giao dịch SMC & Quản trị Quỹ Prop Firm",
      bio: "Cựu Senior Trader tại quỹ đầu tư Singapore, đã đào tạo hơn 5.000 học viên đạt chuẩn cấp vốn FTMO/MFF.",
    },
  });

  const instructorIELTS = await prisma.user.create({
    data: {
      name: "Thầy Đặng Vũ (IELTS 8.5 Overall)",
      email: "ielts.teacher@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      headline: "Chuyên gia Luyện thi IELTS 8.5 & Cựu Du học sinh Anh Quốc",
      bio: "Hơn 8 năm kinh nghiệm đào tạo học thuật, dẫn dắt hơn 3.200 học viên đạt band điểm 7.0 - 8.5+.",
    },
  });

  const instructorBaking = await prisma.user.create({
    data: {
      name: "Chef Mai Hương (Master Pastry Chef)",
      email: "baking.chef@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
      headline: "Bếp trưởng Bánh Âu - Tốt nghiệp Le Cordon Bleu Paris",
      bio: "Hơn 10 năm nghiên cứu men tự nhiên Sourdough và đào tạo hàng nghìn chủ tiệm bánh khởi nghiệp.",
    },
  });

  const instructorFitness = await prisma.user.create({
    data: {
      name: "HLV Hoàng Long (Certified Fitness Coach)",
      email: "fitness.coach@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
      headline: "Chuyên gia Huấn luyện Hình thể & Dinh dưỡng Thể hình Chuẩn Khoa học",
      bio: "Chứng chỉ quốc tế NASM, chuyên gia tư vấn siết cơ giảm mỡ cho hơn 4.000 học viên thành công.",
    },
  });

  const student = await prisma.user.create({
    data: {
      name: "Lê Hoàng Nam",
      email: "student@finlearn.vn",
      passwordHash,
      role: "STUDENT",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
      headline: "Học viên khoá SMC 2026",
    },
  });

  console.log("✅ Users created: Admin, Instructors (Trading, IELTS, Baking, Fitness), Student");

  // 2. Create Categories
  // 2.1 Trading Categories
  const catSMC = await prisma.category.create({
    data: {
      name: "Giao dịch SMC & Price Action",
      slug: "smc-price-action",
      description: "Phương pháp đọc dòng tiền tổ chức (Smart Money Concepts), Cấu trúc thị trường và Order Flow chuyên sâu.",
      icon: "TrendingUp",
      orderIndex: 1,
    },
  });

  const catStock = await prisma.category.create({
    data: {
      name: "Đầu tư Chứng khoán Thực chiến",
      slug: "chung-khoan-viet-nam",
      description: "Phân tích cơ bản doanh nghiệp, đọc báo cáo tài chính và tìm điểm mua theo dòng tiền lớn VSA.",
      icon: "BarChart3",
      orderIndex: 2,
    },
  });

  const catAlgo = await prisma.category.create({
    data: {
      name: "Lập trình Bot & Thuật toán Trading",
      slug: "algo-trading-bot",
      description: "Tự động hóa chiến lược giao dịch với Python, MQL5 và kết nối API sàn giao dịch.",
      icon: "Code",
      orderIndex: 3,
    },
  });

  // 2.2 IELTS Categories
  const catIELTSMastery = await prisma.category.create({
    data: {
      name: "Luyện thi IELTS Chuyên sâu (Band 7.0+)",
      slug: "ielts-mastery",
      description: "Phương pháp tư duy logic và kỹ thuật giải đề chuẩn Cambridge bứt phá band 7.5 - 8.5+.",
      icon: "GraduationCap",
      orderIndex: 4,
    },
  });

  const catIELTSSpeaking = await prisma.category.create({
    data: {
      name: "Bí quyết Chinh phục Speaking & Writing",
      slug: "ielts-speaking-writing",
      description: "Hệ thống từ vựng C1/C2, phát âm tự nhiên và dàn ý viết bài Task 2 ăn trọn điểm Coherence.",
      icon: "BookOpen",
      orderIndex: 5,
    },
  });

  // 2.3 Baking Categories
  const catSourdough = await prisma.category.create({
    data: {
      name: "Bánh Mì Men Tự Nhiên & Bánh Chuẩn Âu",
      slug: "banh-mi-men-tu-nhien",
      description: "Kỹ thuật nuôi men mẹ tự nhiên (Starter), ủ chậm và nướng bánh Sourdough, Baguette chuẩn tiệm Pháp.",
      icon: "Sparkles",
      orderIndex: 6,
    },
  });

  const catButtercream = await prisma.category.create({
    data: {
      name: "Nghệ Thuật Bắt Kem & Bánh Kem Hiện Đại",
      slug: "nghe-thuat-kem-buttercream",
      description: "Kỹ thuật chà láng sắc cạnh, phối màu chuẩn tone pastel và bắt hoa kem bơ kinh doanh.",
      icon: "Award",
      orderIndex: 7,
    },
  });

  // 2.4 Fitness Categories
  const catFatLoss = await prisma.category.create({
    data: {
      name: "Lộ Trình Tăng Cơ Giảm Mỡ Siết Cân 60 Ngày",
      slug: "giam-mo-tang-co",
      description: "Giáo án tập luyện chuẩn khoa học kết hợp thực đơn dinh dưỡng tính toán Macro chuẩn xác.",
      icon: "TrendingUp",
      orderIndex: 8,
    },
  });

  const catYoga = await prisma.category.create({
    data: {
      name: "Yoga Phục Hồi & Trị Liệu Cột Sống",
      slug: "yoga-tri-lieu",
      description: "Các chuỗi động tác giải tỏa căng thẳng, chữa lành đau lưng cổ vai gáy cho dân văn phòng.",
      icon: "ShieldCheck",
      orderIndex: 9,
    },
  });

  console.log("✅ Categories created for Trading, IELTS, Baking, Fitness");

  // 3. Create Course 1: SMC Master
  const courseSMC = await prisma.course.create({
    data: {
      instructorId: instructor.id,
      categoryId: catSMC.id,
      title: "Khóa học SMC Masterclass: Nghệ thuật Đọc Dòng tiền Tổ chức (Smart Money Concepts)",
      slug: "smc-masterclass-dong-tien-to-chuc",
      shortDescription: "Làm chủ cấu trúc thị trường, Order Block, Imbalance/FVG, Liquidity Hunt và thiết lập Entry lệnh tỷ lệ R:R tối thiểu 1:5.",
      description: `
## Giới thiệu Khóa học SMC Masterclass

Chào mừng bạn đến với khóa học toàn diện nhất về **Smart Money Concepts (SMC)** và **Price Action dòng tiền lớn**. Khóa học được thiết kế có hệ thống từ nền tảng đến các kỹ thuật bẫy thanh khoản nâng cao của các tổ chức tài chính lớn (Banks, Institutional Funds).

### 🎯 Bạn sẽ học được gì trong khóa học này?
* **Bản chất của Cấu trúc thị trường (Market Structure):** Cách xác định chính xác đỉnh/đáy thực sự (Valid High/Low), tránh bị bẫy bởi cấu trúc con (Internal Structure).
* **Vùng Cung Cầu tổ chức (Order Blocks & Imbalance/FVG):** Lọc ra các khối Order Block có xác suất thắng cao nhất, loại bỏ các vùng yếu.
* **Kỹ thuật săn Thanh khoản (Liquidity Concepts):** Nhận diện BSL (Buy Side Liquidity), SSL (Sell Side Liquidity) và Inducement (IDM).
* **Mô hình Vào lệnh Tối ưu (Entry Models):** Kết hợp đa khung thời gian (HTF -> LTF) để có điểm vào lệnh chuẩn xác với Stoploss cực ngắn (3-5 pips).
* **Kế hoạch Quản trị Rủi ro & Vượt qua kỳ thi Cấp quỹ Prop Firm:** Quy tắc 1% rủi ro, tâm lý quản lý Drawdown.

### 👥 Đối tượng phù hợp:
* Trader đã có kiến thức cơ bản về Forex/Chứng khoán/Crypto nhưng chưa có lợi nhuận ổn định.
* Nhà đầu tư muốn vượt qua các kỳ thi tuyển trader quỹ (FTMO, FundedNext, MFFU).
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 2500000,
      salePrice: 1490000,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  // Sections and Lessons for Course 1
  const s1 = await prisma.section.create({
    data: {
      courseId: courseSMC.id,
      title: "Chương 1: Nền tảng & Cấu trúc Thị trường Chuẩn SMC",
      description: "Hiểu rõ cách vận hành của thị trường và cách xác định cấu trúc đa khung thời gian.",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: s1.id,
      title: "Bài 1: Giới thiệu Hệ thống SMC & Tư duy Dòng tiền Lớn",
      slug: "bai-1-gioi-thieu-he-thong-smc",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 1240, // ~20 mins
      isPreview: true, // Free Preview!
      orderIndex: 1,
      contentBody: `
### Tóm tắt nội dung bài học 1
Trong bài học này, chúng ta tìm hiểu tư duy cốt lõi của Smart Money Concepts:
1. Thị trường tài chính không di chuyển ngẫu nhiên, mà được dẫn dắt bởi thuật toán phân phối thanh khoản (IPDA).
2. Sự khác biệt giữa Retail Trader và Smart Money.
3. Nguyên tắc không bao giờ đuổi theo giá, mà kiên nhẫn chờ giá hồi về các vùng Premium / Discount.
      `,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: s1.id,
      title: "Bài 2: Phân biệt Break of Structure (BOS) và Change of Character (CHoCH)",
      slug: "bai-2-phan-biet-bos-va-choch",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=pQN-pnXPaVg",
      videoDuration: 1850,
      isPreview: true, // Free Preview!
      orderIndex: 2,
      contentBody: `
### Hướng dẫn chi tiết:
* **BOS (Break of Structure):** Giá đóng cửa nến vượt qua đỉnh/đáy trước đó để xác nhận xu hướng tiếp diễn.
* **CHoCH (Change of Character):** Tín hiệu đầu tiên cảnh báo thị trường có khả năng đổi chiều xu hướng.
* **Lưu ý quan trọng:** Luôn chờ nến đóng cửa (Close candle), không dựa vào râu nến (wick) để tránh tín hiệu giả (Sweep/Raid).
      `,
    },
  });

  const s2 = await prisma.section.create({
    data: {
      courseId: courseSMC.id,
      title: "Chương 2: Nhận diện Khối Lệnh Order Block (OB) & Vùng Mất cân bằng (FVG)",
      description: "Kỹ thuật chọn lọc các vùng vào lệnh chất lượng cao.",
      orderIndex: 2,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: s2.id,
      title: "Bài 3: Cách Vẽ & Lọc Order Block (OB) Chuẩn Xác",
      slug: "bai-3-cach-ve-order-block-chuan-xac",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoDuration: 1520,
      isPreview: false,
      orderIndex: 1,
      contentBody: `
### 3 Tiêu chí của một Order Block Mạnh:
1. Phải tạo ra Imbalance (Fair Value Gap - FVG) ngay sau đó.
2. Phải là cây nến phá vỡ cấu trúc thị trường (Tạo ra BOS hoặc CHoCH).
3. Nằm ở vùng Discount (nếu Buy) hoặc Premium (nếu Sell).
      `,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: s2.id,
      title: "Bài 4: Khái niệm Fair Value Gap (FVG) và Cách Lấp Khoảng trống Giá",
      slug: "bai-4-fair-value-gap-fvg",
      contentType: "ARTICLE",
      videoDuration: 600,
      isPreview: false,
      orderIndex: 2,
      contentBody: `
## Tìm hiểu về Fair Value Gap (FVG)

**Fair Value Gap (FVG)** hay còn gọi là Vùng Mất Cân Bằng (Imbalance) xuất hiện khi thị trường có sự mua hoặc bán ồ ạt từ các tổ chức lớn, khiến cho giá di chuyển cực mạnh trong 1 cây nến mà không có giao dịch đối ứng cân bằng.

### Cấu trúc nến FVG 3 bước:
* **Cây nến 1:** Nến trước đó.
* **Cây nến 2:** Nến mở rộng biên độ mạnh.
* **Cây nến 3:** Nến tiếp theo.
* *Khoảng trống:* Là khoảng cách giữa râu nến của Cây 1 và râu nến của Cây 3.

> 💡 **Kinh nghiệm thực chiến:** Khi giá quay trở lại kiểm tra vùng FVG, đây là cơ hội vàng để mở vị thế cùng chiều với xu hướng của Smart Money!
      `,
    },
  });

  const s3 = await prisma.section.create({
    data: {
      courseId: courseSMC.id,
      title: "Chương 3: Quy trình Vào lệnh Thực chiến & Quản trị Rủi ro",
      description: "Quy trình từng bước kiểm tra trước khi click chuột vào lệnh.",
      orderIndex: 3,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: s3.id,
      title: "Bài 5: Bộ Checklist 5 Bước Vào Lệnh Tỷ Lệ R:R 1:5+",
      slug: "bai-5-checklist-vao-lenh-rr-1-5",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 2100,
      isPreview: false,
      orderIndex: 1,
      contentBody: "Tải file Checklist PDF đính kèm bên dưới và in ra bàn làm việc trước mỗi phiên giao dịch.",
    },
  });

  // 4. Create Course 2: Free Beginners Course
  const courseFree = await prisma.course.create({
    data: {
      instructorId: instructor.id,
      categoryId: catSMC.id,
      title: "Nhập môn Thị trường Tài chính: Từ Con số 0 đến Giao dịch Đầu tiên",
      slug: "nhap-mon-thi-truong-tai-chinh-free",
      shortDescription: "Khóa học miễn phí 100% cung cấp nền tảng kiến thức vững chắc cho người mới bắt đầu tìm hiểu Forex, Vàng và Crypto.",
      description: "Khóa học nhập môn giúp bạn hiểu đúng về thị trường tài chính, cách cài đặt phần mềm TradingView, MT5 và quản trị rủi ro cơ bản.",
      thumbnailUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      price: 0,
      salePrice: 0,
      level: "BEGINNER",
      status: "PUBLISHED",
      isFeatured: false,
      isFree: true,
      certificateEnabled: true,
    },
  });

  const sFree1 = await prisma.section.create({
    data: {
      courseId: courseFree.id,
      title: "Chương 1: Các Khái niệm Cơ bản",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sFree1.id,
      title: "Bài 1: Pip, Lot, Đòn bẩy và Ký quỹ là gì?",
      slug: "bai-1-pip-lot-don-bay",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 900,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Giải thích chi tiết các thuật ngữ nền tảng bằng ví dụ thực tế.",
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sFree1.id,
      title: "Bài 2: Hướng dẫn Cài đặt & Sử dụng TradingView Thành thạo",
      slug: "bai-2-huong-dan-tradingview",
      contentType: "ARTICLE",
      videoDuration: 750,
      isPreview: true,
      orderIndex: 2,
      contentBody: "Hướng dẫn các phím tắt, công cụ vẽ và lưu template biểu đồ.",
    },
  });

  // 4B. IELTS Courses
  const courseIELTSPaid = await prisma.course.create({
    data: {
      instructorId: instructorIELTS.id,
      categoryId: catIELTSMastery.id,
      title: "IELTS Intensive Masterclass: Bứt Phá Band 7.5+ Sau 90 Ngày",
      slug: "ielts-intensive-masterclass-7-5",
      shortDescription: "Lộ trình toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết với phương pháp phản xạ học thuật và chiến thuật xử lý đề thi Cambridge mới nhất.",
      description: `
## Khóa Học IELTS Intensive Masterclass (Band 7.5+)
Chương trình huấn luyện tinh gọn giúp bạn nắm trọn tư duy logic, cấu trúc câu nâng cao và phản xạ tự nhiên trong bài thi IELTS Academic.

### 🎯 Điểm nổi bật của khóa học:
* **Writing Task 2:** Công thức tư duy phản biện P-E-E-L (Point - Explanation - Example - Link) ăn trọn 7.5+ Task Response và Coherence.
* **Speaking Part 1, 2, 3:** Phương pháp triển khai ý tưởng mượt mà không bị vấp, hệ thống Idioms và Collocations tự nhiên.
* **Reading & Listening:** Kỹ thuật Skimming, Scanning và nhận diện Paraphrasing bẫy đề thi.
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 3200000,
      salePrice: 1890000,
      level: "ADVANCED",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  const sIELTS1 = await prisma.section.create({
    data: {
      courseId: courseIELTSPaid.id,
      title: "Module 1: Tư Duy Học Thuật & Chiến Thuật Viết Writing Task 2",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sIELTS1.id,
      title: "Bài 1: Xây Dựng Luận Điểm Sắc Bén Cho Dạng Agree or Disagree",
      slug: "bai-1-luan-diem-agree-disagree",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 1350,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Phân tích 5 cấu trúc câu kinh điển giúp nâng band Grammatical Range & Accuracy.",
    },
  });

  const courseIELTSFree = await prisma.course.create({
    data: {
      instructorId: instructorIELTS.id,
      categoryId: catIELTSMastery.id,
      title: "Tự Học Phát Âm Chuẩn Anh - Mỹ & Phản Xạ Giao Tiếp Cơ Bản",
      slug: "phat-am-chuan-anh-my-free",
      shortDescription: "Khóa học miễn phí giúp bạn chuẩn hóa 44 âm IPA, nối âm và ngữ điệu tự nhiên như người bản xứ.",
      description: "Khóa học phát âm nền tảng giúp bạn tự tin giao tiếp và loại bỏ thói quen phát âm sai phổ biến của người Việt.",
      thumbnailUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      price: 0,
      salePrice: 0,
      level: "BEGINNER",
      status: "PUBLISHED",
      isFeatured: false,
      isFree: true,
      certificateEnabled: true,
    },
  });

  const sIELTSFree1 = await prisma.section.create({
    data: {
      courseId: courseIELTSFree.id,
      title: "Chương 1: Bảng Phiên Âm Quốc Tế IPA",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sIELTSFree1.id,
      title: "Bài 1: Khẩu hình miệng và nguyên âm đơn / nguyên âm đôi",
      slug: "bai-1-khau-hinh-nguyen-am",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 850,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Luyện tập từng cặp âm dễ nhầm lẫn: /i:/ và /ɪ/, /u:/ và /ʊ/.",
    },
  });

  // 4C. Baking Courses
  const courseBakingPaid = await prisma.course.create({
    data: {
      instructorId: instructorBaking.id,
      categoryId: catSourdough.id,
      title: "Masterclass Bánh Mì Men Tự Nhiên (Sourdough): Từ Khởi Men Đến Ổ Bánh Hoàn Hảo",
      slug: "masterclass-banh-mi-men-tu-nhien-sourdough",
      shortDescription: "Bí quyết nuôi men mẹ 100% tự nhiên, kỹ thuật gấp bột, lên men chậm và nướng bánh vỏ giòn tai cao chuẩn tiệm bánh Âu.",
      description: `
## Khóa Học Làm Bánh Mì Men Tự Nhiên (Sourdough) Chuyên Sâu
Học trực tiếp cùng Chef Mai Hương - khám phá nghệ thuật làm bánh mộc mạc nhưng tinh tế nhất của nước Pháp.

### 🥖 Bạn sẽ làm chủ:
* Cách nuôi men mẹ (Starter) khỏe mạnh từ bột mì và nước, không dùng men công nghiệp.
* Hiểu sâu về nhiệt độ, độ ẩm và thời gian lên men để bánh đạt cấu trúc bọt khí (Open Crumb) tuyệt đẹp.
* Kỹ thuật rạch bánh (Scoring) tạo tai bánh nở bung nghệ thuật.
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 1800000,
      salePrice: 990000,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  const sBaking1 = await prisma.section.create({
    data: {
      courseId: courseBakingPaid.id,
      title: "Chương 1: Nuôi Men & Kỹ Thuật Trộn Bột Autolyse",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sBaking1.id,
      title: "Bài 1: Công Thức Khởi Tạo Men Mẹ Sourdough 7 Ngày",
      slug: "bai-1-khoi-tao-men-me-sourdough",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 1100,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Các dấu hiệu nhận biết men đã sẵn sàng làm bánh (Float test thành công).",
    },
  });

  const courseBakingFree = await prisma.course.create({
    data: {
      instructorId: instructorBaking.id,
      categoryId: catSourdough.id,
      title: "Nhập Môn Làm Bánh Tại Nhà: 5 Món Bánh Bất Bại Cho Người Mới Bắt Đầu",
      slug: "nhap-mon-lam-banh-tai-nha-free",
      shortDescription: "Tự tay làm bánh quy bơ, bánh bông lan mềm xốp và mousse chanh leo thơm ngon với dụng cụ bếp gia đình sẵn có.",
      description: "Khóa học miễn phí giúp bạn hiểu về nhiệt lò nướng, cách đánh trứng bông và chọn bột mì chuẩn xác.",
      thumbnailUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      price: 0,
      salePrice: 0,
      level: "BEGINNER",
      status: "PUBLISHED",
      isFeatured: false,
      isFree: true,
      certificateEnabled: true,
    },
  });

  const sBakingFree1 = await prisma.section.create({
    data: {
      courseId: courseBakingFree.id,
      title: "Chương 1: Bánh Quy Bơ Pháp Giòn Rụm",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sBakingFree1.id,
      title: "Bài 1: Kỹ thuật tán bơ và nướng bánh vàng đều",
      slug: "bai-1-banh-quy-bo-phap",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 720,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Công thức tỷ lệ vàng 1:2:3 cho bánh quy bơ thơm lừng.",
    },
  });

  // 4D. Fitness Courses
  const courseFitnessPaid = await prisma.course.create({
    data: {
      instructorId: instructorFitness.id,
      categoryId: catFatLoss.id,
      title: "Chiến Binh Thể Hình: Siết Mỡ Tăng Cơ Tại Nhà & Gym Chuẩn Khoa Học",
      slug: "chien-binh-the-hinh-siet-mo-tang-co",
      shortDescription: "Giáo án tập luyện 60 ngày bứt phá hình thể, thiết kế bài tập lũy tiến (Progressive Overload) và tính toán calo thâm hụt thông minh.",
      description: `
## Giáo Án Thể Hình Thực Chiến: Siết Mỡ Tăng Cơ
Chương trình huấn luyện toàn diện dành cho nam và nữ muốn chuyển đổi hình thể ngoạn mục mà không phải kiêng khem cực đoan.

### 🏋️ Bạn sẽ đạt được:
* Lịch tập chi tiết theo từng nhóm cơ: Push - Pull - Legs hoặc Upper - Lower khoa học.
* Hướng dẫn video góc quay chuẩn từng rep: Squat, Deadlift, Bench Press tránh chấn thương.
* Phương pháp tính Macro (Đạm, Tinh bột, Chất béo) phù hợp từng cơ địa.
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 1500000,
      salePrice: 790000,
      level: "ALL_LEVELS",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  const sFitness1 = await prisma.section.create({
    data: {
      courseId: courseFitnessPaid.id,
      title: "Giai Đoạn 1: Kỹ Thuật Động Tác Cơ Bản & Khởi Động Khớp",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sFitness1.id,
      title: "Bài 1: Nguyên Tắc Thở Khi Nâng Tạ & Kích Hoạt Cơ Lõi (Core)",
      slug: "bai-1-nguyen-tac-tho-nang-ta",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 950,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Kỹ thuật gồng bụng (Bracing) bảo vệ thắt lưng an toàn tuyệt đối.",
    },
  });

  const courseFitnessFree = await prisma.course.create({
    data: {
      instructorId: instructorFitness.id,
      categoryId: catYoga.id,
      title: "Khởi Động 7 Ngày Detox & Yoga Tái Tạo Năng Lượng Cho Dân Văn Phòng",
      slug: "7-ngay-detox-yoga-tai-tao-nang-luong-free",
      shortDescription: "7 chuỗi bài tập Yoga 15 phút mỗi ngày giúp giảm đau mỏi vai gáy, kéo giãn cột sống và ngủ ngon sâu giấc.",
      description: "Khóa tập miễn phí tái tạo nguồn năng lượng tích cực cho những ai ngồi làm việc nhiều trước máy tính.",
      thumbnailUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      price: 0,
      salePrice: 0,
      level: "BEGINNER",
      status: "PUBLISHED",
      isFeatured: false,
      isFree: true,
      certificateEnabled: true,
    },
  });

  const sFitnessFree1 = await prisma.section.create({
    data: {
      courseId: courseFitnessFree.id,
      title: "Ngày 1: Giải Tỏa Căng Thẳng Cổ Vai Gáy",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sFitnessFree1.id,
      title: "Bài 1: Chuỗi Bài Tập Kéo Giãn 15 Phút Buổi Sáng",
      slug: "bai-1-keo-gian-15-phut",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 900,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Các tư thế Mèo - Bò (Cat - Cow) và Em Bé (Child's Pose) kích hoạt luân xa và lưu thông khí huyết.",
    },
  });

  console.log("✅ Courses created for IELTS, Baking, and Fitness niches");

  // 5. Create Enrollment for Sample Student in Course 1
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: courseSMC.id,
      progressPercent: 40,
      status: "ACTIVE",
    },
  });

  // Progress for lessons 1 & 2
  const allLessonsSMC = await prisma.lesson.findMany({
    where: { section: { courseId: courseSMC.id } },
  });

  if (allLessonsSMC.length > 0) {
    await prisma.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: allLessonsSMC[0].id,
        isCompleted: true,
        lastPositionSeconds: 1240,
        completedAt: new Date(),
      },
    });

    if (allLessonsSMC.length > 1) {
      await prisma.lessonProgress.create({
        data: {
          userId: student.id,
          lessonId: allLessonsSMC[1].id,
          isCompleted: true,
          lastPositionSeconds: 1850,
          completedAt: new Date(),
        },
      });
    }
  }

  // 6. Create Coupons
  await prisma.coupon.create({
    data: {
      code: "FINLEARN50",
      discountType: "PERCENT",
      discountValue: 50, // 50%
      maxUsage: 100,
      usedCount: 12,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: "TRADER200",
      discountType: "FIXED_AMOUNT",
      discountValue: 200000, // 200k VND
      maxUsage: 50,
      usedCount: 5,
      isActive: true,
    },
  });

  // 7. Create Reviews
  await prisma.review.create({
    data: {
      userId: student.id,
      courseId: courseSMC.id,
      rating: 5,
      comment: "Khóa học quá đỉnh! Nhờ phương pháp lọc Order Block của thầy mà em đã pass vòng 1 quỹ FTMO 100k.",
      isApproved: true,
    },
  });

  // 8. Create Comments in Lesson 1
  if (allLessonsSMC.length > 0) {
    const parentComment = await prisma.comment.create({
      data: {
        lessonId: allLessonsSMC[0].id,
        userId: student.id,
        content: "Thầy ơi cho em hỏi: Trong phiên Á thì BOS có đáng tin cậy bằng phiên Âu/Mỹ không ạ?",
      },
    });

    await prisma.comment.create({
      data: {
        lessonId: allLessonsSMC[0].id,
        userId: instructor.id,
        parentId: parentComment.id,
        content: "Chào Nam, phiên Á thường là phiên tích lũy thanh khoản (Build-up liquidity), do đó các BOS phiên Á thường là bẫy. Hãy ưu tiên tín hiệu phiên London và New York nhé!",
      },
    });
  }

  // 12. Create Tags & Link to Courses
  console.log("Creating Tags and Blog Posts...");
  const tagPriceAction = await prisma.tag.create({
    data: { name: "Price Action", slug: "price-action", description: "Phương pháp giao dịch theo hành động giá" },
  });
  const tagSMC = await prisma.tag.create({
    data: { name: "Smart Money Concepts", slug: "smart-money-concepts", description: "Chiến lược dòng tiền thông minh" },
  });
  const tagRisk = await prisma.tag.create({
    data: { name: "Quản Trị Rủi Ro", slug: "quan-tri-rui-ro", description: "Bảo vệ vốn và kỷ luật giao dịch" },
  });

  if (courseSMC) {
    await prisma.course.update({
      where: { id: courseSMC.id },
      data: {
        tags: {
          connect: [{ id: tagPriceAction.id }, { id: tagSMC.id }],
        },
      },
    });
  }

  // 13. Create Sample Blog Post
  const blogPost1 = await prisma.blogPost.create({
    data: {
      authorId: instructor.id,
      categoryId: catSMC.id,
      title: "5 Chiến Lược Price Action Thực Chiến Cho Trader 2026",
      slug: "5-chien-luoc-price-action-thuc-chien-cho-trader-2026",
      summary: "Khám phá 5 phương pháp phân tích hành động giá (Price Action) chuyên sâu giúp bạn bắt nhịp cùng dòng tiền thông minh và tối ưu điểm vào lệnh.",
      content: `## 1. Giới Thiệu Về Price Action Thực Chiến

Price Action (hành động giá) là phương pháp phân tích kỹ thuật dựa trên sự chuyển động thuần túy của giá trên biểu đồ mà không phụ thuộc quá mức vào các chỉ báo trễ.

> "Biểu đồ giá phản ánh tất cả niềm tin, sự sợ hãi và kỳ vọng của hàng triệu người tham gia thị trường."

Khi hiểu được cấu trúc thị trường, bạn sẽ không còn giao dịch theo cảm tính mà đi theo dòng tiền của các tay chơi lớn (Smart Money).

## 2. Chiến Lược 1: Fakey Pattern (Phá Vỡ Giả)

Phá vỡ giả là bẫy thanh khoản kinh điển của thị trường. Khi giá vượt qua ngưỡng kháng cự hoặc hỗ trợ quan trọng, đám đông nhỏ lẻ thường nhảy vào mua đuổi. Ngay sau đó, giá đảo chiều mạnh mẽ:

- **Bước 1**: Xác định vùng cản then chốt (Key Level).
- **Bước 2**: Quan sát nến Inside Bar hoặc nến pinbar quét thanh khoản.
- **Bước 3**: Vào lệnh khi nến đảo chiều xác nhận đóng cửa.

\`\`\`javascript
// Quy tắc quản trị tỷ lệ Risk:Reward tối thiểu 1:2
const entryPrice = 2450.5;
const stopLoss = 2442.0;
const risk = entryPrice - stopLoss;
const takeProfit = entryPrice + (risk * 2.5);
console.log("Target RR:", takeProfit);
\`\`\`

## 3. Chiến Lược 2: Order Block (Khối Lệnh Tổ Chức)

Khối lệnh Order Block là vùng giá cuối cùng mà các tổ chức tài chính lớn đã tích lũy khối lượng lớn trước khi đẩy giá đi một quãng đường dài.

1. Tìm cây nến ngược chiều cuối cùng trước một sóng nến tăng/giảm mạnh mẽ (Imbalance).
2. Chờ đợi giá hồi quy (Retracement) về vùng Order Block.
3. Tìm tín hiệu xác nhận ở khung thời gian nhỏ hơn (LTF).

## 4. Quản Trị Rủi Ro & Kỷ Luật Bản Thân

Không có chiến lược nào mang lại tỷ lệ thắng 100%. Yếu tố quyết định bạn có tồn tại được trên thị trường 5 năm, 10 năm hay không chính là:

- Tuyệt đối không mạo hiểm quá 1% - 2% tài khoản cho một lệnh giao dịch.
- Luôn đặt Stop Loss trước khi nghĩ đến lợi nhuận.
- Ghi nhật ký giao dịch đều đặn sau mỗi ngày trade.

## 5. Kết Luận

Hành trình trở thành trader thành công không có đường tắt. Hãy kiên trì rèn luyện, kiểm tra dữ liệu lịch sử (backtest) và liên tục nâng cao tư duy quản trị vốn!`,
      coverImageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      viewCount: 142,
      readingTime: 4,
      metaTitle: "5 Chiến Lược Price Action Đỉnh Cao Cho Trader 2026",
      metaDescription: "Khám phá 5 phương pháp phân tích hành động giá thực chiến cùng cẩm nang quản trị rủi ro chuyên sâu.",
      metaKeywords: "price action, smc, giao dich tai chinh, order block",
      publishedAt: new Date(),
      tags: {
        connect: [{ id: tagPriceAction.id }, { id: tagSMC.id }, { id: tagRisk.id }],
      },
    },
  });

  // Attach Document
  await prisma.attachment.create({
    data: {
      postId: blogPost1.id,
      fileName: "Price_Action_Cheat_Sheet_2026.pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileSize: 1048576,
      fileType: "application/pdf",
    },
  });

  // Create Blog Comment
  await prisma.comment.create({
    data: {
      postId: blogPost1.id,
      userId: student.id,
      content: "Bài viết rất chi tiết và thực tế! Phần giải thích về Order Block rất rõ ràng. Cảm ơn Thầy ạ!",
    },
  });

  // 13B. IELTS Blog Post
  const blogPostIELTS = await prisma.blogPost.create({
    data: {
      authorId: instructorIELTS.id,
      categoryId: catIELTSMastery.id,
      title: "Chiến Lược Tối Ưu Thời Gian Làm Bài IELTS Reading: Kỹ Thuật Skimming & Scanning 8.0+",
      slug: "chien-luoc-reading-skimming-scanning-8-0",
      summary: "Cách kiểm soát 60 phút phòng thi, nhận diện bẫy Paraphrase và chiến thuật định vị từ khóa trong các đoạn văn học thuật dài.",
      content: `## 1. Nỗi Sợ Hết Giờ Trong Phòng Thi IELTS Reading

Hầu hết thí sinh mất điểm ở IELTS Reading không phải vì thiếu vốn từ, mà vì phân bổ thời gian không hợp lý. Khi gặp các bài đọc Passage 3 có độ dài trên 1.000 từ về khoa học hoặc lịch sử, việc đọc từng câu từ đầu đến cuối là con đường ngắn nhất dẫn đến thiếu giờ.

### 🎯 Quy Tắc 20 - 20 - 20 Đã Lạc Hậu?
Nhiều trung tâm khuyên chia đều 20 phút cho mỗi Passage. Tuy nhiên, độ khó tăng dần từ Passage 1 đến Passage 3. Chiến lược phân bổ tối ưu của các cao thủ 8.5+:
* **Passage 1:** Tối đa 14 - 15 phút.
* **Passage 2:** 18 - 20 phút.
* **Passage 3:** Dành trọn 25 - 28 phút còn lại.

## 2. Kỹ Thuật Skimming (Đọc Lướt Ý Chính)
* Đọc kỹ câu chủ đề (Topic Sentence) ở đầu và cuối mỗi đoạn văn.
* Nắm được "sơ đồ tư duy" của tác giả: Đoạn nào nêu hiện tượng, đoạn nào đưa ra nguyên nhân, đoạn nào trích dẫn ý kiến trái chiều.

## 3. Kỹ Thuật Scanning (Quét Từ Khóa)
* Quét các từ khóa "cố định" (Unchangeable keywords): Tên riêng, năm tháng, số liệu phần trăm.
* Cảnh giác với từ khóa có thể bị Paraphrase: Thay vì tìm chính xác từ "increase", hãy chuẩn bị tinh thần tìm thấy "grow", "escalate", "surge".`,
      coverImageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      readingTime: 5,
      metaTitle: "Chiến Lược Đạt 8.0+ IELTS Reading | IELTS Elite",
      metaDescription: "Kỹ thuật phân bổ thời gian và mẹo xử lý đề thi IELTS Reading chuẩn xác từ chuyên gia.",
      publishedAt: new Date(),
    },
  });

  // 13C. Baking Blog Post
  const blogPostBaking = await prisma.blogPost.create({
    data: {
      authorId: instructorBaking.id,
      categoryId: catSourdough.id,
      title: "Cẩm Nang Nuôi Men Mẹ Sourdough 7 Ngày: Xử Lý Hiện Tượng Men Tách Nước & Mùi Chua Gắt",
      slug: "cam-nang-nuoi-men-me-sourdough-7-ngay",
      summary: "Khắc phục triệt để các lỗi phổ biến khi tự nuôi men tại nhà: men không nổi bọt, men bị mốc hoặc có mùi cồn quá nồng.",
      content: `## 1. Hành Trình Nuôi Men Mẹ Tự Nhiên (Starter)

Nuôi men Sourdough giống như chăm sóc một sinh vật sống trong căn bếp của bạn. Chỉ với bột mì và nước lọc, bạn đang tạo ra một hệ vi sinh vật gồm nấm men hoang dã (wild yeast) và vi khuẩn axit lactic (LAB).

### 🥖 Lịch Cho Men Ăn Chuẩn Từng Ngày:
* **Ngày 1 - 2:** Trộn đều 50g bột mì nguyên cám + 50g nước ấm. Để ở nhiệt độ phòng 24 - 28°C.
* **Ngày 3 - 4:** Bắt đầu xuất hiện bọt khí li ti và mùi chua nhẹ. Bỏ đi một nửa men cũ, thêm 50g bột + 50g nước.
* **Ngày 5 - 7:** Men bắt đầu nở gấp đôi hoặc gấp ba sau 4 - 6 tiếng cho ăn.

## 2. Các Lỗi Phổ Biến & Cách Khắc Phục

### Lỗi 1: Men Tiết Lớp Nước Màu Đen/Vàng (Hooch)
* **Nguyên nhân:** Men của bạn đang bị "đói"! Lớp nước này chính là cồn tự nhiên được sinh ra khi nấm men đã ăn hết thức ăn.
* **Cách xử lý:** Đổ bỏ lớp nước hooch, cạo bỏ lớp mặt trên, lấy 30g cốt men khỏe mạnh cho ăn lại theo tỷ lệ 1:2:2 (Men : Bột : Nước).

### Lỗi 2: Bánh Nướng Ra Bị Đặc Ruột, Không Có Bọt Khí (Gummy Crumb)
* **Nguyên nhân:** Dùng men chưa đạt đỉnh (Peak) hoặc thời gian ủ bột Bulk Fermentation chưa đủ nhiệt.
* **Mẹo bếp trưởng:** Luôn làm bài kiểm tra thả nổi (Float Test). Lấy 1 thìa men thả vào cốc nước, nếu men nổi bồng bềnh là đã sẵn sàng nhào bột!`,
      coverImageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      readingTime: 6,
      metaTitle: "Cẩm Nang Nuôi Men Sourdough Bất Bại | La Crème Pastry",
      metaDescription: "Khắc phục hiện tượng men tách nước và bí quyết làm bánh mì men tự nhiên nở bung hoàn hảo.",
      publishedAt: new Date(),
    },
  });

  // 13D. Fitness Blog Post
  const blogPostFitness = await prisma.blogPost.create({
    data: {
      authorId: instructorFitness.id,
      categoryId: catFatLoss.id,
      title: "Nguyên Tắc Thâm Hụt Calo Thông Minh: Giảm Mỡ Siết Cơ Mà Không Bị Mất Năng Lượng",
      slug: "nguyen-tac-tham-hut-calo-thong-minh",
      summary: "Bí quyết tính TDEE và BMR chuẩn xác, cách phân bổ Macro đạm - carb - fat để siết mỡ tối đa mà không bị mất cơ bắp.",
      content: `## 1. Bản Chất Khoa Học Của Việc Giảm Mỡ (Fat Loss)

Bạn không thể giảm mỡ chỉ ở một vùng cơ thể (không có chuyện gập bụng giảm mỡ bụng). Cơ thể con người giảm mỡ toàn thân dựa trên định luật bảo toàn năng lượng: **Calo Nạp Vào (Calorie In) < Calo Tiêu Thụ (Calorie Out)**.

### ⚖️ Sai Lầm Cắt Giảm Calo Quá Mức:
Nhiều người nóng vội giảm ngay 1.000 calo/ngày. Hậu quả là:
1. Cơ thể rơi vào trạng thái sinh tồn (Starvation mode), hạ thấp tốc độ chuyển hóa cơ bản BMR.
2. Mất khối lượng cơ bắp quý giá, khiến da chảy xệ và dễ bị tăng cân trở lại (hiệu ứng Yo-Yo).

## 2. Công Thức Thâm Hụt Calo Bền Vững (Smart Deficit)
* Mức thâm hụt lý tưởng là **300 - 500 calo/ngày** so với mức TDEE duy trì.
* Tốc độ giảm cân an toàn: 0.5kg - 1kg mỡ mỗi tuần.

## 3. Tỷ Lệ Vàng Về Dinh Dưỡng (Macronutrients)
* **Protein (Đạm):** 1.8g - 2.2g trên mỗi kg trọng lượng cơ thể để giữ cơ.
* **Fat (Chất béo tốt):** Tối thiểu 20% tổng calo nạp vào để duy trì hệ nội tiết ổn định.
* **Carb (Tinh bột phức):** Lấp đầy phần calo còn lại bằng khoai lang, yến mạch, gạo lứt để có năng lượng tập nặng.`,
      coverImageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      readingTime: 5,
      metaTitle: "Nguyên Tắc Thâm Hụt Calo Giảm Mỡ Chuẩn Khoa Học | IronPulse",
      metaDescription: "Phương pháp tính toán dinh dưỡng và giáo án siết mỡ tăng cơ không lo mệt mỏi từ HLV.",
      publishedAt: new Date(),
    },
  });

  console.log("✅ Blog posts created for Trading, IELTS, Baking, and Fitness niches");

  // 14. Initialize Default System Settings (including VietQR & Bank settings)
  console.log("Seeding default system and payment settings...");
  const defaultSettings = [
    { key: "appName", value: "World Trading Lab", group: "GENERAL" },
    { key: "bankId", value: "ICB", group: "PAYMENT", description: "VietinBank (ICB)" },
    { key: "bankName", value: "VietinBank", group: "PAYMENT", description: "Ngân hàng TMCP Công thương Việt Nam" },
    { key: "bankAccountNo", value: "1088888888", group: "PAYMENT", description: "Số tài khoản ngân hàng nhận tiền" },
    { key: "bankAccountName", value: "WORLD TRADING LAB", group: "PAYMENT", description: "Tên chủ tài khoản" },
    { key: "vietqrTemplate", value: "compact2", group: "PAYMENT", description: "Giao diện mã VietQR QuickPay" },
    { key: "paymentManualEnabled", value: "true", group: "PAYMENT", description: "Bật/Tắt chuyển khoản thủ công" },
    { key: "paymentVietqrAutoEnabled", value: "true", group: "PAYMENT", description: "Bật/Tắt VietQR tự động" },
    { key: "paymentVietqrProvider", value: "PAYOS", group: "PAYMENT", description: "Nhà cung cấp VietQR tự động (PAYOS/SEPAY)" },
    { key: "usdExchangeRate", value: "25400", group: "PAYMENT", description: "Tỷ giá quy đổi USD/VND" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("🚀 Database Seed completed successfully with realistic SMC course, Blog, and Bank Settings data!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
