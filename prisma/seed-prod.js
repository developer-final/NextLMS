const fs = require("fs");
const path = require("path");

// Automatically load environment files if DATABASE_URL is not yet defined in process.env
if (!process.env.DATABASE_URL) {
  try {
    const envFiles = [".env.production.local", ".env.development.local", ".env"];
    for (const file of envFiles) {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf8");
        content.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        if (process.env.DATABASE_URL) break;
      }
    }
  } catch {
    // Proceed if file cannot be read
  }
}

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Generate a random, human-readable referral code (e.g., REF-9X4K2A)
 */
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    randomStr += chars[randomIndex];
  }
  return `REF-${randomStr}`;
}

async function main() {
  console.log("================================================================");
  console.log(" 🛡️  STARTING PRODUCTION SAFE SEED (NON-DESTRUCTIVE / IDEMPOTENT)");
  console.log("================================================================\n");

  // 1. UPSERT SYSTEM SETTINGS (INCLUDING NEW AFFILIATE SETTINGS)
  console.log("📦 1. Upserting default system and affiliate settings...");
  const systemSettings = [
    // --- AFFILIATE SYSTEM ---
    {
      key: "affiliateEnabled",
      value: "true",
      group: "AFFILIATE",
      description: "Enable or disable the affiliate and referral system",
    },
    {
      key: "affiliateCommissionPercent",
      value: "20",
      group: "AFFILIATE",
      description: "Default commission percentage for affiliates (e.g. 20%)",
    },
    {
      key: "affiliateCookieDays",
      value: "30",
      group: "AFFILIATE",
      description: "Attribution window duration in days for referral cookie",
    },
    {
      key: "affiliateHoldDays",
      value: "7",
      group: "AFFILIATE",
      description: "Holding period in days before commission becomes approved",
    },
    {
      key: "affiliateMinPayout",
      value: "200000",
      group: "AFFILIATE",
      description: "Minimum balance threshold in VND required to request payout",
    },

    // --- GENERAL SETTINGS ---
    {
      key: "appName",
      value: "World Trading Lab",
      group: "GENERAL",
      description: "Platform brand name",
    },
    {
      key: "appSlogan",
      value: "Nền tảng Học viện & Đào tạo Giao dịch Thực chiến",
      group: "GENERAL",
      description: "Brand tagline / slogan",
    },
    {
      key: "appDescription",
      value: "World Trading Lab là học viện đào tạo giao dịch tài chính, ngoại hối và tiền mã hóa chuyên nghiệp.",
      group: "GENERAL",
      description: "SEO and site meta description",
    },

    // --- CONTACT SETTINGS ---
    {
      key: "supportEmail",
      value: "support@worldtradinglab.com",
      group: "CONTACT",
      description: "Customer support email",
    },
    {
      key: "supportHotline",
      value: "0988.888.888",
      group: "CONTACT",
      description: "Customer support hotline / phone",
    },
    {
      key: "zaloUrl",
      value: "https://zalo.me/0988888888",
      group: "CONTACT",
      description: "Zalo official account or group link",
    },
    {
      key: "telegramUrl",
      value: "https://t.me/trading_world_support",
      group: "CONTACT",
      description: "Telegram official support channel",
    },
    {
      key: "facebookUrl",
      value: "https://facebook.com/worldtradinglab",
      group: "CONTACT",
      description: "Official Facebook fanpage",
    },

    // --- PAYMENT SETTINGS ---
    {
      key: "bankId",
      value: "MB",
      group: "PAYMENT",
      description: "VietinBank / MB Bank banking identifier for VietQR",
    },
    {
      key: "bankName",
      value: "MB Bank (Ngân hàng Quân Đội)",
      group: "PAYMENT",
      description: "Beneficiary bank name",
    },
    {
      key: "bankAccountNo",
      value: "0988888888",
      group: "PAYMENT",
      description: "Beneficiary bank account number",
    },
    {
      key: "bankAccountName",
      value: "WORLD TRADING LAB",
      group: "PAYMENT",
      description: "Beneficiary bank account owner name",
    },
    {
      key: "vietqrTemplate",
      value: "compact2",
      group: "PAYMENT",
      description: "VietQR display template layout",
    },
    {
      key: "paymentManualEnabled",
      value: "true",
      group: "PAYMENT",
      description: "Enable manual bank transfer payment method",
    },
    {
      key: "paymentVietqrAutoEnabled",
      value: "true",
      group: "PAYMENT",
      description: "Enable automated VietQR payment method",
    },
    {
      key: "paymentVietqrProvider",
      value: "PAYOS",
      group: "PAYMENT",
      description: "Automated payment provider (PAYOS / SEPAY)",
    },
    {
      key: "paymentPaypalEnabled",
      value: "true",
      group: "PAYMENT",
      description: "Enable PayPal checkout for international students",
    },
    {
      key: "paypalMode",
      value: "sandbox",
      group: "PAYMENT",
      description: "PayPal execution mode (sandbox or live)",
    },
    {
      key: "paymentStripeEnabled",
      value: "false",
      group: "PAYMENT",
      description: "Enable Stripe credit card gateway",
    },
    {
      key: "paymentCryptoEnabled",
      value: "true",
      group: "PAYMENT",
      description: "Enable manual USDT crypto payment method",
    },
    {
      key: "usdExchangeRate",
      value: "25400",
      group: "PAYMENT",
      description: "Exchange rate for USD/VND conversions",
    },

    // --- POLICY SETTINGS ---
    {
      key: "refundDays",
      value: "7",
      group: "POLICY",
      description: "Refund guarantee period in days",
    },
    {
      key: "refundMaxProgress",
      value: "30",
      group: "POLICY",
      description: "Maximum course completion percentage eligible for refund",
    },

    // --- HERO STATS ---
    {
      key: "statsStudentCount",
      value: "5,000+",
      group: "HERO",
      description: "Total active students display count",
    },
    {
      key: "statsSatisfactionRate",
      value: "98.6%",
      group: "HERO",
      description: "Student satisfaction rating percentage",
    },
    {
      key: "statsPracticalRate",
      value: "100%",
      group: "HERO",
      description: "Practical curriculum focus rate",
    },
    {
      key: "statsSupportHours",
      value: "24/7",
      group: "HERO",
      description: "Support availability hours",
    },
  ];

  let insertedSettingsCount = 0;
  for (const s of systemSettings) {
    const existing = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await prisma.setting.create({ data: s });
      insertedSettingsCount++;
    }
  }
  console.log(`   ✅ System Settings: Verified ${systemSettings.length} keys (${insertedSettingsCount} newly initialized, ${systemSettings.length - insertedSettingsCount} preserved).`);

  // 2. UPSERT STANDARD CATEGORIES (NON-DESTRUCTIVE)
  console.log("\n📁 2. Upserting standard course categories...");
  const standardCategories = [
    {
      slug: "tai-chinh-dau-tu",
      name: "Tài Chính & Đầu Tư",
      description: "Phân tích kỹ thuật SMC, Price Action, quản trị rủi ro và đầu tư chứng khoán, phái sinh.",
      icon: "TrendingUp",
      orderIndex: 1,
    },
    {
      slug: "ngoai-ngu-ielts",
      name: "Ngoại Ngữ & IELTS",
      description: "Luyện thi IELTS Academic & General, tiếng Anh giao tiếp và phản xạ thương mại quốc tế.",
      icon: "Languages",
      orderIndex: 2,
    },
    {
      slug: "cong-nghe-thong-tin",
      name: "Công Nghệ Thông Tin",
      description: "Lập trình Web Full-stack, phát triển Cloud Architecture, DevOps và ứng dụng thực tế.",
      icon: "Code2",
      orderIndex: 3,
    },
    {
      slug: "ky-thuat-dien-tu",
      name: "Kỹ Thuật & Điện Tử",
      description: "Thiết kế vi mạch, lập trình nhúng IoT, phân tích bo mạch cao tần và phần cứng.",
      icon: "Cpu",
      orderIndex: 4,
    },
    {
      slug: "co-khi-che-tao",
      name: "Cơ Khí & Tự Động Hóa",
      description: "Thiết kế máy 3D CAD/CAM, mô phỏng động lực học và vận hành dây chuyền sản xuất.",
      icon: "Wrench",
      orderIndex: 5,
    },
    {
      slug: "am-thuc-lam-banh",
      name: "Ẩm Thực & Làm Bánh",
      description: "Kỹ thuật làm bánh Âu, Sourdough men tự nhiên và quản trị kinh doanh tiệm bánh.",
      icon: "Utensils",
      orderIndex: 6,
    },
    {
      slug: "the-hinh-suc-khoe",
      name: "Thể Hình & Sức Khỏe",
      description: "Khoa học dinh dưỡng, giải phẫu vận động và giáo trình tập luyện thể hình chuẩn quốc tế.",
      icon: "Activity",
      orderIndex: 7,
    },
  ];

  let insertedCategoriesCount = 0;
  for (const cat of standardCategories) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!existing) {
      await prisma.category.create({ data: cat });
      insertedCategoriesCount++;
    }
  }
  console.log(`   ✅ Categories: Verified ${standardCategories.length} categories (${insertedCategoriesCount} created, ${standardCategories.length - insertedCategoriesCount} already existed).`);

  // 3. BACKFILL REFERRAL CODES FOR EXISTING USERS
  console.log("\n🔗 3. Checking and backfilling referral codes for users...");
  const usersWithoutRefCode = await prisma.user.findMany({
    where: { referralCode: null },
    select: { id: true, email: true },
  });

  if (usersWithoutRefCode.length > 0) {
    console.log(`   Found ${usersWithoutRefCode.length} user(s) without referral codes. Generating unique codes...`);
    let updatedCount = 0;

    for (const u of usersWithoutRefCode) {
      let code = generateReferralCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const existing = await prisma.user.findUnique({ where: { referralCode: code } });
        if (!existing) {
          isUnique = true;
        } else {
          code = generateReferralCode();
          attempts++;
        }
      }

      await prisma.user.update({
        where: { id: u.id },
        data: { referralCode: code },
      });
      updatedCount++;
    }
    console.log(`   ✅ Backfilled referral codes for ${updatedCount} user(s).`);
  } else {
    console.log("   ✅ All existing users already have valid referral codes.");
  }

  // 4. ENSURE AT LEAST ONE ADMIN ACCOUNT EXISTS
  console.log("\n👑 4. Checking system administrative accounts...");
  const adminCount = await prisma.user.count({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
  });

  if (adminCount === 0) {
    console.log("   ⚠️  No administrative account detected in database.");
    console.log("   Creating initial root Super Admin account...");

    const defaultAdminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@worldtradinglab.com";
    const defaultAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin@2026";
    const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);
    const adminRefCode = "REF-ADMIN";

    const createdAdmin = await prisma.user.create({
      data: {
        name: "Quản Trị Viên Hệ Thống",
        email: defaultAdminEmail,
        passwordHash,
        role: "ADMIN",
        referralCode: adminRefCode,
        headline: "Nhà sáng lập & Quản trị Hệ thống World Trading Lab",
        bio: "Tài khoản quản trị viên tối cao khởi tạo cho hệ thống e-Learning.",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      },
    });

    console.log("   🎉 Root Admin created successfully:");
    console.log(`      - Email:    ${createdAdmin.email}`);
    console.log(`      - Password: ${defaultAdminPassword}`);
    console.log(`      - Ref Code: ${createdAdmin.referralCode}`);
    console.log("   ⚠️  IMPORTANT: Please change this password immediately upon initial login!");
  } else {
    console.log(`   ✅ Administrative accounts verified (${adminCount} admin(s) exist).`);
  }

  console.log("\n================================================================");
  console.log(" 🚀 PRODUCTION SAFE SEED COMPLETED SUCCESSFULLY!");
  console.log(" Database is fully configured for Affiliate & LMS Operations.");
  console.log("================================================================\n");
}

main()
  .catch((err) => {
    console.error("❌ Production Seed Fatal Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
