const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isForce = args.includes("--force");
  const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";

  const existingUsersCount = await prisma.user.count();
  if ((existingUsersCount > 0 || isProduction) && !isForce) {
    console.error("\n⚠️  DATABASE SAFETY GUARD:");
    console.error(`Database currently contains ${existingUsersCount} existing user(s) or is in production mode.`);
    console.error("Running seed will PERMANENTLY WIPE all tables (users, courses, orders, comments, etc.).");
    console.error("If you intentionally want to reset and seed the database, run with '--force':");
    console.error("   node prisma/seed.js --force\n");
    process.exit(1);
  }

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

  const instructorIT = await prisma.user.create({
    data: {
      name: "Kỹ sư Hoàng Minh (Principal Architect)",
      email: "it.teacher@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
      headline: "Kỹ sư Trưởng & Chuyên gia Điện toán Đám mây AWS/K8s",
      bio: "Hơn 12 năm kinh nghiệm thiết kế kiến trúc phân tán chịu tải hàng triệu CCU cho các công ty công nghệ lớn.",
    },
  });

  const instructorElectronics = await prisma.user.create({
    data: {
      name: "ThS. Vũ Thành Nam (Hardware Lead Engineer)",
      email: "hardware.teacher@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
      headline: "Trưởng nhóm R&D Phần cứng & Thiết kế Bo mạch Cao tần",
      bio: "Chuyên gia thiết kế bo mạch viễn thông, radar và thiết bị IoT công nghiệp đạt chuẩn EMI/EMC quốc tế.",
    },
  });

  const instructorMechanical = await prisma.user.create({
    data: {
      name: "Kỹ sư Đỗ Quang Huy (Senior Mechanical Specialist)",
      email: "mechanical.teacher@finlearn.vn",
      passwordHash,
      role: "INSTRUCTOR",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80",
      headline: "Kỹ sư Thiết kế Máy & Chuyên gia Mô phỏng 3D SolidWorks/CAE",
      bio: "Hơn 10 năm phụ trách R&D cơ cấu tự động hóa, robot công nghiệp và đồ gá gia công chính xác.",
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

  console.log("✅ Users created: Admin, Instructors (Trading, IELTS, Baking, Fitness, IT, Electronics, Mechanical), Student");

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

  // 2.5 IT Categories
  const catITFullstack = await prisma.category.create({
    data: {
      name: "Lập trình Fullstack & Cloud-Native",
      slug: "lap-trinh-fullstack-cloud",
      description: "Làm chủ kiến trúc Microservices, Next.js, Golang, Docker và triển khai thực tế trên hạ tầng Kubernetes/AWS.",
      icon: "Code",
      orderIndex: 10,
    },
  });

  const catITAI = await prisma.category.create({
    data: {
      name: "Trí tuệ Nhân tạo AI & Kỹ thuật Dữ liệu",
      slug: "ai-machine-learning-data",
      description: "Ứng dụng Machine Learning, Deep Learning, PyTorch và tích hợp mô hình ngôn ngữ lớn LLM vào sản phẩm.",
      icon: "Cpu",
      orderIndex: 11,
    },
  });

  // 2.6 Electronics Categories
  const catElecPCB = await prisma.category.create({
    data: {
      name: "Thiết kế Bo mạch In PCB Đa lớp & Chống Nhiễu",
      slug: "thiet-ke-mach-in-pcb",
      description: "Quy chuẩn thiết kế mạch in tốc độ cao (High-speed PCB), kiểm soát trở kháng đường truyền và chống nhiễu EMC trên Altium.",
      icon: "Layers",
      orderIndex: 12,
    },
  });

  const catElecEmbedded = await prisma.category.create({
    data: {
      name: "Lập trình Hệ thống Nhúng & Thiết bị IoT",
      slug: "lap-trinh-nhung-iot",
      description: "Lập trình Firmware C/C++ trên vi điều khiển ARM Cortex-M, ESP32 và các giao thức truyền thông công nghiệp CAN, Modbus, MQTT.",
      icon: "Radio",
      orderIndex: 13,
    },
  });

  // 2.7 Mechanical Categories
  const catMechCAD = await prisma.category.create({
    data: {
      name: "Thiết kế Chi tiết Máy 3D & Cụm Lắp Ráp SolidWorks",
      slug: "thiet-ke-cad-solidworks",
      description: "Tư duy dựng hình 3D tham số hóa (Parametric Design), lắp ráp cụm máy tự động hóa và xuất bản vẽ kỹ thuật dung sai GD&T.",
      icon: "Box",
      orderIndex: 14,
    },
  });

  const catMechCAE = await prisma.category.create({
    data: {
      name: "Mô phỏng Ứng suất Động lực học & Gia công CNC/CAM",
      slug: "mo-phong-co-hoc-cae",
      description: "Phân tích độ bền kết cấu phần tử hữu hạn (FEA/CAE) trên ANSYS và lập trình đường chạy dao phay CNC Mastercam.",
      icon: "Settings",
      orderIndex: 15,
    },
  });

  console.log("✅ Categories created for Trading, IELTS, Baking, Fitness, IT, Electronics, Mechanical");

  // Helper to create concise demo courses with 1 section and 1 preview lesson
  async function createDemoCourse({
    instructorId,
    categoryId,
    title,
    slug,
    shortDescription,
    description,
    thumbnailUrl,
    price = 0,
    salePrice = 0,
    level = "BEGINNER",
    isFeatured = false,
    isFree = false,
    sectionTitle,
    lessonTitle,
    lessonSlug,
    lessonDuration = 900,
    contentBody,
  }) {
    const c = await prisma.course.create({
      data: {
        instructorId,
        categoryId,
        title,
        slug,
        shortDescription,
        description,
        thumbnailUrl,
        introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        price,
        salePrice,
        level,
        status: "PUBLISHED",
        isFeatured,
        isFree,
        certificateEnabled: true,
      },
    });

    const s = await prisma.section.create({
      data: {
        courseId: c.id,
        title: sectionTitle,
        orderIndex: 1,
      },
    });

    await prisma.lesson.create({
      data: {
        sectionId: s.id,
        title: lessonTitle,
        slug: lessonSlug,
        contentType: "VIDEO_YOUTUBE",
        videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
        videoDuration: lessonDuration,
        isPreview: true,
        orderIndex: 1,
        contentBody,
      },
    });

    return c;
  }

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

  // 4E. IT Courses
  const courseITPaid = await prisma.course.create({
    data: {
      instructorId: instructorIT.id,
      categoryId: catITFullstack.id,
      title: "Masterclass Kiến Trúc Phần Mềm & Lập Trình Fullstack Cloud-Native Chuyên Sâu",
      slug: "kien-truc-phan-mem-fullstack-cloud-native",
      shortDescription: "Làm chủ kiến trúc Microservices chịu tải cao với Next.js 15, Golang, PostgreSQL, Docker, CI/CD và Kubernetes trên AWS.",
      description: `
## Khóa Học Kiến Trúc Phần Mềm & Fullstack Cloud-Native Thực Chiến
Được hướng dẫn trực tiếp bởi Principal Architect Hoàng Minh. Chương trình tập trung vào việc giải quyết bài toán chịu tải hàng triệu CCU, tối ưu độ trễ và vận hành hệ thống tự động hóa.

### 🚀 Bạn sẽ làm chủ:
* **Kiến trúc hệ thống phân tán:** Tách nhỏ Monolith sang Microservices theo Domain-Driven Design (DDD).
* **High Performance Backend:** Xây dựng API hiệu năng cao với Golang, xử lý đồng thời (Concurrency) và Non-blocking I/O.
* **Modern Frontend:** Ứng dụng Next.js 15 App Router, Server Components và tối ưu hóa Web Vitals.
* **Cloud & DevOps:** Container hóa với Docker, điều phối cụm Kubernetes (K8s), thiết lập CI/CD pipeline tự động với GitHub Actions.
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 2400000,
      salePrice: 1290000,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  const sIT1 = await prisma.section.create({
    data: {
      courseId: courseITPaid.id,
      title: "Chương 1: Thiết Kế Kiến Trúc Microservices & Clean Architecture",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sIT1.id,
      title: "Bài 1: Nguyên Tắc Tách Service, Domain-Driven Design & Database Per Service",
      slug: "bai-1-nguyen-tac-tach-service-ddd",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 1350,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Cách xác định Bounded Context và chiến lược phân chia database tránh tình trạng Distributed Monolith.",
    },
  });

  const courseITFree = await prisma.course.create({
    data: {
      instructorId: instructorIT.id,
      categoryId: catITFullstack.id,
      title: "Nhập Môn Lập Trình TypeScript & Xây Dựng Ứng Dụng Thực Tế Từ Con Số 0",
      slug: "nhap-mon-lap-trinh-typescript-free",
      shortDescription: "Nắm vững cú pháp TypeScript hiện đại, Generic types, Utility types và kết nối API chuẩn type-safe cho người mới bắt đầu.",
      description: "Khóa học miễn phí giúp lập trình viên JavaScript chuyển đổi tư duy sang Type-Safe, hạn chế lỗi Runtime và tự tin làm việc trên các codebase lớn.",
      thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
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

  const sITFree1 = await prisma.section.create({
    data: {
      courseId: courseITFree.id,
      title: "Chương 1: Nền Tảng TypeScript Hiện Đại",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sITFree1.id,
      title: "Bài 1: Cài Đặt Môi Trường & Các Kiểu Dữ Liệu Nguyên Bản",
      slug: "bai-1-cai-dat-moi-truong-typescript",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 780,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Cấu hình tsconfig.json tối ưu, phân biệt Type và Interface, cách sử dụng Union types và Narrowing.",
    },
  });

  // 4F. Electronics Courses
  const courseElectronicsPaid = await prisma.course.create({
    data: {
      instructorId: instructorElectronics.id,
      categoryId: catElecPCB.id,
      title: "Chuyên Gia Thiết Kế Bo Mạch Tốc Độ Cao PCB (High-Speed Design) với Altium Designer",
      slug: "thiet-ke-pcb-high-speed-altium-designer",
      shortDescription: "Thực chiến thiết kế Layout bo mạch 4 - 8 lớp, kiểm soát trở kháng đường truyền (Impedance matching), chống nhiễu xuyên âm và tương thích điện từ EMC.",
      description: `
## Khóa Học Thiết Kế Bo Mạch Điện Tử Tốc Độ Cao Đẳng Cấp
Học trực tiếp cùng ThS. Vũ Thành Nam - Kỹ sư R&D phần cứng hơn 15 năm kinh nghiệm. Khóa học đưa bạn từ lý thuyết mạch đến năng lực tự tin layout các bo mạch phức tạp chuẩn công nghiệp.

### ⚡ Bạn sẽ làm chủ:
* **Stackup bo mạch nhiều lớp:** Tính toán độ dày điện môi, kiểm soát trở kháng vi sai (Differential Impedance 90Ω, 100Ω).
* **Kỹ thuật Length Tuning:** Cân bằng chiều dài đường bus dữ liệu DDR3/DDR4, HDMI và USB 3.0.
* **Tiêu chuẩn chống nhiễu EMI/EMC:** Thiết kế mặt phẳng Ground (Reference Plane), khử vòng lặp dòng điện (Ground Loops).
* **Xuất file sản xuất DFM/DFA:** Tạo file Gerber X2, ODB++, pick-and-place và BOM chuẩn cho nhà máy SMT.
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 2200000,
      salePrice: 1190000,
      level: "ADVANCED",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  const sElec1 = await prisma.section.create({
    data: {
      courseId: courseElectronicsPaid.id,
      title: "Chương 1: Thiết Lập Stackup 4-8 Lớp & Kiểm Soát Trở Kháng",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sElec1.id,
      title: "Bài 1: Công Thức Tính Trở Kháng Vi Sai & Đường Truyền Microstrip/Stripline",
      slug: "bai-1-tinh-toan-tro-khang-vi-sai",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 1420,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Sử dụng Layer Stack Manager trên Altium Designer và công cụ Simbeor để tính toán bề rộng đường mạch chính xác đến từng mil.",
    },
  });

  const courseElectronicsFree = await prisma.course.create({
    data: {
      instructorId: instructorElectronics.id,
      categoryId: catElecPCB.id,
      title: "Nhập Môn Điện Tử Cơ Bản & Kỹ Năng Đo Kiểm Mạch Sống Thực Tế",
      slug: "nhap-mon-dien-tu-va-do-kiem-mach-free",
      shortDescription: "Làm quen với linh kiện R-L-C, Diode, Transistor, cách đọc datasheet và sử dụng đồng hồ VOM, máy hiện sóng oscilloscope an toàn.",
      description: "Khóa học nền tảng miễn phí giúp sinh viên và kỹ sư mới ra trường nắm vững thao tác đo kiểm điện áp, dòng điện và nhận diện lỗi mạch linh kiện.",
      thumbnailUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
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

  const sElecFree1 = await prisma.section.create({
    data: {
      courseId: courseElectronicsFree.id,
      title: "Chương 1: Kỹ Năng Đo Kiểm Thiết Bị Phòng Lab",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sElecFree1.id,
      title: "Bài 1: Sử Dụng Đồng Hồ VOM & Máy Hiện Sóng Đo Dạng Sóng Chuẩn Xác",
      slug: "bai-1-su-dung-dong-ho-vom-va-oscilloscope",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 810,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Kỹ thuật chỉnh Timebase, Voltage scale và Trigger trên máy hiện sóng để bắt tín hiệu dao động xung clock.",
    },
  });

  // 4G. Mechanical Courses
  const courseMechanicalPaid = await prisma.course.create({
    data: {
      instructorId: instructorMechanical.id,
      categoryId: catMechCAD.id,
      title: "Thực Chiến Thiết Kế Máy & Cơ Cấu Tự Động Hóa 3D Chuyên Nghiệp với SolidWorks",
      slug: "thiet-ke-may-co-cau-tu-dong-hoa-solidworks",
      shortDescription: "Từ ý tưởng cơ cấu máy đến mô hình 3D hoàn chỉnh: Tính toán công suất động cơ, dung sai lắp ghép GD&T, thiết kế đồ gá JIG và xuất bản vẽ gia công CNC.",
      description: `
## Khóa Học Thiết Kế Máy & Cơ Điện Tử Tự Động Hóa Thực Chiến
Được hướng dẫn bởi Kỹ sư Đỗ Quang Huy - Chuyên gia R&D máy công nghiệp với hơn 10 năm kinh nghiệm thiết kế các dây chuyền tự động hóa.

### ⚙️ Bạn sẽ làm chủ:
* **Dựng hình 3D tham số:** Thiết kế chi tiết dạng tấm kim loại (Sheet Metal), khung hàn (Weldments) và cụm lắp ráp phức tạp (Large Assemblies).
* **Tính chọn thiết bị công nghiệp:** Tính toán công suất động cơ Servo/Step, trục vít me bi, ray trượt tuyến tính MISUMI và xylanh SMC.
* **Chuẩn dung sai GD&T:** Kiểm soát dung sai hình học độ đảo, độ vuông góc, độ phẳng đảm bảo lắp ráp chính xác tại xưởng cơ khí.
* **Mô phỏng động học & FEA:** Kiểm tra va chạm cơ cấu (Interference Detection) và phân tích ứng suất tĩnh trên SolidWorks Simulation.
      `,
      thumbnailUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      price: 1990000,
      salePrice: 1050000,
      level: "INTERMEDIATE",
      status: "PUBLISHED",
      isFeatured: true,
      isFree: false,
      certificateEnabled: true,
    },
  });

  const sMech1 = await prisma.section.create({
    data: {
      courseId: courseMechanicalPaid.id,
      title: "Chương 1: Thiết Kế Khung Vỏ & Cơ Cấu Chấp Hành Khí Nén",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sMech1.id,
      title: "Bài 1: Tính Chọn Xylanh Khí Nén & Van Điện Từ Cho Cơ Cấu Đẩy Phôi",
      slug: "bai-1-tinh-chon-xylanh-khi-nen",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 1280,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Công thức tính lực đẩy của xylanh dựa trên áp suất khí nén cấp vào và hệ số an toàn khi chịu tải động.",
    },
  });

  const courseMechanicalFree = await prisma.course.create({
    data: {
      instructorId: instructorMechanical.id,
      categoryId: catMechCAD.id,
      title: "Nhập Môn Bản Vẽ Kỹ Thuật Cơ Khí & Dựng Khối 3D Chuẩn Công Nghiệp",
      slug: "nhap-mon-ban-ve-ky-thuat-co-khi-free",
      shortDescription: "Học cách đọc hình chiếu vuông góc, mặt cắt, hình trích và thực hành dựng các chi tiết máy đơn giản trên phần mềm SolidWorks.",
      description: "Khóa học miễn phí trang bị cho sinh viên và kỹ sư cơ khí phương pháp tư duy không gian 3D và chuẩn hóa quy cách xuất bản vẽ gia công 2D.",
      thumbnailUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80",
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

  const sMechFree1 = await prisma.section.create({
    data: {
      courseId: courseMechanicalFree.id,
      title: "Chương 1: Đọc Bản Vẽ Kỹ Thuật & Dựng Khối Cơ Bản",
      orderIndex: 1,
    },
  });

  await prisma.lesson.create({
    data: {
      sectionId: sMechFree1.id,
      title: "Bài 1: Nguyên Tắc Ba Hình Chiếu Vuông Góc & Phác Thảo Sketch Chuẩn",
      slug: "bai-1-nguyen-tac-ba-hinh-chieu",
      contentType: "VIDEO_YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kNNbVf94gqw",
      videoDuration: 750,
      isPreview: true,
      orderIndex: 1,
      contentBody: "Kỹ năng ràng buộc hình học (Fully Defined Sketch) giúp bản vẽ thiết kế không bị biến dạng khi thay đổi kích thước.",
    },
  });

  // --------------------------------------------------------------------------
  // 4H. ADDITIONAL COURSES (4 MORE PER NICHE -> TOTAL 6 COURSES PER NICHE)
  // --------------------------------------------------------------------------

  // 1. Additional Trading Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructor.id,
    categoryId: catSMC.id,
    title: "Price Action Nâng Cao: Nghệ Thuật Đọc Nến & Bẫy Thanh Khoản Quét Stoploss",
    slug: "price-action-nang-cao-bay-thanh-khoan",
    shortDescription: "Nhận diện vùng thanh khoản kép (Double Top/Bottom Liquidity) và cách thiết lập lệnh săn râu nến (Liquidity Sweep) chuẩn xác.",
    description: "Khóa học thực chiến giúp trader phân biệt các đợt quét thanh khoản giả và thời điểm dòng tiền thông minh thực sự kích hoạt lệnh lớn.",
    thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    price: 1800000,
    salePrice: 990000,
    level: "ADVANCED",
    isFeatured: true,
    sectionTitle: "Chương 1: Kỹ Thuật Đọc Sóng Thanh Khoản",
    lessonTitle: "Bài 1: Nhận Diện Bẫy Giá Induced Liquidity Trước Tin Tức",
    lessonSlug: "bai-1-nhan-dien-bay-gia-induced-liquidity",
    contentBody: "Phương pháp đọc bẫy giá phiên Á và phiên Âu để tìm điểm bùng nổ trong phiên Mỹ.",
  });

  await createDemoCourse({
    instructorId: instructor.id,
    categoryId: catStock.id,
    title: "Đầu Tư Chứng Khoán Việt Nam Thực Chiến: Phân Tích Dòng Tiền Lớn VSA",
    slug: "dau-tu-chung-khoan-viet-nam-vsa",
    shortDescription: "Nhận diện dấu chân Big Boys, các pha Gom hàng (Accumulation), Đẩy giá (Markup) và Phân phối (Distribution) trên thị trường VN-Index.",
    description: "Giáo trình phân tích khối lượng và hành vi giá VSA chuyên sâu, giúp bạn lọc cổ phiếu dẫn dắt và tránh đu đỉnh ngắn hạn.",
    thumbnailUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    price: 2100000,
    salePrice: 1150000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Các Pha Của Chu Kỳ Cổ Phiếu VSA",
    lessonTitle: "Bài 1: Dấu Hiệu Nhận Biết Cổ Phiếu Vào Pha Tích Lũy Cạn Cung",
    lessonSlug: "bai-1-dau-hieu-nhan-biet-tich-luy-can-cung",
    contentBody: "Cách đọc các phiên No Demand Bar và Test Bar trước khi cổ phiếu bước vào pha bứt phá.",
  });

  await createDemoCourse({
    instructorId: instructor.id,
    categoryId: catStock.id,
    title: "Đọc Hiểu Báo Cáo Tài Chính & Định Giá Cổ Phiếu Cho Nhà Đầu Tư Mới",
    slug: "doc-hieu-bao-cao-tai-chinh-dinh-gia-f0",
    shortDescription: "Giải mã các chỉ số P/E, P/B, ROE, nợ vay và dòng tiền kinh doanh giúp chọn lọc doanh nghiệp tăng trưởng bền vững.",
    description: "Khóa học miễn phí giúp nhà đầu tư nắm bắt các bẫy kế toán thường gặp và đánh giá sức khỏe tài chính thực sự của doanh nghiệp.",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "BEGINNER",
    isFree: true,
    sectionTitle: "Chương 1: Ba Bảng Báo Cáo Tài Chính Trọng Yếu",
    lessonTitle: "Bài 1: Phân Tích Bảng Cân Đối Kế Toán & Cơ Cấu Nợ Vay",
    lessonSlug: "bai-1-bang-can-doi-ke-toan-no-vay",
    contentBody: "Phương pháp kiểm tra tính thanh khoản và các khoản phải thu bất thường của ban lãnh đạo.",
  });

  await createDemoCourse({
    instructorId: instructor.id,
    categoryId: catAlgo.id,
    title: "Lập Trình Bot Giao Dịch Tự Động MT5 (MQL5) & Thuật Toán Quản Lý Vốn",
    slug: "lap-trinh-bot-giao-dich-mt5-mql5",
    shortDescription: "Tự động hóa 100% chiến lược giao dịch: Viết Expert Advisor (EA), backtest dữ liệu 10 năm và triển khai vận hành VPS 24/7.",
    description: "Xây dựng hệ thống giao dịch tự động không cảm xúc, tích hợp quản lý rủi ro Martingale có kiểm soát và Trailing Stoploss thông minh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    price: 2800000,
    salePrice: 1590000,
    level: "ADVANCED",
    isFeatured: true,
    sectionTitle: "Chương 1: Nền Tảng Ngôn Ngữ MQL5",
    lessonTitle: "Bài 1: Cấu Trúc Của Một Expert Advisor & Vòng Đời Lệnh Giao Dịch",
    lessonSlug: "bai-1-cau-truc-expert-advisor-mql5",
    contentBody: "Viết mã nguồn mở lệnh, đóng lệnh và hàm kiểm tra rủi ro theo tỷ lệ phần trăm tài khoản.",
  });

  // 2. Additional IELTS Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructorIELTS.id,
    categoryId: catIELTSSpeaking.id,
    title: "Chiến Lược Đột Phá IELTS Writing Task 2: Tư Duy Nghị Luận & Cấu Trúc 8.0+",
    slug: "chien-luoc-ielts-writing-task-2-8-0",
    shortDescription: "Khai mở tư duy lập luận phản biện, kỹ thuật triển khai ý tưởng P-E-E-L và bộ từ vựng Academic C1/C2 nâng band điểm thần tốc.",
    description: "Chuyên sâu vào các dạng bài khó nhất của Writing Task 2: Two-part Questions, Discuss both views và To what extent do you agree.",
    thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    price: 1650000,
    salePrice: 890000,
    level: "ADVANCED",
    isFeatured: true,
    sectionTitle: "Chương 1: Kỹ Thuật Viết Đoạn Thân Bài Sắc Bén",
    lessonTitle: "Bài 1: Cách Phát Triển Luận Cứ Không Bị Trùng Lặp Ý",
    lessonSlug: "bai-1-phat-trien-luan-cu-writing-task-2",
    contentBody: "Phân tích bài mẫu 8.5 từ cựu giám khảo Cambridge và cách sử dụng liên từ nối tự nhiên.",
  });

  await createDemoCourse({
    instructorId: instructorIELTS.id,
    categoryId: catIELTSSpeaking.id,
    title: "Bí Quyết Phản Xạ IELTS Speaking 7.5+: Chiến Thuật Xử Lý Part 1, 2, 3 Tự Nhiên",
    slug: "phan-xa-ielts-speaking-7-5-tu-nhien",
    shortDescription: "Làm chủ ngữ điệu bản xứ, kỹ thuật kéo dài câu trả lời (Fluency & Coherence) và cách xử lý khi gặp chủ đề lạ trong phòng thi.",
    description: "Bộ đề dự đoán Speaking cập nhật mới nhất kèm câu trả lời mẫu đạt chuẩn band điểm 8.0+ cho từng topic thời sự.",
    thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    price: 1500000,
    salePrice: 790000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Chiến Thuật Mở Rộng Câu Trả Lời Part 1",
    lessonTitle: "Bài 1: Công Thức A-R-E-A (Answer - Reason - Example - Alternative)",
    lessonSlug: "bai-1-cong-thuc-area-speaking",
    contentBody: "Rèn luyện phản xạ bật ngay câu trả lời trong 1 giây mà không cần dịch từ tiếng Việt sang tiếng Anh.",
  });

  await createDemoCourse({
    instructorId: instructorIELTS.id,
    categoryId: catIELTSMastery.id,
    title: "Giải Mã 1.000 Từ Vựng Học Thuật IELTS Band 7.5+ Theo Chủ Đề Hot",
    slug: "1000-tu-vung-hoc-thuat-ielts-theo-chu-de",
    shortDescription: "Ghi nhớ từ vựng qua phương pháp Spaced Repetition (Lặp lại ngắt quãng) theo các cụm chủ đề Môi trường, Công nghệ, Giáo dục.",
    description: "Khóa học miễn phí giúp bạn mở rộng vốn từ vựng học thuật C1/C2 dùng cho cả 4 kỹ năng trong kỳ thi IELTS.",
    thumbnailUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "ALL_LEVELS",
    isFree: true,
    sectionTitle: "Chương 1: Chủ Đề Môi Trường & Phát Triển Bền Vững",
    lessonTitle: "Bài 1: 30 Collocations C1 Về Biến Đổi Khí Hậu & Năng Lượng Xanh",
    lessonSlug: "bai-1-collocations-moi-truong-c1",
    contentBody: "Ứng dụng từ vựng ngay vào các câu mở đoạn Writing và luận điểm Speaking Part 3.",
  });

  await createDemoCourse({
    instructorId: instructorIELTS.id,
    categoryId: catIELTSMastery.id,
    title: "Luyện Đề Chuyên Sâu IELTS Listening & Reading: Kỹ Thuật Bẫy Paraphrase",
    slug: "luyen-de-ielts-listening-reading-paraphrase",
    shortDescription: "Phương pháp xử lý đề Cambridge 15-19: Nhận diện từ đồng nghĩa, phân tích câu hỏi Multiple Choice và Heading Matching chuẩn xác.",
    description: "Chiến thuật bứt phá điểm số tối đa ở hai kỹ năng thụ động, tiết kiệm thời gian làm bài và nâng cao độ tập trung khi nghe audio.",
    thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
    price: 1350000,
    salePrice: 690000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Kỹ Thuật Định Vị Thông Tin Reading",
    lessonTitle: "Bài 1: Xử Lý Dạng Bài True / False / Not Given Chuẩn Xác 100%",
    lessonSlug: "bai-1-xu-ly-true-false-not-given",
    contentBody: "Quy tắc phân biệt rõ ràng giữa False (mâu thuẫn thông tin) và Not Given (không đủ căn cứ kết luận).",
  });

  // 3. Additional Baking Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructorBaking.id,
    categoryId: catSourdough.id,
    title: "Nghệ Thuật Bánh Mì Hoa Cúc & Croissant Ngàn Lớp Chuẩn Hương Vị Pháp",
    slug: "nghe-thuat-banh-mi-hoa-cuc-va-croissant",
    shortDescription: "Bí quyết cán bơ lạnh tạo ngàn lớp giòn xốp (Lamination), kỹ thuật tết sam bánh hoa cúc thớ dai mềm thơm béo bơ động vật.",
    description: "Nắm vững kỹ thuật khống chế nhiệt độ phòng khi cán bơ, quy trình ủ bột chậm trong tủ mát để tạo cấu trúc tổ ong hoàn mỹ.",
    thumbnailUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
    price: 1550000,
    salePrice: 850000,
    level: "INTERMEDIATE",
    isFeatured: true,
    sectionTitle: "Chương 1: Kỹ Thuật Cán Bơ Ngàn Lớp",
    lessonTitle: "Bài 1: Công Thức Gấp Bột Tour Simple & Tour Double Cho Croissant",
    lessonSlug: "bai-1-cong-thuc-gap-bot-croissant",
    contentBody: "Cách bảo quản khối bơ ở 14-16°C để không bị gãy bơ hoặc chảy bơ trong khi cán.",
  });

  await createDemoCourse({
    instructorId: instructorBaking.id,
    categoryId: catButtercream.id,
    title: "Chuyên Đề Bắt Hoa Kem Bơ Hàn Quốc & Phối Màu Pastel Nghệ Thuật",
    slug: "bat-hoa-kem-bo-han-quoc-pastel",
    shortDescription: "Kỹ thuật bắt hoa hồng, hoa mao lương, cẩm tú cầu bằng kem bơ trong suốt Glossy Buttercream chuẩn phong cách Hàn Quốc thời thượng.",
    description: "Hướng dẫn phối bảng màu pastel thanh lịch, kỹ thuật nghiêng đui bắt hoa và bố cục trang trí bánh cưới sang trọng.",
    thumbnailUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80",
    price: 1400000,
    salePrice: 790000,
    level: "ALL_LEVELS",
    isFeatured: false,
    sectionTitle: "Chương 1: Nấu Kem Bơ Bóng Trong Suốt",
    lessonTitle: "Bài 1: Công Thức Kem Bơ Lòng Trắng Trứng Italian Meringue Bất Bại",
    lessonSlug: "bai-1-kem-bo-italian-meringue",
    contentBody: "Kiểm soát nhiệt kế siro đường ở 118°C để kem bơ đạt độ mịn mượt và không bị tách nước.",
  });

  await createDemoCourse({
    instructorId: instructorBaking.id,
    categoryId: catButtercream.id,
    title: "Bí Quyết Chà Láng Sắc Cạnh Bánh Kem Sinh Nhật Kinh Doanh",
    slug: "bi-quyet-cha-lang-sac-canh-banh-kem",
    shortDescription: "Thao tác tay chuẩn xác với bàn xoay và miếng vét mica, xử lý góc cạnh bánh vuông vức không bị rỗ kem chỉ trong 5 phút.",
    description: "Khóa học thực hành miễn phí giúp thợ bánh mới vào nghề tự tin chà láng mặt phẳng và sắc cạnh cho cốt bánh gato mềm.",
    thumbnailUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "BEGINNER",
    isFree: true,
    sectionTitle: "Chương 1: Kỹ Năng Đánh Kem & Chà Láng",
    lessonTitle: "Bài 1: Cách Cầm Dao Chà Láng & Góc Nghiêng 45 Độ Chuẩn Tiệm Bánh",
    lessonSlug: "bai-1-cach-cam-dao-cha-lang",
    contentBody: "Bí quyết khắc phục hiện tượng kem bị đánh quá tay rỗ tổ ong bằng nước ấm.",
  });

  await createDemoCourse({
    instructorId: instructorBaking.id,
    categoryId: catButtercream.id,
    title: "Masterclass Bánh Lạnh Châu Âu: Mousse, Tiramisu & Entremet Tráng Gương",
    slug: "masterclass-banh-lanh-entremet-trang-guong",
    shortDescription: "Làm chủ kỹ thuật nấu lớp nhân Curd, thạch Jelly, cốt bánh dacquoise giòn hạt và lớp sốt tráng gương (Mirror Glaze) bóng loáng chuẩn 5 sao.",
    description: "Bộ công thức các dòng bánh lạnh cao cấp mang lại tỷ suất lợi nhuận cao cho các mô hình tiệm bánh cà phê hiện đại.",
    thumbnailUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80",
    price: 1750000,
    salePrice: 950000,
    level: "ADVANCED",
    isFeatured: false,
    sectionTitle: "Chương 1: Kỹ Thuật Đổ Lớp Tráng Gương",
    lessonTitle: "Bài 1: Công Thức Sốt Tráng Gương Sôcôla Trắng Nhiệt Độ Đổ 32°C",
    lessonSlug: "bai-1-sot-trang-guong-mirror-glaze",
    contentBody: "Kỹ thuật dùng máy xay cầm tay khử hoàn toàn bọt khí trên bề mặt bánh tráng gương.",
  });

  // 4. Additional Fitness Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructorFitness.id,
    categoryId: catFatLoss.id,
    title: "Giáo Án Tăng Cơ Hypertrophy: Xây Dựng Khối Cơ Bắp Chuẩn Khối & Lực",
    slug: "giao-an-tang-co-hypertrophy-chuyen-sau",
    shortDescription: "Phương pháp tập luyện lũy tiến tải trọng (Progressive Overload), kỹ thuật Reps in Reserve (RIR) và cách kích hoạt tối đa sợi cơ type II.",
    description: "Lịch tập chi tiết 4-5 buổi/tuần dành cho người muốn tối ưu hóa kích thước cơ bắp và sức mạnh bền bỉ.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    price: 1250000,
    salePrice: 690000,
    level: "INTERMEDIATE",
    isFeatured: true,
    sectionTitle: "Chương 1: Nguyên Lý Phát Triển Cơ Bắp",
    lessonTitle: "Bài 1: Kiểm Soát Thời Gian Chịu Áp Lực (Time Under Tension - TUT)",
    lessonSlug: "bai-1-kiem-soat-time-under-tension",
    contentBody: "Kỹ thuật hạ tạ chậm 3 giây (Eccentric Phase) kích thích vi tổn thương cơ bắp có lợi.",
  });

  await createDemoCourse({
    instructorId: instructorFitness.id,
    categoryId: catFatLoss.id,
    title: "Dinh Dưỡng Thể Hình Thực Chiến: Thiết Kế Thực Đơn Macro Chuẩn Từng Giai Đoạn",
    slug: "dinh-duong-the-hinh-thiet-ke-macro",
    shortDescription: "Tự tính toán khẩu phần đạm - tinh bột - chất béo, cách chọn nguồn thực phẩm tự nhiên và chiến lược Refeed Day chống đình trệ giảm mỡ.",
    description: "Giáo trình dinh dưỡng thực tế ứng dụng nguyên liệu Việt Nam, không cần dùng thực phẩm bổ sung đắt đỏ.",
    thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    price: 890000,
    salePrice: 490000,
    level: "ALL_LEVELS",
    isFeatured: false,
    sectionTitle: "Chương 1: Phân Bổ Năng Lượng Trong Ngày",
    lessonTitle: "Bài 1: Thời Điểm Vàng Bổ Sung Protein Trước & Sau Buổi Tập",
    lessonSlug: "bai-1-thoi-diem-bo-sung-protein",
    contentBody: "Cách hấp thụ tối đa 30-40g protein mỗi bữa ăn để chống dị hóa cơ bắp.",
  });

  await createDemoCourse({
    instructorId: instructorFitness.id,
    categoryId: catFatLoss.id,
    title: "Kỹ Thuật Hít Thở & Khởi Động Động Học Chống Chấn Thương Khớp",
    slug: "hit-tho-khoi-dong-chong-chan-thuong",
    shortDescription: "Chuỗi bài tập Dynamic Warm-up 10 phút kích hoạt cơ mông, làm ấm ổ khớp vai và kỹ thuật thở gồng bụng bảo vệ cột sống.",
    description: "Khóa học nền tảng miễn phí giúp người tập gym loại bỏ các cơn đau nhức cổ tay, khớp gối và đau lưng dưới khi gánh tạ.",
    thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "BEGINNER",
    isFree: true,
    sectionTitle: "Chương 1: Khởi Động Khớp Toàn Diện",
    lessonTitle: "Bài 1: Kích Hoạt Ổ Khớp Vai Với Dây Kháng Lực Band Pull-apart",
    lessonSlug: "bai-1-kich-hoat-o-khop-vai",
    contentBody: "Cách mở rộng biên độ chuyển động của bả vai trước bài đẩy ngực Bench Press.",
  });

  await createDemoCourse({
    instructorId: instructorFitness.id,
    categoryId: catYoga.id,
    title: "Yoga Chữa Lành Trầm Cảm, Giải Tỏa Stress & Cải Thiện Giấc Ngủ Sâu",
    slug: "yoga-chua-lanh-stress-cai-thien-giac-ngu",
    shortDescription: "Các chuỗi động tác Yoga Yin nhẹ nhàng, thở Pranayama và thiền định buông thư giúp xoa dịu hệ thần kinh giao cảm.",
    description: "Khóa tập trị liệu tại nhà dành cho người bận rộn bị mất ngủ, căng thẳng kéo dài và đau mỏi vai gáy do làm việc quá sức.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
    price: 950000,
    salePrice: 550000,
    level: "ALL_LEVELS",
    isFeatured: false,
    sectionTitle: "Chương 1: Chuỗi Bài Tập Buổi Tối",
    lessonTitle: "Bài 1: Tư Thế Chân Đặt Lên Tường (Viparita Karani) Tăng Tuần Hoàn Não",
    lessonSlug: "bai-1-tu-the-viparita-karani",
    contentBody: "Thực hành 15 phút trước khi đi ngủ giúp hạ nhịp tim và vào giấc ngủ tự nhiên nhanh chóng.",
  });

  // 5. Additional IT Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructorIT.id,
    categoryId: catITFullstack.id,
    title: "Xây Dựng Hệ Thống Microservices Với Golang, gRPC & Apache Kafka",
    slug: "xay-dung-microservices-golang-grpc-kafka",
    shortDescription: "Thực chiến thiết kế dịch vụ phân tán hiệu năng cao với Golang: Xử lý giao tiếp gRPC nhị phân siêu tốc, Message Queue Kafka chịu tải triệu message/s.",
    description: "Khóa học chuyên sâu đưa bạn vào thế giới backend quy mô lớn: Triển khai Service Discovery, Circuit Breaker với Consul và gRPC middleware.",
    thumbnailUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    price: 2150000,
    salePrice: 1190000,
    level: "ADVANCED",
    isFeatured: true,
    sectionTitle: "Chương 1: Kiến Trúc Hướng Sự Kiện (Event-Driven Architecture)",
    lessonTitle: "Bài 1: Thiết Lập Kafka Consumer Group & Cơ Chế Exactly-Once Delivery",
    lessonSlug: "bai-1-kafka-consumer-group-exactly-once",
    contentBody: "Xử lý idempotency và tránh duplicate dữ liệu khi hàng đợi Kafka phát lại tin nhắn.",
  });

  await createDemoCourse({
    instructorId: instructorIT.id,
    categoryId: catITAI.id,
    title: "Lập Trình Trí Tuệ Nhân Tạo: Xây Dựng Ứng Dụng AI GenAI & LLM với LangChain/RAG",
    slug: "lap-trinh-ai-genai-llm-langchain-rag",
    shortDescription: "Tích hợp mô hình ngôn ngữ lớn (OpenAI, Claude, LLaMA), xây dựng hệ thống hỏi đáp dữ liệu doanh nghiệp RAG với Vector Database Milvus/Pinecone.",
    description: "Nắm vững kỹ thuật Prompt Engineering nâng cao, Fine-tuning mô hình mã nguồn mở và xây dựng AI Agent tự động hóa quy trình nghiệp vụ.",
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    price: 2600000,
    salePrice: 1450000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Kiến Trúc RAG (Retrieval-Augmented Generation)",
    lessonTitle: "Bài 1: Phân Đoạn Tài Liệu (Chunking) & Tạo Embedding Vectors",
    lessonSlug: "bai-1-chunking-document-embeddings",
    contentBody: "Tối ưu hóa độ chính xác của ngữ cảnh tìm kiếm ngữ nghĩa với Semantic Search.",
  });

  await createDemoCourse({
    instructorId: instructorIT.id,
    categoryId: catITFullstack.id,
    title: "DevOps Toàn Diện: Làm Chủ Docker, Kubernetes, CI/CD Pipeline & Giám Sát Cloud",
    slug: "devops-docker-kubernetes-cicd-cloud",
    shortDescription: "Tự động hóa hoàn toàn quy trình bàn giao phần mềm: Viết Dockerfile đa tầng, triển khai cụm K8s Helm Charts, dựng pipeline GitHub Actions.",
    description: "Giám sát hệ thống thời gian thực với Prometheus & Grafana, thu thập log tập trung với Loki và thiết lập cảnh báo sự cố tự động qua Telegram.",
    thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80",
    price: 2300000,
    salePrice: 1250000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Quản Trị Cụm Kubernetes Production",
    lessonTitle: "Bài 1: Cấu Hình Ingress NGINX, Cert-Manager Cấp SSL Tự Động",
    lessonSlug: "bai-1-ingress-nginx-cert-manager",
    contentBody: "Triển khai dịch vụ Zero-Downtime Deployment với chiến lược Rolling Update.",
  });

  await createDemoCourse({
    instructorId: instructorIT.id,
    categoryId: catITAI.id,
    title: "Nhập Môn Python & Xử Lý Dữ Liệu Thực Tế Cho Người Mới Bắt Đầu",
    slug: "nhap-mon-python-xu-ly-du-lieu-free",
    shortDescription: "Cú pháp lập trình Python tinh gọn, làm quen với thư viện NumPy, Pandas và trực quan hóa dữ liệu biểu đồ với Matplotlib.",
    description: "Khóa học miễn phí giúp bạn bước chân vào ngành Khoa học dữ liệu (Data Science) và Lập trình tự động hóa với các dự án mini thú vị.",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "BEGINNER",
    isFree: true,
    sectionTitle: "Chương 1: Làm Quen Với Python & Thư Viện Pandas",
    lessonTitle: "Bài 1: Đọc File Excel/CSV & Thao Tác Lọc Dữ Liệu Nhanh",
    lessonSlug: "bai-1-doc-file-excel-pandas",
    contentBody: "Sử dụng hàm lọc điều kiện DataFrame để xuất báo cáo phân tích kinh doanh trong 3 dòng code.",
  });

  // 6. Additional Electronics Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructorElectronics.id,
    categoryId: catElecEmbedded.id,
    title: "Lập Trình Hệ Thống Nhúng Vi Điều Khiển ARM Cortex-M với FreeRTOS",
    slug: "lap-trinh-nhung-arm-cortex-m-freertos",
    shortDescription: "Lập trình đa nhiệm Real-Time OS trên STM32: Quản lý Tasks, Queues, Semaphores, Mutex và tối ưu hóa bộ nhớ RAM/Flash cho sản phẩm thương mại.",
    description: "Khóa học chuyên sâu từ thanh ghi (Bare-metal) đến kiến trúc phần mềm nhúng chuyên nghiệp, xử lý ngắt phần cứng an toàn tuyệt đối.",
    thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
    price: 1950000,
    salePrice: 1050000,
    level: "ADVANCED",
    isFeatured: true,
    sectionTitle: "Chương 1: Cơ Chế Định Thời & Chuyển Ngữ Cảnh FreeRTOS",
    lessonTitle: "Bài 1: Phân Biệt Binary Semaphore và Counting Semaphore",
    lessonSlug: "bai-1-binary-va-counting-semaphore",
    contentBody: "Giải quyết vấn đề tranh chấp tài nguyên (Resource Contention) và nghịch đảo độ ưu tiên (Priority Inversion).",
  });

  await createDemoCourse({
    instructorId: instructorElectronics.id,
    categoryId: catElecEmbedded.id,
    title: "Thiết Kế Thiết Bị IoT Công Nghiệp Kết Nối Không Dây LoRa, BLE & WiFi",
    slug: "thiet-ke-thiet-bi-iot-lora-ble-wifi",
    shortDescription: "Xây dựng trạm cảm biến quan trắc môi trường truyền xa qua LoRaWAN, giao tiếp Bluetooth Low Energy tiết kiệm pin và đồng bộ Cloud MQTT.",
    description: "Thực hành thiết kế phần cứng đo đạc công nghiệp đạt chuẩn bảo vệ IP67, quản lý năng lượng chế độ Deep Sleep tiêu thụ dưới 15uA.",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    price: 1850000,
    salePrice: 990000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Thiết Kế Nút Cảm Biến LoRaWAN",
    lessonTitle: "Bài 1: Tính Toán Công Suất Phát RF & Tối Ưu Ăng-ten Mạch PCB",
    lessonSlug: "bai-1-tinh-toan-cong-suat-rf-ang-ten",
    contentBody: "Kỹ thuật phối hợp trở kháng 50 Ohm cho đường dẫn sóng cao tần từ chip ra ăng ten ngoài.",
  });

  await createDemoCourse({
    instructorId: instructorElectronics.id,
    categoryId: catElecPCB.id,
    title: "Kỹ Thuật Thiết Kế Nguồn Xung (SMPS) & Mạch Bảo Vệ Công Suất Cho Bo Mạch",
    slug: "thiet-ke-nguon-xung-smps-cong-suat",
    shortDescription: "Nguyên lý hoạt động và layout mạch nguồn Buck, Boost, Flyback: Tính chọn cuộn cảm, tụ lọc ESR thấp và cách tản nhiệt cho MOSFET công suất.",
    description: "Làm chủ thiết kế nguồn điện ổn định, chịu điện áp quá độ (Surge), chống tĩnh điện ESD và đáp ứng tiêu chuẩn an toàn UL/CE.",
    thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    price: 1700000,
    salePrice: 890000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Thiết Kế Mạch Nguồn Buck Giảm Áp Đồng Bộ",
    lessonTitle: "Bài 1: Layout Vòng Lặp Dòng Lớn (Hot Loop) Giảm Nhiễu Phát Xạ",
    lessonSlug: "bai-1-layout-hot-loop-nguon-xung",
    contentBody: "Quy tắc thu hẹp diện tích vòng lặp chuyển mạch tần số cao để triệt tiêu sóng hài nhiễu.",
  });

  await createDemoCourse({
    instructorId: instructorElectronics.id,
    categoryId: catElecPCB.id,
    title: "Hướng Dẫn Thiết Kế Mạch Nguyên Lý Schematic & Chọn Linh Kiện Trên KiCAD",
    slug: "thiet-ke-mach-nguyen-ly-kicad-free",
    shortDescription: "Phần mềm mã nguồn mở KiCAD 8: Vẽ sơ đồ khối mạch điện tử, gán Footprint linh kiện SMD, chạy kiểm tra luật điện học ERC và xuất Netlist.",
    description: "Khóa học miễn phí giúp các bạn bắt đầu làm quen với quy trình thiết kế phần cứng chuyên nghiệp mà không tốn chi phí bản quyền phần mềm.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "BEGINNER",
    isFree: true,
    sectionTitle: "Chương 1: Quy Trình Vẽ Schematic Chuẩn Quốc Tế",
    lessonTitle: "Bài 1: Đặt Tên Net Label, Phân Chia Khối Nguồn Và Khối Xử Lý",
    lessonSlug: "bai-1-dat-ten-net-label-kicad",
    contentBody: "Cách tổ chức sơ đồ nguyên lý phân cấp (Hierarchical Sheet) cho dự án nhiều trang.",
  });

  // 7. Additional Mechanical Courses (Total: 6)
  await createDemoCourse({
    instructorId: instructorMechanical.id,
    categoryId: catMechCAD.id,
    title: "Thiết Kế Đồ Gá Gia Công (JIG) & Đồ Gá Kiểm Tra Chuẩn Xác với SolidWorks",
    slug: "thiet-ke-do-ga-gia-cong-jig-solidworks",
    shortDescription: "Nguyên tắc định vị 6 bậc tự do, cơ cấu kẹp chặt nhanh (Toggle Clamp), thiết kế JIG phay CNC, JIG hàn và JIG kiểm tra kích thước sản phẩm.",
    description: "Được đúc kết từ kinh nghiệm thiết kế thực tế tại các xưởng gia công phụ tùng ô tô xe máy, tối ưu thời gian gá đặt phôi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=1200&q=80",
    price: 1800000,
    salePrice: 990000,
    level: "INTERMEDIATE",
    isFeatured: true,
    sectionTitle: "Chương 1: Nguyên Tắc Định Vị & Kẹp Chặt Chi Tiết",
    lessonTitle: "Bài 1: Bố Trí Chốt Trụ Và Chốt Trám Triệt Tiêu Xoay",
    lessonSlug: "bai-1-bo-tri-chot-dinh-vi-do-ga",
    contentBody: "Cách tính toán lực kẹp không làm biến dạng chi tiết vỏ mỏng khi gia công phay cao tốc.",
  });

  await createDemoCourse({
    instructorId: instructorMechanical.id,
    categoryId: catMechCAE.id,
    title: "Mô Phỏng Độ Bền Kết Cấu & Phân Tích Phần Tử Hữu Hạn FEA trên ANSYS",
    slug: "mo-phong-do-ben-ket-cau-fea-ansys",
    shortDescription: "Phân tích ứng suất tĩnh (Static Structural), mỏi vật liệu (Fatigue), dao động riêng (Modal Analysis) và tối ưu hóa khối lượng chi tiết máy.",
    description: "Làm chủ kỹ thuật chia lưới phần tử (Meshing), đặt điều kiện biên (Boundary Conditions) và đọc biểu đồ ứng suất Von-Mises chuẩn xác.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80",
    price: 2100000,
    salePrice: 1150000,
    level: "ADVANCED",
    isFeatured: false,
    sectionTitle: "Chương 1: Kỹ Thuật Chia Lưới Phần Tử (Meshing)",
    lessonTitle: "Bài 1: Kiểm Soát Chất Lượng Lưới (Skewness & Aspect Ratio)",
    lessonSlug: "bai-1-kiem-soat-chat-luong-luoi-fea",
    contentBody: "Cách chèn Mesh Sizing tại các góc lượn chịu tập trung ứng suất (Stress Concentration).",
  });

  await createDemoCourse({
    instructorId: instructorMechanical.id,
    categoryId: catMechCAE.id,
    title: "Lập Trình Phay Tiện CNC Thực Chiến với Mastercam & Tối Ưu Đường Dao",
    slug: "lap-trinh-cnc-mastercam-toi-uu-dao-cat",
    shortDescription: "Xuất chương trình G-code cho máy phay 3 trục: Phay thô cao tốc Dynamic Motion, phay tinh biên dạng 3D, chọn chế độ cắt S & F chuẩn vật liệu.",
    description: "Khóa học thực chiến giúp kỹ sư đứng máy CNC rút ngắn 30-50% thời gian gia công và tăng gấp đôi tuổi thọ mảnh dao cắt hợp kim.",
    thumbnailUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80",
    price: 2400000,
    salePrice: 1290000,
    level: "INTERMEDIATE",
    isFeatured: false,
    sectionTitle: "Chương 1: Chiến Lược Phay Phá Thô Dynamic Milling",
    lessonTitle: "Bài 1: Thiết Lập Bước Tiến Dao Và Chiều Sâu Cắt Tiếp Tuyến",
    lessonSlug: "bai-1-thiet-lap-dynamic-milling",
    contentBody: "Tận dụng toàn bộ chiều dài me cắt của dao phay ngón để giảm tải lực uốn cán dao.",
  });

  await createDemoCourse({
    instructorId: instructorMechanical.id,
    categoryId: catMechCAD.id,
    title: "Nhập Môn Thiết Kế Kim Loại Tấm (Sheet Metal) & Khung Hàn Weldments 3D",
    slug: "thiet-ke-kim-loai-tam-sheet-metal-free",
    shortDescription: "Học dựng vỏ tủ điện, khay đựng, khung máy thép hộp trên SolidWorks: Trải phôi kim loại phẳng (Flat Pattern) và tính hệ số dãn K-Factor.",
    description: "Khóa học miễn phí bổ ích cho kỹ sư thiết kế các sản phẩm gia công đột dập, chấn uốn và cắt laser kim loại tấm.",
    thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    price: 0,
    salePrice: 0,
    level: "BEGINNER",
    isFree: true,
    sectionTitle: "Chương 1: Dựng Vỏ Kim Loại Tấm",
    lessonTitle: "Bài 1: Công Cụ Base Flange & Thiết Lập Bán Kính Uốn Góc Chấn",
    lessonSlug: "bai-1-base-flange-sheet-metal",
    contentBody: "Ý nghĩa của hệ số K-factor trong việc bù trừ biến dạng mép cắt trước khi đưa vào máy chấn phôi.",
  });

  console.log("✅ 42 realistic courses created (6 courses per each of the 7 niches)!");

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

  // 13E. IT Blog Post
  const blogPostIT = await prisma.blogPost.create({
    data: {
      authorId: instructorIT.id,
      categoryId: catITFullstack.id,
      title: "Kiến Trúc Microservices vs Monolith: Chiến Lược Tách Hệ Thống Chịu Tải Cao Cho Doanh Nghiệp",
      slug: "kien-truc-microservices-vs-monolith",
      summary: "So sánh chuyên sâu giữa Monolith và Microservices, cách phòng ngừa lỗi phân mảnh dữ liệu và quy trình bẻ gãy hệ thống lớn từng bước an toàn.",
      content: `## 1. Xu Hướng Chuyển Đổi: Đừng Vội Tách Khi Chưa Đủ Lớn

Nhiều đội ngũ kỹ thuật vội vàng chuyển từ Monolith sang Microservices ngay từ giai đoạn khởi nghiệp và gặp phải "Distributed Monolith" – hệ thống vừa chậm, vừa khó debug mà chi phí hạ tầng lại tăng vọt.

### ⚖️ Khi Nào Cần Sang Microservices?
* **Quy mô đội ngũ kỹ sư:** Khi có hơn 30 - 50 kỹ sư cùng commit vào một repository và xảy ra xung đột merge code liên tục.
* **Nhu cầu mở rộng độc lập (Independent Scaling):** Ví dụ dịch vụ thanh toán (Payment) chỉ cần 2 instance nhưng dịch vụ xem video cần 50 instance.
* **Thời gian release độc lập:** Một lỗi ở module gợi ý khóa học không được phép làm sập toàn bộ cổng thanh toán.

## 2. Chiến Lược Strangler Fig Pattern: Tách Từng Phần
Thay vì đập đi xây lại toàn bộ hệ thống, chiến lược an toàn nhất là:
1. Đặt một **API Gateway** (như Envoy hoặc Kong) đứng trước hệ thống Monolith cũ.
2. Xây dựng dịch vụ mới độc lập (New Microservice).
3. Định tuyến một phần nhỏ traffic (Canary) sang dịch vụ mới.
4. Khi dịch vụ mới ổn định 100%, ngắt bỏ module cũ trong Monolith.

## 3. Quản Lý Giao Dịch Phân Tán (Distributed Transactions)
Trong Microservices, việc sử dụng ACID transaction trên nhiều database là bất khả thi. Thay vào đó, chúng ta sử dụng:
* **Saga Pattern (Orchestration hoặc Choreography):** Chia nhỏ nghiệp vụ thành các giao dịch cục bộ kèm cơ chế bù trừ lỗi (Compensating transactions).
* **Outbox Pattern:** Đảm bảo dữ liệu lưu vào Database và bắn Message Queue (Kafka/RabbitMQ) đồng thời mà không bị thất thoát message.`,
      coverImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      readingTime: 7,
      metaTitle: "Kiến Trúc Microservices vs Monolith Thực Chiến | DevCraft",
      metaDescription: "Kinh nghiệm phân tách kiến trúc hệ thống chịu tải lớn từ Solution Architect.",
      publishedAt: new Date(),
    },
  });

  // 13F. Electronics Blog Post
  const blogPostElectronics = await prisma.blogPost.create({
    data: {
      authorId: instructorElectronics.id,
      categoryId: catElecPCB.id,
      title: "Bí Quyết Thiết Kế PCB Tốc Độ Cao: Kiểm Soát Trở Kháng Đường Truyền Và Khử Nhiễu EMI/EMC",
      slug: "bi-quyet-thiet-ke-pcb-toc-do-cao-emi-emc",
      summary: "Quy tắc định tuyến tín hiệu vi sai (Differential Pairs), thiết kế lớp Reference Plane liên tục và mẹo vượt qua bài test tương thích điện từ EMC.",
      content: `## 1. Bản Chất Của Tín Hiệu Tốc Độ Cao (High-Speed Signals)

Trong thiết kế điện tử, một tín hiệu được coi là "tốc độ cao" không chỉ dựa vào tần số xung nhịp (Clock frequency) mà phụ thuộc chủ yếu vào **thời gian tăng trưởng sườn nến (Rise Time)**. Khi thời gian truyền dẫn (Propagation delay) trên đường mạch lớn hơn 1/6 thời gian tăng trưởng sườn xung, đường mạch bắt đầu hoạt động như một **đường truyền sóng (Transmission Line)**.

### ⚡ Các Hiện Tượng Vật Lý Cần Kiểm Soát:
* **Phản xạ tín hiệu (Signal Reflection):** Xảy ra khi trở kháng nguồn, đường truyền và tải không khớp nhau (Impedance Mismatch).
* **Nhiễu xuyên âm (Crosstalk):** Hiện tượng cảm ứng điện từ giữa hai đường mạch đặt quá sát nhau (áp dụng quy tắc 3W rule).
* **Độ trễ pha đường vi sai (Skew):** Khi hai nhánh của cặp vi sai không bằng nhau về chiều dài, chuyển đổi tín hiệu chế độ vi sai sang chế độ chung (Common-mode), phát xạ nhiễu EMI mạnh.

## 2. Nguyên Tắc Vàng Khi Thiết Kế Mặt Phẳng Nối Đất (Ground Reference Plane)
1. **Không bao giờ đi dây cắt ngang khe hở mặt phẳng đất (No Split Planes):** Dòng điện hồi tiếp tần số cao luôn chạy ngay bên dưới đường mạch tín hiệu. Cắt mặt đất sẽ tạo ra vòng lặp lớn phát xạ sóng điện từ.
2. **Bố trí tụ thoát nhiễu (Decoupling Capacitors) sát chân IC:** Đặt tụ trị số nhỏ (0.1uF, 0.01uF) gần nhất có thể, sử dụng Via có khoảng cách tối thiểu để giảm điện cảm ký sinh (Parasitic Inductance).
3. **Quy tắc Stitching Vias:** Bố trí hàng Via tiếp địa xung quanh mép bo mạch và dọc theo các đường tín hiệu nhạy cảm để tạo lồng chắn Faraday.`,
      coverImageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      readingTime: 6,
      metaTitle: "Bí Quyết Thiết Kế PCB Tốc Độ Cao & Khử Nhiễu EMC | CircuitMaster",
      metaDescription: "Kỹ thuật Layout bo mạch nhiều lớp và kiểm soát trở kháng đường truyền chuẩn IPC.",
      publishedAt: new Date(),
    },
  });

  // 13G. Mechanical Blog Post
  const blogPostMechanical = await prisma.blogPost.create({
    data: {
      authorId: instructorMechanical.id,
      categoryId: catMechCAD.id,
      title: "Quy Trình Thiết Kế Cơ Cấu Chấp Hành Cho Robot Công Nghiệp: Từ Tính Toán Tải Trọng Đến Bản Vẽ Chế Tạo",
      slug: "quy-trinh-thiet-ke-co-cau-robot-cong-nghiep",
      summary: "Phương pháp chọn động cơ Servo dựa trên momen quán tính (Inertia ratio), thiết kế truyền động dây đai răng và xuất bản vẽ dung sai GD&T.",
      content: `## 1. Sai Lầm Phổ Biến Khi Chọn Động Cơ Servo Cho Cơ Cấu Máy

Nhiều kỹ sư cơ khí mới ra trường chỉ tính toán mô-men tĩnh (Static Torque) dựa trên trọng lượng vật thể mà bỏ qua **Mô-men quán tính (Moment of Inertia - J)**. Khi động cơ cần tăng tốc đột ngột từ 0 lên 3000 vòng/phút trong 0.1 giây, tải quán tính sẽ sinh ra tải phản lực cực lớn.

### 📐 Tỷ Lệ Quán Tính Lý Tưởng (Inertia Ratio):
* Tỷ số quán tính tải / quán tính rotor động cơ ($J_{load} / J_{motor}$) nên nhỏ hơn **5:1** đối với các cơ cấu đòi hỏi độ chính xác cao và đáp ứng động nhanh (Pick & Place).
* Nếu tỷ số vượt quá 10:1, hệ thống điều khiển servo sẽ bị dao động rung lắc (Hunting/Vibration), khó ổn định vị trí dừng.

## 2. Tính Toán Truyền Động Dây Đai Răng (Timing Belt Drive)
* **Chọn bước răng (Pitch):** Với tải nhẹ tốc độ cao, ưu tiên bước GT2 hoặc 3M. Với tải công nghiệp nặng, chọn 5M hoặc HTD 8M.
* **Căng đai chuẩn xác:** Sử dụng cơ cấu tăng đai bằng con lăn lệch tâm hoặc rãnh trượt để kiểm soát độ võng của đai, tránh hiện tượng trượt bước (Tooth jumping).

## 3. Xuất Bản Vẽ Kỹ Thuật Dung Sai Hình Học (GD&T)
Một thiết kế 3D hoàn hảo sẽ trở nên vô nghĩa nếu bản vẽ 2D xuất xưởng không chỉ định đúng dung sai:
* **Độ đồng tâm (Concentricity) & Độ đảo (Runout):** Cực kỳ quan trọng cho các trục lắp ổ bi quay tốc độ cao để tránh phá hủy vòng bi sớm.
* **Độ vuông góc (Perpendicularity):** Áp dụng cho các mặt bích lắp ghép ray trượt dẫn hướng tuyến tính nhằm hạn chế kẹt bi khi chuyển động.`,
      coverImageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
      status: "PUBLISHED",
      isFeatured: true,
      readingTime: 6,
      metaTitle: "Quy Trình Thiết Kế Cơ Cấu Robot Công Nghiệp | MechDesign",
      metaDescription: "Kinh nghiệm tính toán momen quán tính và xuất bản vẽ dung sai GD&T chế tạo máy.",
      publishedAt: new Date(),
    },
  });

  console.log("✅ Blog posts created for Trading, IELTS, Baking, Fitness, IT, Electronics, and Mechanical niches");

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
