export type NicheType =
  | "trading"
  | "ielts"
  | "baking"
  | "fitness"
  | "it"
  | "electronics"
  | "mechanical";

export const COOKIE_NICHE_KEY = "demo_niche";
export const COOKIE_BRAND_KEY = "demo_brand";
export const COOKIE_TEACHER_KEY = "demo_teacher";

export const HEADER_NICHE_KEY = "x-demo-niche";
export const HEADER_BRAND_KEY = "x-demo-brand";
export const HEADER_TEACHER_KEY = "x-demo-teacher";

export interface NicheFeature {
  title: string;
  description: string;
}

export interface NicheAboutConfig {
  badge: string;
  titleLine1: string;
  titleHighlight: string;
  description: string;
  values: [NicheFeature, NicheFeature, NicheFeature];
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
}

export interface NicheConfig {
  id: NicheType;
  name: string;
  brandName: string;
  slogan: string;
  description: string;
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroTitleLine2: string;
  heroDescription: string;
  exploreBtnText: string;
  freeTrialBtnText: string;
  categoryHeading: string;
  categorySubheading: string;
  featuredHeading: string;
  whyChooseHeading: string;
  whyChooseSubheading: string;
  stats: {
    studentCount: string;
    studentLabel: string;
    satisfactionRate: string;
    satisfactionLabel: string;
    practicalRate: string;
    practicalLabel: string;
    supportHours: string;
    supportLabel: string;
  };
  features: [NicheFeature, NicheFeature, NicheFeature];
  categorySlugs: string[];
  categoryPageTitle: string;
  categoryPageSubtitle: string;
  blogPageTitle: string;
  blogPageSubtitle: string;
  about: NicheAboutConfig;
}

