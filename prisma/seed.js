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

  console.log("✅ Users created: Admin, Instructor, Student");

  // 2. Create Categories
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

  console.log("✅ Categories created");

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