export const NICHES: Record<NicheType, NicheConfig> = {
  trading: {
    id: "trading",
    name: "Tài chính & Trading",
    brandName: "World Trading Lab",
    slogan: "Học viện Đào tạo Trading Thực chiến",
    description:
      "Nền tảng đào tạo trực tuyến hàng đầu về Giao dịch Tài chính, SMC, Đầu tư Chứng khoán, Crypto và Phân tích Kỹ thuật với hệ thống bài giảng thực chiến.",
    heroBadge: "HỌC VIỆN GIAO DỊCH TÀI CHÍNH THỰC CHIẾN",
    heroTitleLine1: "Làm Chủ Dòng Tiền &",
    heroTitleHighlight: "Giao Dịch Thực Chiến",
    heroTitleLine2: "Chuẩn Quốc Tế",
    heroDescription:
      "Hệ thống đào tạo bài bản từ Smart Money Concepts (SMC), Price Action đến Quản trị Rủi ro và Lập trình Bot tự động hóa.",
    exploreBtnText: "Khám phá Khóa học",
    freeTrialBtnText: "Học thử Miễn phí",
    categoryHeading: "Lộ Trình Học Chuyên Sâu Theo Lĩnh Vực",
    categorySubheading: "Được thiết kế từ cơ bản đến nâng cao cho từng trường phái đầu tư.",
    featuredHeading: "Các Khóa Học Nổi Bật Được Đề Xuất",
    whyChooseHeading: "Vì Sao Hàng Nghìn Trader Lựa Chọn Chúng Tôi?",
    whyChooseSubheading: "Chương trình đào tạo tinh gọn, tập trung vào kết quả và kỷ luật tài chính.",
    stats: {
      studentCount: "10,000+",
      studentLabel: "Học viên tham gia",
      satisfactionRate: "99.4%",
      satisfactionLabel: "Đánh giá 5 sao",
      practicalRate: "100%",
      practicalLabel: "Nội dung thực chiến",
      supportHours: "24/7",
      supportLabel: "Hỏi đáp cùng Chuyên gia",
    },
    features: [
      {
        title: "Video Bài giảng Chuẩn 4K",
        description: "Xem mượt mà trên mọi thiết bị với giao diện tối ưu riêng cho trader.",
      },
      {
        title: "Bảo Mật Nội Dung Bản Quyền",
        description: "Hệ thống bảo vệ bài giảng, chống sao chép và tải lậu video trái phép.",
      },
      {
        title: "Chứng Chỉ Sau Khi Hoàn Thành",
        description: "Chứng nhận hoàn thành khóa học để khẳng định năng lực phân tích thị trường.",
      },
    ],
    categorySlugs: ["smc-price-action", "chung-khoan-viet-nam", "algo-trading-bot"],
    categoryPageTitle: "Chuyên Mục Đào Tạo Giao Dịch & Đầu Tư",
    categoryPageSubtitle: "Hệ thống bài giảng từ Smart Money Concepts, Chứng khoán cơ bản đến Thuật toán Bot MT5.",
    blogPageTitle: "Blog Phân Tích Kỹ Thuật & Cẩm Nang Giao Dịch",
    blogPageSubtitle: "Cập nhật góc nhìn thị trường, chiến lược Price Action và tâm lý giao dịch từ các Senior Trader.",
    about: {
      badge: "Về World Trading Lab",
      titleLine1: "Sứ Mệnh Đào Tạo Thế Hệ",
      titleHighlight: "Nhà Đầu Tư & Chuyên Gia Thực Chiến",
      description:
        "World Trading Lab được thành lập với mục tiêu phổ cập kiến thức tài chính, đầu tư, phân tích kỹ thuật và kỹ năng giao dịch dòng tiền lớn chất lượng cao, giúp học viên làm chủ thị trường và gia tăng giá trị bản thân bền vững.",
      values: [
        {
          title: "100% Thực Chiến",
          description: "Giáo trình không lý thuyết suông, tập trung vào các case study lệnh thực tế trên Forex, Vàng, Chứng khoán và Crypto.",
        },
        {
          title: "Đồng hành 1 - 1",
          description: "Học viên được tham gia nhóm trao đổi riêng, nhận hỗ trợ sửa lỗi phân tích trực tiếp từ đội ngũ chuyên gia.",
        },
        {
          title: "Bảo Mật & Uy Tín",
          description: "Hệ thống học tập bảo mật cao, kích hoạt tức thì qua VietQR và bảo vệ bản quyền giáo trình tuyệt đối.",
        },
      ],
      ctaTitle: "Sẵn sàng nâng tầm kỹ năng giao dịch của bạn?",
      ctaDesc: "Gia nhập cộng đồng hơn 10.000 học viên đang theo học và gặt hái thành công ngay hôm nay.",
      ctaButton: "Khám Phá Khóa Học Ngay",
    },
  },

  ielts: {
    id: "ielts",
    name: "Ngoại ngữ & Luyện thi IELTS",
    brandName: "IELTS Elite Academy",
    slogan: "Học viện Luyện thi IELTS & Tiếng Anh Học thuật",
    description:
      "Nền tảng luyện thi IELTS cá nhân hóa giúp học viên bứt phá band điểm 7.0 - 8.5+ với lộ trình khoa học và kho bài tập chuẩn Cambridge.",
    heroBadge: "LỘ TRÌNH BỨT PHÁ BAND 7.5+ CHUẨN CAMBRIDGE",
    heroTitleLine1: "Chinh Phục IELTS &",
    heroTitleHighlight: "Mở Khóa Tương Lai",
    heroTitleLine2: "Toàn Cầu",
    heroDescription:
      "Phương pháp phản xạ ngôn ngữ tự nhiên, kỹ thuật xử lý Speaking & Writing độc quyền và ngân hàng đề thi cập nhật liên tục.",
    exploreBtnText: "Xem Lộ Trình Học",
    freeTrialBtnText: "Học Thử Miễn Phí",
    categoryHeading: "Lộ Trình Từng Kỹ Năng Nghe - Nói - Đọc - Viết",
    categorySubheading: "Được cá nhân hóa theo trình độ từ Mất gốc đến Mục tiêu 8.0+.",
    featuredHeading: "Các Khóa Luyện Thi IELTS Hàng Đầu",
    whyChooseHeading: "Tại Sao Nên Luyện Thi Cùng Chúng Tôi?",
    whyChooseSubheading: "Cam kết đồng hành từng học viên đến khi đạt band điểm mục tiêu.",
    stats: {
      studentCount: "15,000+",
      studentLabel: "Học viên đạt mục tiêu",
      satisfactionRate: "98.8%",
      satisfactionLabel: "Đạt Band 7.0+ sau 3 tháng",
      practicalRate: "100%",
      practicalLabel: "Giảng viên IELTS 8.5+",
      supportHours: "24/7",
      supportLabel: "Chấm chữa bài Speaking/Writing",
    },
    features: [
      {
        title: "Video Bài Giảng HD Rõ Nét",
        description: "Học mọi lúc mọi nơi trên điện thoại, máy tính bảng với lộ trình bài tập chi tiết.",
      },
      {
        title: "Chống Chia Sẻ Tài Khoản Lậu",
        description: "Hệ thống xác thực bảo mật giữ độc quyền giáo trình của thầy cô.",
      },
      {
        title: "Chứng Nhận Hoàn Thành Khóa Học",
        description: "Ghi nhận tiến độ và cấp chứng chỉ số định danh cho từng học viên.",
      },
    ],
    categorySlugs: ["ielts-mastery", "ielts-speaking-writing"],
    categoryPageTitle: "Các Kỹ Năng & Lộ Trình Luyện Thi IELTS",
    categoryPageSubtitle: "Chuyên sâu 4 kỹ năng Nghe, Nói, Đọc, Viết với giáo trình chuẩn Cambridge cập nhật theo quý.",
    blogPageTitle: "Cẩm Nang Luyện Thi & Chiến Thuật Bứt Phá Band IELTS",
    blogPageSubtitle: "Tổng hợp mẹo làm bài Writing Task 2, bộ đề Speaking Forecast và phương pháp phát âm chuẩn bản xứ.",
    about: {
      badge: "Về IELTS Elite Academy",
      titleLine1: "Sứ Mệnh Đồng Hành Cùng",
      titleHighlight: "Thế Hệ Trẻ Vươn Ra Thế Giới",
      description:
        "IELTS Elite Academy được xây dựng bởi đội ngũ giảng viên IELTS 8.5+ với sứ mệnh phá vỡ rào cản ngôn ngữ, trang bị tư duy phản biện học thuật và giúp hàng chục nghìn học viên Việt Nam hiện thực hóa giấc mơ du học và định cư.",
      values: [
        {
          title: "Giảng Viên 8.5+ Trực Tiếp Dạy",
          description: "100% giáo trình được biên soạn bởi cựu du học sinh Anh/Úc với chứng chỉ giảng dạy quốc tế CELTA.",
        },
        {
          title: "Chấm Chữa Bài Chi Tiết 1 - 1",
          description: "Mỗi bài viết Writing và bản ghi âm Speaking đều được sửa lỗi ngữ pháp, từ vựng và chấm điểm theo 4 tiêu chí chuẩn.",
        },
        {
          title: "Cam Kết Đầu Ra Bằng Hợp Đồng",
          description: "Lộ trình học cá nhân hóa theo năng lực đầu vào, hỗ trợ học lại miễn phí nếu không đạt band điểm mục tiêu.",
        },
      ],
      ctaTitle: "Sẵn sàng bứt phá band điểm IELTS mơ ước?",
      ctaDesc: "Kiểm tra trình độ miễn phí và nhận lộ trình học tối ưu riêng cho bạn ngay hôm nay.",
      ctaButton: "Đăng Ký Nhận Lộ Trình",
    },
  },

  baking: {
    id: "baking",
    name: "Làm bánh & Ẩm thực",
    brandName: "La Crème Pastry Academy",
    slogan: "Học viện Nghệ thuật Bánh Âu & Khởi nghiệp Ẩm thực",
    description:
      "Khóa học làm bánh chuyên nghiệp từ căn bản đến nâng cao: Bánh mì men tự nhiên (Sourdough), Croissant, Entremet và Bánh kem kinh doanh.",
    heroBadge: "BÍ QUYẾT BÁNH ÂU CHUẨN VỊ NƯỚC PHÁP",
    heroTitleLine1: "Nghệ Thuật Làm Bánh &",
    heroTitleHighlight: "Khởi Nghiệp Tiệm Bánh",
    heroTitleLine2: "Thành Công",
    heroDescription:
      "Từng bước nắm vững công thức chuẩn thương mại, kỹ thuật ủ men bí truyền và bí quyết tạo ra những mẻ bánh hoàn hảo ngay tại nhà.",
    exploreBtnText: "Xem Menu Khóa Học",
    freeTrialBtnText: "Xem Công Thức Miễn Phí",
    categoryHeading: "Các Khóa Học Bánh Theo Chuyên Đề",
    categorySubheading: "Tập trung vào công thức kinh doanh thực tế, tiết kiệm nguyên liệu tối đa.",
    featuredHeading: "Khóa Học Bánh Được Đăng Ký Nhiều Nhất",
    whyChooseHeading: "Vì Sao Học Viên Đam Mê Bánh Chọn Chúng Tôi?",
    whyChooseSubheading: "Công thức đã thử nghiệm thành công 100%, tỷ lệ nở chuẩn và hương vị đẳng cấp.",
    stats: {
      studentCount: "8,500+",
      studentLabel: "Thợ bánh tốt nghiệp",
      satisfactionRate: "99.8%",
      satisfactionLabel: "Hài lòng với mẻ bánh đầu tiên",
      practicalRate: "100%",
      practicalLabel: "Công thức chuẩn kinh doanh",
      supportHours: "24/7",
      supportLabel: "Giải đáp thắc mắc men & lò nướng",
    },
    features: [
      {
        title: "Góc Quay Cận Cảnh Thao Tác Tay",
        description: "Video quay chậm từng kỹ thuật nhào bột, tạo hình và bắt kem chi tiết.",
      },
      {
        title: "Bảo Vệ Công Thức Độc Quyền",
        description: "Công thức bí truyền của bếp trưởng không thể bị copy hay phát tán ra ngoài.",
      },
      {
        title: "Thanh Toán Tự Động Vào Lớp Ngay",
        description: "Học viên quét mã VietQR tự động kích hoạt khóa học trong 1 giây.",
      },
    ],
    categorySlugs: ["banh-mi-men-tu-nhien", "nghe-thuat-kem-buttercream"],
    categoryPageTitle: "Các Chuyên Đề Bánh Âu & Bánh Kem Nghệ Thuật",
    categoryPageSubtitle: "Từ kỹ thuật nuôi men tự nhiên Sourdough đến nghệ thuật tạo hình hoa kem bơ chuẩn tiệm bánh cao cấp.",
    blogPageTitle: "Cẩm Nang Nghề Bánh & Bí Quyết Bếp Bánh Châu Âu",
    blogPageSubtitle: "Chia sẻ công thức làm bánh bất bại, mẹo chỉnh nhiệt lò nướng và kinh nghiệm khởi nghiệp tiệm bánh từ Chef.",
    about: {
      badge: "Về La Crème Pastry Academy",
      titleLine1: "Nâng Tầm Nghệ Thuật",
      titleHighlight: "Làm Bánh Thủ Công Đẳng Cấp Pháp",
      description:
        "La Crème Pastry Academy ra đời từ niềm đam mê cháy bỏng với các mẻ bánh mộc mạc chuẩn vị châu Âu. Chúng tôi truyền đạt các kỹ thuật làm bánh men tự nhiên, bánh ngọt hiện đại và bí quyết vận hành tiệm bánh thành công cho hàng nghìn học viên trên khắp cả nước.",
      values: [
        {
          title: "Công Thức Chuẩn Thương Mại",
          description: "100% công thức được cân chỉnh chính xác theo nhiệt độ và độ ẩm Việt Nam, đảm bảo thành công ngay mẻ đầu tiên.",
        },
        {
          title: "Cầm Tay Chỉ Việc Từng Thao Tác",
          description: "Video quay cận cảnh góc nhìn người làm bánh, giải thích cặn kẽ bản chất hóa học của men, bột và bơ.",
        },
        {
          title: "Tư Vấn Setup Tiệm Bánh Miễn Phí",
          description: "Đồng hành hỗ trợ học viên chọn mua lò nướng, thiết bị và tính toán giá cost thành phẩm để kinh doanh sinh lời.",
        },
      ],
      ctaTitle: "Sẵn sàng thắp lửa đam mê làm bánh của bạn?",
      ctaDesc: "Tham gia cùng cộng đồng hơn 8.500 thợ bánh và bắt đầu mẻ bánh thơm ngon đầu tiên ngay hôm nay.",
      ctaButton: "Xem Menu Khóa Học",
    },
  },

  fitness: {
    id: "fitness",
    name: "Thể hình & Sức khỏe",
    brandName: "IronPulse Fitness Academy",
    slogan: "Học viện Huấn luyện Thể hình & Dinh dưỡng Chuẩn Khoa học",
    description:
      "Lộ trình siết mỡ tăng cơ và phục hồi thể lực khoa học, kết hợp giáo án tập luyện chi tiết cùng thực đơn dinh dưỡng cho người bận rộn.",
    heroBadge: "GIÁO ÁN SIẾT MỠ TĂNG CƠ CHUẨN KHOA HỌC",
    heroTitleLine1: "Kiến Tạo Vóc Dáng &",
    heroTitleHighlight: "Bứt Phá Thể Lực",
    heroTitleLine2: "Vượt Giới Hạn",
    heroDescription:
      "Không cần nhịn ăn cực đoan hay tập luyện quá sức. Làm chủ phương pháp tập luyện thông minh và chế độ ăn uống khoa học ngay hôm nay.",
    exploreBtnText: "Khám Phá Giáo Án",
    freeTrialBtnText: "Tập Thử 7 Ngày Miễn Phí",
    categoryHeading: "Giáo Án Rèn Luyện Chuyên Sâu",
    categorySubheading: "Được thiết kế linh hoạt cho cả người tập tại nhà và phòng Gym chuyên nghiệp.",
    featuredHeading: "Các Khóa Rèn Luyện Được Yêu Thích",
    whyChooseHeading: "Tại Sao Hàng Nghìn Học Viên Đạt Được Vóc Dáng Mơ Ước?",
    whyChooseSubheading: "Phương pháp dựa trên sinh lý học và kiểm chứng thực tế từ hàng nghìn học viên.",
    stats: {
      studentCount: "12,000+",
      studentLabel: "Học viên chuyển đổi hình thể",
      satisfactionRate: "99.1%",
      satisfactionLabel: "Cải thiện vóc dáng sau 4 tuần",
      practicalRate: "100%",
      practicalLabel: "Giáo án chuẩn khoa học",
      supportHours: "24/7",
      supportLabel: "HLV theo dõi tiến độ mỗi tuần",
    },
    features: [
      {
        title: "Video Hướng Dẫn Kỹ Thuật Động Tác",
        description: "Góc quay chuẩn giúp bạn tập đúng form, tránh chấn thương khớp và cột sống.",
      },
      {
        title: "Lộ Trình Theo Ngày Rõ Ràng",
        description: "Hệ thống tự động lưu vết buổi tập và nhắc nhở kỷ luật mỗi ngày.",
      },
      {
        title: "Tương Thích Mọi Thiết Bị",
        description: "Mang điện thoại vào phòng tập và mở video bài tập bất cứ khi nào bạn muốn.",
      },
    ],
    categorySlugs: ["giam-mo-tang-co", "yoga-tri-lieu"],
    categoryPageTitle: "Giáo Án Thể Hình & Trị Liệu Phục Hồi",
    categoryPageSubtitle: "Các chương trình huấn luyện từ giảm mỡ tăng cơ gym/home đến yoga trị liệu cột sống cổ vai gáy.",
    blogPageTitle: "Kiến Thức Thể Hình & Dinh Dưỡng Thể Thao Chuẩn Khoa Học",
    blogPageSubtitle: "Chia sẻ phương pháp tính calo thâm hụt, kỹ thuật tập đúng form và các bài tập giải tỏa đau mỏi cột sống.",
    about: {
      badge: "Về IronPulse Fitness",
      titleLine1: "Kiến Tạo Lối Sống Khỏe Mạnh &",
      titleHighlight: "Chuyển Đổi Vóc Dáng Bền Vững",
      description:
        "IronPulse Fitness ra đời với triết lý: Tập luyện là để tận hưởng cuộc sống, không phải sự đày đọa. Chúng tôi cung cấp các chương trình huấn luyện thể hình và phục hồi dựa trên nền tảng khoa học sinh học, giúp bạn sở hữu vóc dáng săn chắc và năng lượng tràn đầy.",
      values: [
        {
          title: "Khoa Học Về Chuyển Hóa Cơ Thể",
          description: "Nói không với các phương pháp giảm cân cực đoan, tập trung vào nguyên lý thâm hụt calo và rèn luyện cơ bắp tự nhiên.",
        },
        {
          title: "Chuẩn Form Tránh Chấn Thương",
          description: "Mỗi bài tập đều có video phân tích chi tiết đường đi của khớp xương và cơ bắp để bảo vệ cột sống an toàn tuyệt đối.",
        },
        {
          title: "Thực Đơn Dinh Dưỡng Linh Hoạt",
          description: "Giáo án ăn uống được thiết kế phù hợp với món ăn gia đình Việt, không bắt buộc ăn đồ đắt đỏ khó kiếm.",
        },
      ],
      ctaTitle: "Sẵn sàng thay đổi hình thể và sức khỏe của bạn?",
      ctaDesc: "Bắt đầu ngay hôm nay với giáo án thử thách 7 ngày hoàn toàn miễn phí.",
      ctaButton: "Bắt Đầu Tập Luyện Ngay",
    },
  },

  it: {
    id: "it",
    name: "Công nghệ thông tin & Lập trình",
    brandName: "DevCraft Tech Academy",
    slogan: "Học viện Đào tạo Kỹ sư Phần mềm & Điện toán Đám mây",
    description:
      "Nền tảng đào tạo lập trình thực chiến từ Kiến trúc phần mềm, Cloud-Native, Fullstack Web hiện đại đến Trí tuệ nhân tạo và Kỹ thuật dữ liệu.",
    heroBadge: "LỘ TRÌNH KỸ SƯ PHẦN MỀM & CLOUD CHUYÊN SÂU",
    heroTitleLine1: "Làm Chủ Mã Nguồn &",
    heroTitleHighlight: "Kiến Trúc Phần Mềm",
    heroTitleLine2: "Chuẩn Quốc Tế",
    heroDescription:
      "Học trực tiếp cùng Tech Lead: Lập trình Fullstack Next.js, Golang, Microservices, CI/CD và triển khai thực tế trên hạ tầng AWS/Kubernetes.",
    exploreBtnText: "Khám Phá Khóa Lập Trình",
    freeTrialBtnText: "Học Thử Miễn Phí",
    categoryHeading: "Lộ Trình Đào Tạo Theo Chuyên Ngành IT",
    categorySubheading: "Được thiết kế thực chiến bám sát tiêu chuẩn tuyển dụng của các tập đoàn công nghệ.",
    featuredHeading: "Các Khóa Học Lập Trình Được Đăng Ký Nhiều Nhất",
    whyChooseHeading: "Vì Sao Kỹ Sư Phần Mềm Chọn DevCraft?",
    whyChooseSubheading: "Học qua dự án thực tế Production, chuẩn hóa Clean Architecture và tối ưu tải lớn.",
    stats: {
      studentCount: "14,500+",
      studentLabel: "Học viên theo học",
      satisfactionRate: "99.2%",
      satisfactionLabel: "Đánh giá 5 sao từ lập trình viên",
      practicalRate: "100%",
      practicalLabel: "Dự án thực tế Production",
      supportHours: "24/7",
      supportLabel: "Code Review cùng Tech Lead",
    },
    features: [
      {
        title: "Dự Án Thật Triển Khai Production",
        description: "Học viên được cấp cụm Server Cloud thật để thực hành CI/CD và deploy dự án.",
      },
      {
        title: "Code Review 1 - 1 Từng Dòng Lệnh",
        description: "Đội ngũ Senior Engineer chấm bài, tối ưu cấu trúc mã nguồn và kiểm soát bảo mật.",
      },
      {
        title: "Hỗ Trợ Phỏng Vấn & Định Hướng CV",
        description: "Mô phỏng phỏng vấn System Design & Coding Interview chuẩn quy trình Big Tech.",
      },
    ],
    categorySlugs: ["lap-trinh-fullstack-cloud", "ai-machine-learning-data"],
    categoryPageTitle: "Chuyên Mục Đào Tạo Công Nghệ Thông Tin",
    categoryPageSubtitle: "Từ Lập trình Fullstack hiện đại, Microservices đến Ứng dụng Trí tuệ nhân tạo GenAI vào sản phẩm.",
    blogPageTitle: "Blog Kỹ Thuật Phần Mềm & Kiến Trúc Hệ Thống",
    blogPageSubtitle: "Chia sẻ kinh nghiệm thiết kế hệ thống chịu tải cao, tối ưu Database và cập nhật xu hướng công nghệ mới.",
    about: {
      badge: "Về DevCraft Tech Academy",
      titleLine1: "Sứ Mệnh Đào Tạo Thế Hệ",
      titleHighlight: "Kỹ Sư Phần Mềm Đẳng Cấp Quốc Tế",
      description:
        "DevCraft Tech Academy được sáng lập bởi các Kỹ sư Trưởng và Solution Architect giàu kinh nghiệm, với sứ mệnh xóa bỏ khoảng cách giữa giảng đường và thực tế ngành công nghệ phần mềm tại các công ty công nghệ hàng đầu.",
      values: [
        {
          title: "100% Dự Án Thực Tế",
          description: "Không dạy 'Hello World', mọi bài giảng đều giải quyết các bài toán kỹ thuật thực tế như Caching, Message Queue và High Availability.",
        },
        {
          title: "Chuẩn Mực Mã Nguồn Quốc Tế",
          description: "Rèn luyện tư duy Clean Code, Design Patterns, TDD và chuẩn bảo mật OWASP ngay từ ngày đầu tiên.",
        },
        {
          title: "Đồng Hành Cùng Tech Mentor",
          description: "Kênh thảo luận kỹ thuật nội bộ luôn có mentor túc trực giải đáp thắc mắc và chữa lỗi trực tiếp.",
        },
      ],
      ctaTitle: "Sẵn sàng bứt phá sự nghiệp lập trình của bạn?",
      ctaDesc: "Tham gia cộng đồng hơn 14.500 kỹ sư và bắt đầu xây dựng sản phẩm đầu tiên ngay hôm nay.",
      ctaButton: "Khám Phá Khóa Lập Trình Ngay",
    },
  },

  electronics: {
    id: "electronics",
    name: "Thiết kế Phần cứng Điện tử & Hệ thống Nhúng",
    brandName: "CircuitMaster Hardware Lab",
    slogan: "Học viện Thiết kế Bo mạch PCB Tốc độ cao & Vi điều khiển",
    description:
      "Chương trình đào tạo chuyên sâu về thiết kế Schematic, Layout bo mạch PCB đa lớp tốc độ cao, kiểm soát EMI/EMC và lập trình vi điều khiển ARM/ESP32.",
    heroBadge: "ĐÀO TẠO THIẾT KẾ PHẦN CỨNG CHUẨN IPC",
    heroTitleLine1: "Làm Chủ Thiết Kế Bo Mạch &",
    heroTitleHighlight: "Phần Cứng Điện Tử",
    heroTitleLine2: "Thực Chiến",
    heroDescription:
      "Từ nguyên lý mạch điện tử cơ bản đến thiết kế layout PCB 4-8 lớp, xử lý tín hiệu cao tần (DDR, PCIe) trên Altium Designer và lập trình firmware nhúng.",
    exploreBtnText: "Xem Khóa Học Phần Cứng",
    freeTrialBtnText: "Học Thử Miễn Phí",
    categoryHeading: "Các Khóa Học Thiết Kế Điện Tử Theo Chuyên Đề",
    categorySubheading: "Được xây dựng từ tiêu chuẩn công nghiệp IPC và quy trình sản xuất thực tế tại nhà máy.",
    featuredHeading: "Các Khóa Đào Tạo Phần Cứng Được Đăng Ký Nhiều Nhất",
    whyChooseHeading: "Tại Sao Kỹ Sư Phần Cứng Chọn CircuitMaster?",
    whyChooseSubheading: "Giáo trình bám sát tiêu chuẩn nhà máy SMT, tính toán trở kháng và kiểm soát nhiễu thực tế.",
    stats: {
      studentCount: "6,800+",
      studentLabel: "Kỹ sư phần cứng tốt nghiệp",
      satisfactionRate: "99.5%",
      satisfactionLabel: "Tự tay làm bo mạch thành công",
      practicalRate: "100%",
      practicalLabel: "Dự án mạch thật gửi sản xuất",
      supportHours: "24/7",
      supportLabel: "Hỗ trợ review Layout bo mạch",
    },
    features: [
      {
        title: "Thực Hành Layout Bo Mạch Thật",
        description: "Học viên được hướng dẫn gửi file Gerber gia công tại JLCPCB/PCBWay và hàn mạch thực tế.",
      },
      {
        title: "Kiểm Soát Trở Kháng & Tương Thích EMC",
        description: "Phương pháp Stackup nhiều lớp, kiểm soát suy hao tín hiệu vi sai và khử nhiễu điện từ.",
      },
      {
        title: "Thư Viện Linh Kiện Chuẩn Công Nghiệp",
        description: "Cung cấp trọn bộ Footprint và mô hình 3D linh kiện đã kiểm chứng thực tế tại xưởng.",
      },
    ],
    categorySlugs: ["thiet-ke-mach-in-pcb", "lap-trinh-nhung-iot"],
    categoryPageTitle: "Chuyên Mục Thiết Kế Bo Mạch & Hệ Thống Nhúng",
    categoryPageSubtitle: "Nắm vững kỹ năng thiết kế phần cứng từ Schematic, PCB Routing đến lập trình Firmware IoT.",
    blogPageTitle: "Cẩm Nang Kỹ Thuật Phần Cứng & Thiết Kế Điện Tử",
    blogPageSubtitle: "Chia sẻ kinh nghiệm thiết kế Layout chống nhiễu, mẹo chọn linh kiện và phân tích lỗi phần cứng thực tế.",
    about: {
      badge: "Về CircuitMaster Hardware Lab",
      titleLine1: "Đào Tạo Chuyên Sâu Ngành",
      titleHighlight: "Thiết Kế Phần Cứng & Vi Mạch Điện Tử",
      description:
        "CircuitMaster Hardware Lab được thành lập bởi nhóm kỹ sư R&D phần cứng với hơn 15 năm kinh nghiệm thiết kế các thiết bị viễn thông, ô tô và IoT tiêu chuẩn quốc tế, giúp kỹ sư Việt Nam tự tin thiết kế các bo mạch phức tạp.",
      values: [
        {
          title: "Chuẩn Công Nghiệp IPC",
          description: "Mọi quy tắc đi dây, chọn khoảng cách cách điện (Clearance/Creepage) đều tuân thủ nghiêm ngặt tiêu chuẩn IPC-2221.",
        },
        {
          title: "Sản Phẩm Mạch Chạy Thật",
          description: "Học viên không chỉ vẽ mạch trên máy tính mà còn trực tiếp đo kiểm tín hiệu bằng máy hiện sóng oscilloscope.",
        },
        {
          title: "Tư Duy Tối Ưu Chi Phí DFM/DFA",
          description: "Dạy kỹ năng thiết kế bo mạch tối ưu cho dây chuyền dán linh kiện tự động SMT giúp tiết kiệm chi phí sản xuất hàng loạt.",
        },
      ],
      ctaTitle: "Sẵn sàng chế tạo sản phẩm phần cứng đầu tiên của bạn?",
      ctaDesc: "Tham gia cùng hơn 6.800 kỹ sư phần cứng và đưa thiết kế của bạn vào sản xuất thực tế.",
      ctaButton: "Bắt Đầu Học Thiết Kế Bo Mạch",
    },
  },

  mechanical: {
    id: "mechanical",
    name: "Thiết kế Cơ khí & Cơ điện tử",
    brandName: "MechDesign Pro Academy",
    slogan: "Học viện Thiết kế Máy 3D CAD/CAM & Mô phỏng Cơ học CAE",
    description:
      "Chương trình đào tạo toàn diện về thiết kế mô hình 3D SolidWorks, xuất bản vẽ kỹ thuật gia công GD&T, mô phỏng lực tĩnh/động học và lập trình gia công CNC.",
    heroBadge: "THIẾT KẾ CƠ KHÍ & MÔ PHỎNG MÁY CHUYÊN NGHIỆP",
    heroTitleLine1: "Hiện Thực Hóa Ý Tưởng Máy &",
    heroTitleHighlight: "Thiết Kế Cơ Khí 3D",
    heroTitleLine2: "Chuẩn Công Nghiệp",
    heroDescription:
      "Làm chủ phần mềm SolidWorks, Inventor và ANSYS: Từ tính toán dung sai lắp ghép, thiết kế cơ cấu máy tự động hóa đến mô phỏng độ bền chi tiết.",
    exploreBtnText: "Xem Khóa Học Cơ Khí",
    freeTrialBtnText: "Học Thử Bản Vẽ 3D",
    categoryHeading: "Lộ Trình Đào Tạo Cơ Khí Chuyên Sâu",
    categorySubheading: "Được thiết kế từ bài toán gia công cơ khí thực tế tại xưởng chế tạo máy và dây chuyền tự động.",
    featuredHeading: "Các Khóa Học Thiết Kế Cơ Khí Hàng Đầu",
    whyChooseHeading: "Vì Sao Kỹ Sư Cơ Khí Lựa Chọn MechDesign?",
    whyChooseSubheading: "Giáo trình chú trọng tư duy chế tạo thực tế, tính toán dung sai chuẩn xưởng gia công.",
    stats: {
      studentCount: "9,200+",
      studentLabel: "Học viên kỹ thuật cơ khí",
      satisfactionRate: "99.4%",
      satisfactionLabel: "Đánh giá xuất sắc từ doanh nghiệp",
      practicalRate: "100%",
      practicalLabel: "Mô hình máy thực tế chế tạo",
      supportHours: "24/7",
      supportLabel: "Chữa bài vẽ & hướng dẫn đồ án",
    },
    features: [
      {
        title: "Bản Vẽ Chuẩn Dung Sai GD&T",
        description: "Học cách xuất bản vẽ gia công 2D chuẩn quốc tế, giúp thợ tiện phay CNC hiểu và gia công chính xác.",
      },
      {
        title: "Mô Phỏng Ứng Suất & Động Học",
        description: "Kiểm tra độ võng, biến dạng và va chạm cơ cấu máy trước khi đưa vào sản xuất phôi thật.",
      },
      {
        title: "Thư Viện Cụm Cơ Cấu Tiêu Chuẩn",
        description: "Cung cấp kho 3D động cơ servo, xylanh khí nén, ray trượt bi MISUMI sẵn sàng lắp ráp.",
      },
    ],
    categorySlugs: ["thiet-ke-cad-solidworks", "mo-phong-co-hoc-cae"],
    categoryPageTitle: "Chuyên Mục Đào Tạo Thiết Kế Máy & Mô Phỏng Cơ Học",
    categoryPageSubtitle: "Học thiết kế cơ cấu máy tự động hóa, đồ gá JIG và mô phỏng cơ học ứng suất chuyên sâu.",
    blogPageTitle: "Cẩm Nang Thiết Kế Cơ Khí & Cơ Điện Tử Tự Động Hóa",
    blogPageSubtitle: "Chia sẻ kinh nghiệm thiết kế cơ cấu máy, tính chọn động cơ, tính toán dung sai và bí quyết gia công cơ khí chính xác.",
    about: {
      badge: "Về MechDesign Pro Academy",
      titleLine1: "Đào Tạo Kỹ Sư Thiết Kế Máy",
      titleHighlight: "Vững Tư Duy & Giỏi Thực Hành",
      description:
        "MechDesign Pro Academy được sáng lập bởi đội ngũ kỹ sư trưởng thiết kế máy và chế tạo tự động hóa, nhằm đào tạo nguồn nhân lực kỹ thuật cơ khí chất lượng cao, nắm vững cả lý thuyết tính toán lẫn kinh nghiệm xưởng gia công thực tế.",
      values: [
        {
          title: "Tư Duy Thiết Kế Gắn Liền Gia Công",
          description: "Không dựng hình 'ảo', mọi chi tiết được thiết kế đều phải gia công được trên máy CNC, cắt dây hoặc in 3D với chi phí hợp lý.",
        },
        {
          title: "Chuẩn Hóa Dung Sai Lắp Ghép",
          description: "Dạy sâu về chuỗi dung sai hình học GD&T (ISO/ASME), chọn đúng độ nhám bề mặt và phương pháp nhiệt luyện thép.",
        },
        {
          title: "Đồng Hành Cùng Dự Án Máy Thực Tế",
          description: "Học viên được hướng dẫn trực tiếp qua các dự án thiết kế máy đóng gói, băng tải tự động và cánh tay robot công nghiệp.",
        },
      ],
      ctaTitle: "Sẵn sàng làm chủ kỹ năng thiết kế máy 3D chuyên nghiệp?",
      ctaDesc: "Gia nhập cùng hơn 9.200 kỹ sư và sinh viên cơ khí nâng tầm tay nghề thiết kế ngay hôm nay.",
      ctaButton: "Khám Phá Khóa Học Cơ Khí",
    },
  },
};

/**
 * Resolves the active niche configuration with optional custom brand and teacher overrides.
 */
export function resolveNicheConfig(
  nicheId?: string | null,
  brandOverride?: string | null,
  _teacherOverride?: string | null
): NicheConfig {
  const normalizedId = (nicheId?.toLowerCase().trim() || "trading") as NicheType;
  const baseConfig = NICHES[normalizedId] || NICHES.trading;

  if (!brandOverride?.trim()) {
    return baseConfig;
  }

  const customBrand = brandOverride.trim();

  return {
    ...baseConfig,
    brandName: customBrand,
    heroTitleLine1: `Chào Mừng Đến Với ${customBrand} &`,
    about: {
      ...baseConfig.about,
      badge: `Về ${customBrand}`,
      titleLine1: `Sứ Mệnh Của ${customBrand} &`,
      description: `${customBrand} được thành lập với mục tiêu mang đến các chương trình đào tạo chất lượng cao nhất trong lĩnh vực ${baseConfig.name}.`,
    },
  };
}
