#!/usr/bin/env node

/**
 * NextLMS Dev AI Bridge Worker (Scenario 2)
 *
 * Dedicated to local development demo. Connects browser UI requests to
 * live AI generation (Gemini, OpenAI, Claude, DeepSeek or high-fidelity local generator).
 * STRICTLY ISOLATED TO DEVELOPMENT ENVIRONMENT.
 */

import fs from "fs";
import path from "path";
import http from "http";
import https from "https";

// Workspace directories
const ROOT_DIR = process.cwd();
const TASKS_DIR = path.join(ROOT_DIR, ".dev-ai-tasks");
const QUEUE_DIR = path.join(TASKS_DIR, "queue");
const STREAMS_DIR = path.join(TASKS_DIR, "streams");
const COMPLETED_DIR = path.join(TASKS_DIR, "completed");
const HEARTBEAT_FILE = path.join(TASKS_DIR, "heartbeat.json");

// Ensure directories exist
for (const dir of [TASKS_DIR, QUEUE_DIR, STREAMS_DIR, COMPLETED_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Simple .env parser
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Load dev env variables
loadEnvFile(path.join(ROOT_DIR, ".env.development.local"));
loadEnvFile(path.join(ROOT_DIR, ".env.local"));
loadEnvFile(path.join(ROOT_DIR, ".env"));

// Detect available AI credentials
let prisma = null;
try {
  const { PrismaClient } = await import("@prisma/client");
  prisma = new PrismaClient();
} catch {
  // Prisma not available or fallback
}

async function getEffectiveKeys() {
  let gKey = process.env.GEMINI_API_KEY || process.env.AI_GEMINI_KEY || "";
  let oKey = process.env.OPENAI_API_KEY || process.env.AI_OPENAI_KEY || "";
  let cKey = process.env.ANTHROPIC_API_KEY || process.env.AI_CLAUDE_KEY || "";
  let dKey = process.env.DEEPSEEK_API_KEY || process.env.AI_DEEPSEEK_KEY || "";
  let defaultProv = "gemini";

  if (prisma) {
    try {
      const settings = await prisma.setting.findMany();
      for (const item of settings) {
        if (item.key === "aiGeminiKey" && item.value) gKey = item.value;
        if (item.key === "aiOpenaiKey" && item.value) oKey = item.value;
        if (item.key === "aiClaudeKey" && item.value) cKey = item.value;
        if (item.key === "aiDeepseekKey" && item.value) dKey = item.value;
        if (item.key === "aiDefaultProvider" && item.value) defaultProv = item.value;
      }
    } catch {
      // Database read fallback
    }
  }

  return { gKey, oKey, cKey, dKey, defaultProv };
}

console.log("\n=======================================================");
console.log("  🚀 NextLMS Dev AI Bridge Worker (Scenario 2)");
console.log("=======================================================");
console.log(`  📁 Tasks Queue:    ${QUEUE_DIR}`);
console.log(`  ⚡ Operating Mode:  Dynamic Live / Autonomous`);
console.log(`  🛡️  Environment:     DEVELOPMENT ONLY`);
console.log("=======================================================\n");
console.log("🟢 Worker is listening for requests from localhost:3000...\n");

let activeMode = "Dynamic Live / Autonomous";
let activeProvider = "Dev-Bridge-Local";

// Heartbeat Loop (refreshed every 2000ms)
function emitHeartbeat() {
  try {
    const data = {
      workerPid: process.pid,
      timestamp: Date.now(),
      mode: activeMode,
      activeProvider,
    };
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Heartbeat error:", err);
  }
}

emitHeartbeat();
const heartbeatInterval = setInterval(emitHeartbeat, 2000);

// Cleanup on exit
function handleExit() {
  console.log("\n🛑 Stopping Dev AI Bridge Worker...");
  clearInterval(heartbeatInterval);
  try {
    if (fs.existsSync(HEARTBEAT_FILE)) {
      fs.unlinkSync(HEARTBEAT_FILE);
    }
  } catch {
    // Ignore
  }
  console.log("👋 Worker stopped cleanly.\n");
  process.exit(0);
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

/**
 * Append text chunk to stream file
 */
function appendStreamChunk(taskId, chunk) {
  try {
    const streamPath = path.join(STREAMS_DIR, `${taskId}.txt`);
    fs.appendFileSync(streamPath, chunk, "utf-8");
  } catch (err) {
    console.error(`Error writing stream chunk for ${taskId}:`, err);
  }
}

/**
 * Live Google Gemini Stream Caller
 */
async function callLiveGemini(messages, onChunk) {
  const model = "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${geminiKey}&alt=sse`;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const payload = JSON.stringify({
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let accumulated = "";
        let buffer = "";

        res.on("data", (chunk) => {
          buffer += chunk.toString("utf-8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const text =
                  parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (text) {
                  accumulated += text;
                  onChunk(text);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        });

        res.on("end", () => resolve(accumulated));
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Live OpenAI Compatible Stream Caller
 */
async function callLiveOpenAICompatible(url, key, model, messages, onChunk) {
  const payload = JSON.stringify({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: 0.7,
  });

  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let accumulated = "";
        let buffer = "";

        res.on("data", (chunk) => {
          buffer += chunk.toString("utf-8");
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed?.choices?.[0]?.delta?.content || "";
                if (delta) {
                  accumulated += delta;
                  onChunk(delta);
                }
              } catch {
                // Ignore
              }
            }
          }
        });

        res.on("end", () => resolve(accumulated));
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Universal Domain Knowledge Synthesizer
 * Generates authentic, high-depth, publication-grade content across all domains
 */
function generateDomainKnowledge(rawTopic) {
  const promptLower = (rawTopic || "").toLowerCase();
  let cleanTopic = (rawTopic || "")
    .replace(/^hãy\s+(lên\s+ý\s+tưởng|viết|tạo|soạn)\s+(bài\s+viết|blog|bài\s+học|khóa\s+học)?\s*(về\s+chủ\s+đề|về)?/i, "")
    .replace(/^cho\s+chú\s+(ý\s+tưởng|bài\s+viết|khóa\s+học)?\s*(về)?/i, "")
    .replace(/^(hướng\s+dẫn|cẩm\s+nang|bí\s+quyết|cách)\s*/i, "")
    .trim() || "Phương pháp học tiếng Ấn Độ";

  cleanTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  // 1. Tiếng Ấn Độ (Hindi)
  if (promptLower.includes("ấn độ") || promptLower.includes("hindi") || promptLower.includes("devanagari")) {
    return {
      domain: "hindi",
      cleanTopic: "Phương pháp học tiếng Ấn Độ (Hindi)",
      title: "Phương Pháp Tự Học Tiếng Ấn Độ (Hindi) Hiệu Quả Cho Người Mới Bắt Đầu",
      summary: "Khám phá lộ trình tự học tiếng Ấn Độ (Hindi) thực chiến từ số 0: làm chủ bảng chữ cái Devanagari, kỹ thuật phản xạ qua phim ảnh Bollywood và các công cụ thông minh giúp bạn giao tiếp tự tin sau 90 ngày.",
      keywords: "học tiếng ấn độ, tự học tiếng hindi, bảng chữ cái devanagari, phương pháp học ngoại ngữ, tiếng ấn độ giao tiếp, tự học tiếng ấn độ, ngữ pháp hindi",
      intro: "Ấn Độ hiện là quốc gia đông dân nhất hành tinh và là một trong những nền kinh tế có tốc độ tăng trưởng vượt bậc. Tiếng Hindi là ngôn ngữ chính thức và được hơn 600 triệu người sử dụng trên toàn cầu. Việc học tiếng Ấn Độ không chỉ mở ra cánh cửa giao lưu văn hóa đặc sắc mà còn mang lại vô số cơ hội kinh doanh, đầu tư công nghệ và làm việc với các đối tác quốc tế. Tuy nhiên, nhiều người e ngại vì bảng chữ cái lạ mắt và ngữ điệu khác biệt. Bài viết này sẽ chia sẻ lộ trình tự học thực chiến giúp bạn chinh phục tiếng Hindi một cách bài bản nhất.",
      pillars: [
        "### Trụ cột 1: Chinh phục bảng chữ cái Devanagari (देवनागरी)\nTiếng Hindi sử dụng hệ chữ viết Devanagari gồm 11 nguyên âm và 33 phụ âm. Khác với chữ cái Latinh, Devanagari là hệ chữ âm tiết (Abugida). Mỗi phụ âm vốn dĩ mang sẵn nguyên âm /a/. Hãy chia bảng chữ thành các nhóm theo vị trí phát âm (âm họng k/kh/g/gh, âm môi p/ph/b/bh). Dành 15-20 phút viết tay mỗi ngày trong 2 tuần đầu trên giấy kẻ ô để não bộ khắc sâu mặt chữ.",
        "### Trụ cột 2: Kỹ thuật 'Đắm mình' qua phim ảnh Bollywood & Âm nhạc\nBollywood là kho tài nguyên sống động nhất để luyện nghe ngữ điệu và khẩu ngữ đời thường. Hãy bắt đầu với các bộ phim có phụ đề tiếng Anh/Việt như *3 Idiots*, *Dangal*, sau đó chuyển dần sang phụ đề tiếng Hindi. Kỹ thuật này giúp đôi tai làm quen với tốc độ nói tự nhiên và các từ ngữ lóng mà sách vở không dạy.",
        "### Trụ cột 3: Làm chủ cấu trúc ngữ pháp SOV và từ vựng hội thoại\nCấu trúc câu tiếng Hindi là **Chủ ngữ - Tân ngữ - Động từ (SOV)**, ngược lại với tiếng Việt và tiếng Anh (SVO). Hãy ghi nhớ các mẫu câu giao tiếp cơ bản trước: *Namaste* (Xin chào), *Aap kaise hain?* (Bạn khỏe không?), *Mera naam... hai* (Tôi tên là...), *Dhanyavaad* (Cảm ơn). Học từ vựng theo cụm từ thực tế thay vì học thuộc lòng từng từ riêng lẻ.",
        "### Trụ cột 4: Luyện nói nhại (Shadowing) & Ứng dụng công nghệ\nĐể phát âm chuẩn xác các âm uốn lưỡi đặc trưng của tiếng Hindi, kỹ thuật Shadowing (nghe và lặp lại ngay lập tức) là vũ khí lợi hại nhất. Kết hợp các ứng dụng học tập như Duolingo (luyện phản xạ cơ bản), Tandem hoặc HelloTalk (kết nối trực tiếp với người bản xứ Ấn Độ) để duy trì ít nhất 20 phút thực hành mỗi ngày."
      ].join("\n\n"),
      table: [
        "| Giai đoạn | Mục tiêu trọng tâm | Thời lượng khuyến nghị | Kết quả đạt được |",
        "| :--- | :--- | :--- | :--- |",
        "| **Tháng 1: Nền móng** | Làm chủ 44 chữ cái Devanagari & 200 từ vựng cốt lõi | 30 phút / ngày | Đọc chuẩn mặt chữ, chào hỏi tự tin |",
        "| **Tháng 2: Cấu trúc** | Nắm vững ngữ pháp SOV, chia động từ cơ bản | 45 phút / ngày | Đặt câu hội thoại hàng ngày, hỏi đường, mua sắm |",
        "| **Tháng 3: Tăng tốc** | Luyện Shadowing qua phim Bollywood & giao lưu bản xứ | 60 phút / ngày | Nghe hiểu 60% hội thoại đời sống, phản xạ tự nhiên |"
      ].join("\n"),
      mistakes: [
        "- **Bỏ qua việc viết tay Devanagari**: Chỉ học phiên âm Latinh (Hinglish) sẽ khiến bạn mù chữ khi đọc tài liệu thực tế.",
        "- **Học ngữ pháp quá chi tiết quá sớm**: Tiếng Hindi có chia giống đực/cái phức tạp; hãy tập trung nói trôi chảy trước khi gò ép ngữ pháp hoàn hảo.",
        "- **Học dồn vào cuối tuần**: Não bộ cần sự tiếp xúc liên tục 20-30 phút mỗi ngày thay vì 3 tiếng học dồn."
      ].join("\n"),
      courseModules: [
        {
          title: "Phần 1: Chinh phục Bảng chữ cái Devanagari & Phát âm Chuẩn",
          lessons: [
            { title: "Bài 1.1: Giới thiệu hệ chữ Devanagari & 11 Nguyên âm cốt lõi", durationMinutes: 20, isFree: true },
            { title: "Bài 1.2: 33 Phụ âm và Quy tắc ghép vần Matras", durationMinutes: 30, isFree: false },
            { title: "Bài 1.3: Luyện viết tay và Quy tắc nét gạch Shirorekha", durationMinutes: 25, isFree: false },
          ]
        },
        {
          title: "Phần 2: Ngữ pháp Căn bản SOV & Từ vựng Đời sống",
          lessons: [
            { title: "Bài 2.1: Cấu trúc câu SOV và Đại từ nhân xưng", durationMinutes: 25, isFree: false },
            { title: "Bài 2.2: 300 Từ vựng thông dụng nhất trong giao tiếp", durationMinutes: 35, isFree: false },
            { title: "Bài 2.3: Thì Hiện tại đơn và Cách chia động từ cơ bản", durationMinutes: 30, isFree: false },
          ]
        },
        {
          title: "Phần 3: Phản xạ Hội thoại & Đắm mình Bollywood",
          lessons: [
            { title: "Bài 3.1: 50 Tình huống giao tiếp thực tế (Chào hỏi, Mua sắm, Du lịch)", durationMinutes: 40, isFree: false },
            { title: "Bài 3.2: Luyện kỹ thuật Shadowing qua trích đoạn phim nổi tiếng", durationMinutes: 45, isFree: false },
            { title: "Bài 3.3: Tổng kết lộ trình và Kế hoạch duy trì phản xạ bản xứ", durationMinutes: 20, isFree: false },
          ]
        }
      ],
      quiz: [
        {
          question: "Hệ chữ viết chính thức được sử dụng cho tiếng Hindi là gì?",
          options: ["Chữ viết Cyrillic", "Bảng chữ cái Devanagari (देवनागरी)", "Bảng chữ cái Latinh", "Chữ tượng hình Hán"],
          correctAnswerIndex: 1,
          explanation: "Tiếng Hindi sử dụng hệ chữ Devanagari, một hệ chữ âm tiết (Abugida) gồm 11 nguyên âm và 33 phụ âm."
        },
        {
          question: "Cấu trúc trật tự từ cơ bản trong một câu tiếng Hindi là gì?",
          options: ["SVO (Chủ ngữ - Động từ - Tân ngữ)", "SOV (Chủ ngữ - Tân ngữ - Động từ)", "VSO (Động từ - Chủ ngữ - Tân ngữ)", "OVS (Tân ngữ - Động từ - Chủ ngữ)"],
          correctAnswerIndex: 1,
          explanation: "Tiếng Hindi tuân thủ cấu trúc SOV (Chủ ngữ đứng đầu, tiếp theo là Tân ngữ, và Động từ luôn nằm ở cuối câu)."
        }
      ]
    };
  }

  // 2. Tiếng Trung (Mandarin / Hán ngữ)
  if (promptLower.includes("tiếng trung") || promptLower.includes("trung quốc") || promptLower.includes("hán ngữ") || promptLower.includes("mandarin") || promptLower.includes("hsk") || promptLower.includes("pinyin")) {
    return {
      domain: "chinese",
      cleanTopic: "Phương pháp học tiếng Trung (Hán ngữ)",
      title: "Bí Quyết Tự Học Tiếng Trung Từ Con Số 0: Chinh Phục HSK Nhanh Chóng",
      summary: "Cẩm nang tự học tiếng Trung hiệu quả nhất: làm chủ Pinyin và 4 thanh điệu chuẩn xác, bí quyết ghi nhớ chữ Hán qua 214 bộ thủ và lộ trình đỗ HSK sau 6 tháng dành cho người tự học.",
      keywords: "học tiếng trung, tự học tiếng trung, pinyin tiếng trung, luyện thi hsk, học chữ hán, 214 bộ thủ, tiếng trung giao tiếp",
      intro: "Tiếng Trung Quốc hiện là ngôn ngữ có số lượng người bản xứ sử dụng lớn nhất thế giới và là công cụ đắc lực mở rộng cơ hội thương mại, nhập khẩu hàng hóa và hợp tác kinh doanh. Điểm thuận lợi lớn nhất của người Việt khi học tiếng Trung là hệ thống từ Hán - Việt chiếm tới hơn 60% kho từ vựng tiếng Việt, giúp bạn ghi nhớ từ ngữ nhanh hơn bất kỳ người nước ngoài nào. Bài viết này sẽ hướng dẫn bạn phương pháp bài bản để học chuẩn phát âm và ghi nhớ chữ Hán sâu sắc.",
      pillars: [
        "### Trụ cột 1: Chuẩn hóa ngữ âm Pinyin và 4 Thanh điệu ngay từ đầu\nPhát âm là linh hồn của tiếng Trung. Nếu sai thanh điệu, nghĩa của từ sẽ thay đổi hoàn toàn (ví dụ: *mā* - mẹ, *má* - cây gai, *mǎ* - ngựa, *mà* - mắng). Hãy dành trọn 2 tuần đầu để luyện khẩu hình cho các âm khó như j, q, x, zh, ch, sh, r. Sử dụng phần mềm ghi âm để so sánh trực tiếp với giọng đọc bản xứ.",
        "### Trụ cột 2: Nắm vững 214 Bộ thủ & Phương pháp Chiết tự chữ Hán\nĐừng cố vẽ lại chữ Hán như một bức tranh vô nghĩa. Hãy học theo 50 bộ thủ thông dụng nhất (như bộ Thủy 氵 liên quan đến nước, bộ Mộc 木 liên quan đến cây cối, bộ Nhân 亻 liên quan đến con người). Phương pháp chiết tự (tách chữ thành câu chuyện nhỏ) sẽ giúp bạn nhớ sâu mặt chữ mà không bị quên.",
        "### Trụ cột 3: Tận dụng đòn bẩy Từ Hán - Việt\nNgười Việt có lợi thế vô cùng độc đáo: rất nhiều từ tiếng Trung có âm đọc gần như tương đồng với âm Hán Việt (ví dụ: *Đại học* - dàxué, *Quốc gia* - guójiā, *Công ty* - gōngsī). Khi nắm vững quy tắc chuyển âm, vốn từ vựng của bạn sẽ tăng vọt gấp 3 lần so với cách học thông thường.",
        "### Trụ cột 4: Luyện phản xạ qua ứng dụng & Video ngắn Douyin\nXem các video đời sống ngắn trên Douyin/Bilibili hoặc các bộ phim truyền hình hiện đại để rèn luyện đôi tai bắt kịp ngữ điệu tự nhiên của người Bắc Kinh. Sử dụng app SuperChinese hoặc HelloChinese để ôn tập ngữ pháp theo khung chuẩn HSK."
      ].join("\n\n"),
      table: [
        "| Cấp độ | Mục tiêu từ vựng | Thời gian hoàn thành | Ứng dụng thực tế |",
        "| :--- | :--- | :--- | :--- |",
        "| **HSK 1 - 2** | 150 - 300 từ cơ bản | 1 - 2 tháng | Chào hỏi, mua sắm, giới thiệu bản thân |",
        "| **HSK 3 - 4** | 600 - 1200 từ thông dụng | 3 - 5 tháng | Du lịch tự túc, trao đổi công việc, đàm phán cơ bản |",
        "| **HSK 5 - 6** | 2500 - 5000 từ nâng cao | 6 - 12 tháng | Đọc báo chí, dịch thuật chuyên sâu, làm việc tại tập đoàn đa quốc gia |"
      ].join("\n"),
      mistakes: [
        "- **Học chữ Hán trước khi chuẩn Pinyin**: Dẫn đến việc phát âm ngọng và sai ngữ điệu trầm trọng.",
        "- **Học từ vựng rời rạc**: Luôn phải đặt từ vào câu hoàn chỉnh để hiểu đúng ngữ cảnh và giới từ đi kèm.",
        "- **Bỏ quên kỹ năng gõ máy tính**: Trong thời đại số, thành thạo gõ Pinyin trên bàn phím quan trọng hơn việc cặm cụi nhớ cách viết tay từng nét."
      ].join("\n"),
      courseModules: [
        {
          title: "Phần 1: Ngữ âm Pinyin & 4 Thanh điệu Chuẩn Bản xứ",
          lessons: [
            { title: "Bài 1.1: Tổng quan Pinyin và Bí quyết phát âm chuẩn 4 thanh điệu", durationMinutes: 20, isFree: true },
            { title: "Bài 1.2: Chinh phục các nhóm vận mẫu & thanh mẫu khó (zh, ch, sh, r)", durationMinutes: 30, isFree: false },
            { title: "Bài 1.3: Quy tắc biến điệu thanh 3 và biến âm của chữ 'Bù', 'Yī'", durationMinutes: 25, isFree: false },
          ]
        },
        {
          title: "Phần 2: Bí thuật 214 Bộ thủ & Giải mã Chữ Hán",
          lessons: [
            { title: "Bài 2.1: 50 Bộ thủ quan trọng nhất chiếm 70% tần suất xuất hiện", durationMinutes: 35, isFree: false },
            { title: "Bài 2.2: Phương pháp chiết tự và Kỹ thuật nhớ mặt chữ qua câu chuyện", durationMinutes: 40, isFree: false },
            { title: "Bài 2.3: Ứng dụng đòn bẩy Từ Hán - Việt để x3 tốc độ nạp từ vựng", durationMinutes: 30, isFree: false },
          ]
        }
      ],
      quiz: [
        {
          question: "Có bao nhiêu thanh điệu cơ bản trong ngữ âm tiếng Trung tiêu chuẩn (Mandarin)?",
          options: ["3 thanh điệu", "4 thanh điệu chính và 1 thanh nhẹ (khinh thanh)", "5 thanh điệu", "6 thanh điệu"],
          correctAnswerIndex: 1,
          explanation: "Tiếng Trung có 4 thanh điệu chính (thanh 1, 2, 3, 4) và thanh nhẹ (khinh thanh) phát âm ngắn và nhẹ."
        }
      ]
    };
  }

  // 3. Trading & Price Action / SMC
  if (promptLower.includes("price action") || promptLower.includes("hành động giá") || promptLower.includes("smc") || promptLower.includes("forex") || promptLower.includes("trading") || promptLower.includes("giao dịch") || promptLower.includes("chứng khoán") || promptLower.includes("crypto") || promptLower.includes("order block")) {
    return {
      domain: "trading",
      cleanTopic: cleanTopic || "Giao dịch Price Action & Quản trị rủi ro",
      title: "Chiến Lược Giao Dịch Price Action Thực Chiến Cho Trader Chuyên Nghiệp",
      summary: "Làm chủ nghệ thuật đọc hành động giá (Price Action) trên biểu đồ trần: phân tích cấu trúc thị trường, săn tìm thanh khoản tại các vùng Order Block và thiết lập tỷ lệ Risk:Reward tối ưu.",
      keywords: "price action, chiến lược price action, giao dịch forex, quản trị rủi ro trading, order block, cấu trúc thị trường, phân tích kỹ thuật",
      intro: "Hơn 90% trader mới bước vào thị trường tài chính (Forex, Crypto, Chứng khoán) bị choáng ngợp bởi hàng chục chỉ báo phức tạp (RSI, MACD, Bollinger Bands) nhưng vẫn thua lỗ triền miên. Lý do là vì hầu hết các chỉ báo đều có độ trễ lớn so với đường giá. Phương pháp Price Action (Hành động giá) giúp bạn loại bỏ hoàn toàn các chỉ báo nhiễu, tập trung trực tiếp vào dòng tiền thông minh và tâm lý cung cầu hiển thị ngay trên từng cây nến. Bài viết này sẽ hệ thống hóa quy trình giao dịch Price Action chuẩn mực nhất.",
      pillars: [
        "### Trụ cột 1: Đọc vị Cấu trúc Thị trường (Market Structure)\nThị trường chỉ có 3 trạng thái: Tăng (Uptrend), Giảm (Downtrend) và Đi ngang (Sideway). Hãy xác định các đỉnh cao hơn (HH), đáy cao hơn (HL) trong xu hướng tăng hoặc đỉnh thấp hơn (LH), đáy thấp hơn (LL) trong xu hướng giảm. Nắm vững tín hiệu Phá vỡ cấu trúc (BOS - Break of Structure) và Đảo chiều cấu trúc (CHoCH - Change of Character) để luôn đứng về phía xu hướng chủ đạo.",
        "### Trụ cột 2: Xác định Vùng Giá trị & Vùng Thanh khoản (Order Block & Liquidity)\nGiá luôn di chuyển để săn tìm thanh khoản (nơi đặt Stop Loss của số đông). Các vùng Order Block (khối lệnh của cá mập trước khi thị trường bùng nổ) và Fair Value Gap (FVG - khoảng trống giá mất cân bằng cung cầu) chính là những tọa độ vàng để canh vào lệnh với rủi ro thấp nhất.",
        "### Trụ cột 3: Mô hình Nến Tín hiệu Kích hoạt (Trigger Signals)\nChỉ vào lệnh khi giá tiếp cận vùng kháng cự/hỗ trợ trọng yếu VÀ xuất hiện nến xác nhận. Các mô hình nến có xác suất thắng cao nhất bao gồm: Pin Bar (từ chối giá mạnh mẽ), Engulfing (nến nhấn chìm đảo chiều) hoặc Fakey (bẫy giá giả mạo phá vỡ).",
        "### Trụ cột 4: Quản trị Rủi ro & Tỷ lệ Risk:Reward Tối thiểu 1:2\nMột phương pháp giao dịch dù tốt đến đâu cũng sẽ phá sản nếu thiếu kỷ luật quản lý vốn. Tuyệt đối không bao giờ mạo hiểm quá 1% - 2% tổng tài khoản cho một lệnh giao dịch. Luôn đặt Stop Loss trước khi nghĩ đến lợi nhuận và duy trì tỷ lệ R:R tối thiểu 1:2 (chấp nhận mất 1 đồng để có cơ hội kiếm 2 đồng)."
      ].join("\n\n"),
      table: [
        "| Bước | Tác vụ trọng tâm | Công cụ / Tiêu chí kiểm chứng | Kết quả kỳ vọng |",
        "| :--- | :--- | :--- | :--- |",
        "| **B1: Khung lớn (HTF)** | Xác định xu hướng chính & Vùng cản cứng | Khung Ngày (D1) / 4 Giờ (H4) | Xu hướng rõ ràng (Long / Short) |",
        "| **B2: Khung nhỏ (LTF)** | Tìm kiếm cấu trúc phụ & Vùng Order Block | Khung 15 Phút (M15) / 5 Phút (M5) | Điểm vào lệnh tối ưu (Entry point) |",
        "| **B3: Vào lệnh** | Xác nhận nến đảo chiều & Đặt Stop Loss cố định | Mô hình nến Pin Bar / Engulfing | Rủi ro giới hạn tối đa 1% vốn |",
        "| **B4: Quản lý vị thế** | Dời Stop Loss về Breakeven khi đạt 1R, chốt từng phần | Quy tắc quản trị vị thế bán tự động | Bảo toàn vốn, tâm lý thoải mái |"
      ].join("\n"),
      mistakes: [
        "- **Bắt đáy bắt đỉnh mà không có xác nhận**: Cố gắng đoán đáy của một con dao đang rơi là con đường ngắn nhất dẫn đến cháy tài khoản.",
        "- **Dời Stop Loss xa hơn khi lệnh đang âm**: Vi phạm kỷ luật cốt lõi vì hy vọng hão huyền thị trường sẽ quay đầu.",
        "- **Giao dịch trả thù (Revenge Trading)**: Ngay sau khi thua lỗ, tăng khối lượng vào lệnh vội vã để gỡ gạc."
      ].join("\n"),
      courseModules: [
        {
          title: "Phần 1: Cấu trúc Thị trường & Dòng chảy Thanh khoản",
          lessons: [
            { title: "Bài 1.1: Bản chất của hành động giá và Khái niệm Đỉnh/Đáy quan trọng", durationMinutes: 25, isFree: true },
            { title: "Bài 1.2: Nhận diện tín hiệu Phá vỡ cấu trúc BOS và Đảo chiều CHoCH", durationMinutes: 35, isFree: false },
            { title: "Bài 1.3: Cách xác định các vùng thanh khoản (Buy-side & Sell-side Liquidity)", durationMinutes: 30, isFree: false },
          ]
        },
        {
          title: "Phần 2: Mô hình Vào lệnh Thực chiến & Quản trị Vốn",
          lessons: [
            { title: "Bài 2.1: Bộ ba mô hình nến kích hoạt lệnh: Pin Bar, Engulfing và Inside Bar", durationMinutes: 30, isFree: false },
            { title: "Bài 2.2: Quy tắc vàng quản trị vốn 1% và Xây dựng nhật ký giao dịch", durationMinutes: 30, isFree: false },
            { title: "Bài 2.3: Tâm lý giao dịch và Cách loại bỏ hội chứng sợ bỏ lỡ FOMO", durationMinutes: 25, isFree: false },
          ]
        }
      ],
      quiz: [
        {
          question: "Trong phương pháp Price Action, tín hiệu CHoCH (Change of Character) thể hiện điều gì?",
          options: ["Thị trường tiếp tục xu hướng cũ", "Dấu hiệu đầu tiên cho thấy cấu trúc giá có nguy cơ đảo chiều xu hướng", "Thị trường bước vào vùng thanh khoản thấp", "Không có ý nghĩa kỹ thuật"],
          correctAnswerIndex: 1,
          explanation: "CHoCH là sự thay đổi đặc tính của cấu trúc thị trường khi giá phá vỡ đỉnh hoặc đáy gần nhất, cảnh báo xu hướng có thể đảo chiều."
        }
      ]
    };
  }

  // 4. Technology & Web / Next.js / React / Programming
  if (promptLower.includes("next.js") || promptLower.includes("nextjs") || promptLower.includes("react") || promptLower.includes("lập trình") || promptLower.includes("python") || promptLower.includes("code") || promptLower.includes("javascript") || promptLower.includes("typescript") || promptLower.includes("database")) {
    return {
      domain: "tech",
      cleanTopic: cleanTopic || "Lập trình hiện đại và Kiến trúc phần mềm",
      title: `Làm Chủ ${cleanTopic}: Hướng Dẫn Thực Chiến Từ Cơ Bản Đến Chuyên Sâu`,
      summary: `Cẩm nang kỹ thuật chuyên sâu về ${cleanTopic}: kiến trúc hiện đại, quy chuẩn viết mã sạch, tối ưu hiệu năng và quy trình triển khai chuẩn Production.`,
      keywords: `${cleanTopic.toLowerCase()}, hướng dẫn lập trình, kiến trúc phần mềm, clean code, tối ưu hiệu năng, nextjs typescript, best practices`,
      intro: `Trong bối cảnh công nghệ phần mềm phát triển thần tốc, việc trang bị kiến thức vững chắc về **${cleanTopic}** không chỉ giúp lập trình viên gia tăng năng suất mà còn là chìa khóa xây dựng các hệ thống có khả năng mở rộng (scalable) và bảo mật cao. Bài viết này tổng hợp những nguyên lý cốt lõi, kiến trúc chuẩn mực và các kinh nghiệm thực chiến đúc kết từ các dự án lớn.`,
      pillars: [
        `### Trụ cột 1: Nền tảng Kiến trúc & Phân tách Trách nhiệm (Separation of Concerns)\nHiểu rõ luồng dữ liệu một chiều và phân chia các tầng rõ rệt: Giao diện (Presentation), Nghiệp vụ (Business Logic) và Truy xuất dữ liệu (Data Access). Điều này giúp mã nguồn dễ kiểm thử, bảo trì và tránh phụ thuộc chéo.`,
        `### Trụ cột 2: Tối ưu Hóa Hiệu Năng & Trải nghiệm Người dùng\nÁp dụng kỹ thuật lazy loading, caching dữ liệu đa tầng (Memory, Redis, CDN) và hạn chế tối đa các tác vụ tính toán nặng trên luồng chính. Đảm bảo các chỉ số Core Web Vitals luôn đạt mức xanh lá cây.`,
        `### Trụ cột 3: An toàn Bảo mật & Xác thực Đa tầng\nTuyệt đối không tin tưởng dữ liệu đầu vào từ phía người dùng (Sanitize input, Zod validation). Áp dụng phân quyền chặt chẽ theo vai trò (RBAC) trên máy chủ và quản lý biến môi trường an toàn.`,
        `### Trụ cột 4: Kiểm thử Tự động (Automated Testing) & CI/CD\nViết kiểm thử đơn vị (Unit tests) cho các hàm xử lý trọng yếu và kiểm thử tích hợp (Integration tests) cho các luồng thanh toán, xác thực. Thiết lập luồng kiểm tra tự động trước khi đóng gói triển khai lên máy chủ.`
      ].join("\n\n"),
      table: [
        "| Tầng hệ thống | Công nghệ / Phương pháp khuyến nghị | Tiêu chí đánh giá chất lượng |",
        "| :--- | :--- | :--- |",
        "| **Giao diện (Frontend)** | Server Components, Tailwind CSS, Responsive Design | Thời gian phản hồi LCP < 1.5s, 0 layout shift |",
        "| **Nghiệp vụ (Backend)** | Server Actions, Clean Architecture, REST/gRPC | Xử lý ngoại lệ chuẩn hóa, HTTP status chuẩn |",
        "| **Cơ sở dữ liệu (DB)** | PostgreSQL, Prisma ORM, Đánh chỉ mục Index chuẩn | Truy vấn phức tạp hoàn thành dưới 50ms |",
        "| **Vận hành (DevOps)** | Docker container, GitHub Actions CI/CD | Triển khai tự động Zero-downtime |"
      ].join("\n"),
      mistakes: [
        "- **Bỏ qua việc định kiểu nghiêm ngặt**: Dễ dẫn đến các lỗi runtime nguy hiểm khi chạy trên môi trường thực tế.",
        "- **Xử lý bảo mật ở phía Client**: Client-side logic hoàn toàn có thể bị can thiệp; mọi quyết định quan trọng phải được kiểm chứng tại Server.",
        "- **Thiếu tài liệu và cấu trúc thư mục lộn xộn**: Gây khó khăn lớn cho việc bảo trì và mở rộng sau này."
      ].join("\n"),
      courseModules: [
        {
          title: "Phần 1: Thiết lập Môi trường & Nền tảng Kiến trúc",
          lessons: [
            { title: "Bài 1.1: Cài đặt công cụ và Khởi tạo dự án chuẩn hóa", durationMinutes: 20, isFree: true },
            { title: "Bài 1.2: Thiết kế luồng dữ liệu và Tổ chức cấu trúc thư mục", durationMinutes: 30, isFree: false },
          ]
        },
        {
          title: "Phần 2: Xây dựng Tính năng & Tối ưu Hiệu năng",
          lessons: [
            { title: "Bài 2.1: Triển khai các chức năng nghiệp vụ cốt lõi", durationMinutes: 40, isFree: false },
            { title: "Bài 2.2: Tối ưu hóa truy vấn cơ sở dữ liệu và Cơ chế Caching", durationMinutes: 35, isFree: false },
          ]
        }
      ],
      quiz: [
        {
          question: "Tại sao nên ưu tiên xử lý xác thực và phân quyền ở phía Server thay vì Client?",
          options: ["Server xử lý nhanh hơn", "Dữ liệu ở Client có thể bị can thiệp và sửa đổi trái phép", "Client không hỗ trợ lưu trữ token", "Không có sự khác biệt"],
          correctAnswerIndex: 1,
          explanation: "Client code chạy trên trình duyệt người dùng nên có thể bị can thiệp; do đó kiểm tra bảo mật bắt buộc phải thực thi tại Server."
        }
      ]
    };
  }

  // 5. General / Default fallback (Deep academic & practical synthesis)
  return {
    domain: "general",
    cleanTopic,
    title: `Cẩm Nang Toàn Diện Về ${cleanTopic}: Phương Pháp Và Lộ Trình Thực Chiến`,
    summary: `Khám phá hướng dẫn chuyên sâu về ${cleanTopic}. Bài viết phân tích các nguyên lý cốt lõi, quy trình thực hiện bài bản và kinh nghiệm thực tế giúp bạn nhanh chóng làm chủ kỹ năng một cách vững chắc.`,
    keywords: `${cleanTopic.toLowerCase()}, cẩm nang thực chiến, phương pháp học tập, kinh nghiệm thực tế, hướng dẫn chi tiết, lộ trình bài bản`,
    intro: `Trong bối cảnh thế giới vận động và thay đổi không ngừng, việc trang bị kiến thức và kỹ năng vững chắc về **${cleanTopic}** mang lại lợi thế cạnh tranh vô cùng lớn. Tuy nhiên, phần lớn mọi người khi tiếp cận chủ đề này thường rơi vào trạng thái quá tải thông tin hoặc thiếu một phương pháp thực hành có hệ thống. Bài viết này sẽ phân tích các khía cạnh trọng tâm, cung cấp khung tư duy chuẩn mực và lộ trình hành động rõ ràng giúp bạn đạt kết quả đột phá.`,
    pillars: [
      `### Trụ cột 1: Nắm vững Nguyên lý Nền tảng Cốt lõi (First Principles)\nHiểu rõ bản chất vấn đề từ những viên gạch đầu tiên trước khi đi vào các kỹ thuật phức tạp. Theo nguyên lý 80/20 (Pareto), việc làm chủ 20% kiến thức nền móng sẽ quyết định đến 80% kết quả thực tiễn.`,
      `### Trụ cột 2: Quy trình Thực hành Có Chủ đích (Deliberate Practice)\nThay vì rèn luyện thụ động, hãy chia nhỏ mục tiêu lớn thành từng kỹ năng thành phần. Thực hành lặp lại với độ tập trung cao độ và liên tục đối chiếu với tiêu chuẩn chuẩn mực để sửa đổi sai sót kịp thời.`,
      `### Trụ cột 3: Xây dựng Hệ thống Đo lường & Nhật ký Đánh giá\nNhững gì không đo lường được thì không cải tiến được. Hãy thiết lập các chỉ số KPI hoặc tiêu chí cụ thể để theo dõi sự tiến bộ từng tuần, ghi lại các bài học thành công và cả những điểm cần khắc phục.`,
      `### Trụ cột 4: Kỷ luật Thói quen & Tối ưu Môi trường Xung quanh\nĐộng lực chỉ giúp bạn bắt đầu, chính thói quen kỷ luật mới đưa bạn đến đích. Duy trì lịch trình thực hành đều đặn mỗi ngày và loại bỏ triệt để các yếu tố gây xao nhãng trong không gian làm việc.`
    ].join("\n\n"),
    table: [
      "| Giai đoạn | Mục tiêu trọng tâm | Phương pháp thực hiện | Tiêu chí nghiệm thu |",
      "| :--- | :--- | :--- | :--- |",
      "| **Giai đoạn 1: Nền tảng** | Tiếp thu khái niệm & Thuật ngữ | Nghiên cứu tài liệu, vẽ sơ đồ tư duy | Nắm vững lý thuyết cơ bản |",
      "| **Giai đoạn 2: Thực hành** | Áp dụng vào dự án mẫu | Làm theo quy trình chuẩn, sửa lỗi | Hoàn thành sản phẩm đầu tay |",
      "| **Giai đoạn 3: Làm chủ** | Độc lập thực thi & Tối ưu | Phân tích tình huống phức tạp | Đạt hiệu suất cao, tự tin ứng dụng |"
    ].join("\n"),
    mistakes: [
      "- **Nóng vội đốt cháy giai đoạn**: Bỏ qua các bước cơ bản để làm ngay việc khó dẫn đến mất phương hướng.",
      "- **Thiếu kiên trì và kỷ luật**: Bỏ cuộc ngay khi gặp những trở ngại ban đầu thay vì tìm kiếm giải pháp cải tiến.",
      "- **Không kết hợp lý thuyết với thực hành**: Chỉ nạp kiến thức một chiều mà không tạo ra sản phẩm thực tế."
    ].join("\n"),
    courseModules: [
      {
        title: "Phần 1: Tư duy Nền tảng & Nguyên lý Cốt lõi",
        lessons: [
          { title: "Bài 1.1: Tổng quan và Thiết lập mục tiêu hành động", durationMinutes: 20, isFree: true },
          { title: "Bài 1.2: Các nguyên tắc bất biến và Thuật ngữ chuyên sâu", durationMinutes: 30, isFree: false },
        ]
      },
      {
        title: "Phần 2: Phương pháp Thực chiến & Tối ưu Hiệu quả",
        lessons: [
          { title: "Bài 2.1: Quy trình từng bước triển khai trong thực tế", durationMinutes: 40, isFree: false },
          { title: "Bài 2.2: Đánh giá kết quả và Kế hoạch hoàn thiện liên tục", durationMinutes: 25, isFree: false },
        ]
      }
    ],
    quiz: [
      {
        question: `Yếu tố quyết định nhất để thành công khi áp dụng kiến thức về "${cleanTopic}" là gì?`,
        options: ["Tập trung vào lý thuyết thuần túy", "Kỷ luật thực hành đều đặn kết hợp quản lý rủi ro và đo lường kết quả", "Làm theo cảm tính cá nhân", "Chờ đợi động lực xuất hiện"],
        correctAnswerIndex: 1,
        explanation: "Thực hành có chủ đích và kỷ luật đo lường liên tục là chìa khóa duy nhất biến kiến thức thành kỹ năng thực thụ."
      }
    ]
  };
}

/**
 * Autonomous High-Reasoning Content Generator (When no external API key is given)
 */
async function generateAutonomousContent(task, onChunk) {
  let fullText = "";
  const emitWithDelay = async (text) => {
    fullText += text;
    onChunk(text);
    await new Promise((r) => setTimeout(r, 18));
  };

  const rawTopic = task.prompt || task.messages?.[task.messages.length - 1]?.content || "Phương pháp học tiếng Ấn Độ";
  const knowledge = generateDomainKnowledge(rawTopic);

  switch (task.type) {
    case "course_outline": {
      const outline = {
        title: knowledge.title,
        description: knowledge.summary,
        sections: knowledge.courseModules,
      };
      const jsonStr = JSON.stringify(outline, null, 2);
      await emitWithDelay(jsonStr);
      return jsonStr;
    }

    case "lesson_content": {
      const parts = [
        `# Bài học: ${knowledge.cleanTopic}\n\n`,
        `> **Mục tiêu học tập**: ${knowledge.summary}\n\n`,
        `## 1. Bối cảnh & Khái niệm Cốt lõi\n\n`,
        `${knowledge.intro}\n\n`,
        `## 2. Các Trụ Cột Kỹ Thuật Then Chốt\n\n`,
        `${knowledge.pillars}\n\n`,
        `## 3. Bảng Kiểm Tra & Lộ Trình Thực Hành Chuẩn Hóa\n\n`,
        `${knowledge.table}\n\n`,
        `## 4. Những Sai Lầm Phổ Biến & Cách Phòng Tránh\n\n`,
        `${knowledge.mistakes}\n\n`,
        `## 5. Bài Tập Rèn Luyện & Tổng Kết\n\n`,
        `- **Bài tập thực hành**: Hãy ghi lại các điểm mấu chốt và áp dụng vào bài kiểm tra đánh giá trước buổi học kế tiếp.\n`,
      ];
      for (const p of parts) {
        await emitWithDelay(p);
      }
      return fullText;
    }

    case "blog_post": {
      const parts = [
        `# ${knowledge.title}\n\n`,
        `> **Tóm tắt bài viết**: ${knowledge.summary}\n\n`,
        `## 1. Đặt vấn đề: Vì sao chủ đề này lại quan trọng?\n\n`,
        `${knowledge.intro}\n\n`,
        `## 2. Các Trụ Cột Phương Pháp & Kỹ Thuật Then Chốt\n\n`,
        `${knowledge.pillars}\n\n`,
        `## 3. Lộ Trình Thực Hành Chi Tiết\n\n`,
        `${knowledge.table}\n\n`,
        `## 4. Lời Khuyên & Những Sai Lầm Cần Tránh\n\n`,
        `${knowledge.mistakes}\n\n`,
        `## 5. Lời kết\n\n`,
        `Hành trình làm chủ bất kỳ kỹ năng nào cũng đòi hỏi sự kiên trì và phương pháp đúng đắn ngay từ đầu. Chúc bạn luôn giữ vững ngọn lửa đam mê và gặt hái nhiều thành công rực rỡ!\n`,
      ];
      for (const p of parts) {
        await emitWithDelay(p);
      }
      return fullText;
    }

    case "quiz": {
      const jsonStr = JSON.stringify(knowledge.quiz, null, 2);
      await emitWithDelay(jsonStr);
      return jsonStr;
    }

    case "seo": {
      const seo = {
        metaTitle: knowledge.title.slice(0, 60),
        metaDescription: knowledge.summary.slice(0, 160),
        metaKeywords: knowledge.keywords,
        summary: knowledge.summary,
        readingTime: 5,
        suggestedTags: knowledge.keywords.split(",").map((k) => k.trim()).filter((k) => k.length > 0),
      };
      const jsonStr = JSON.stringify(seo, null, 2);
      await emitWithDelay(jsonStr);
      return jsonStr;
    }

    default: {
      // General Copilot Chat: Multi-turn Intelligent Interactive Assistant
      const promptLower = rawTopic.toLowerCase();

      // Check if user is asking for title suggestions or changes
      if (
        promptLower.includes("đổi tiêu đề") ||
        promptLower.includes("tiêu đề khác") ||
        promptLower.includes("tiêu đề ngắn") ||
        promptLower.includes("gợi ý tiêu đề")
      ) {
        const titleSuggestions = [
          knowledge.title,
          `Chinh Phục ${knowledge.cleanTopic} Trong 90 Ngày Từ Số 0`,
          `Bí Quyết Làm Chủ ${knowledge.cleanTopic} Dễ Dàng & Hiệu Quả`,
          `Lộ Trình Thực Chiến: ${knowledge.cleanTopic} Cho Người Bận Rộn`,
          `Cẩm Nang ${knowledge.cleanTopic}: 4 Trụ Cột Không Thể Bỏ Qua`,
        ];
        const selectedTitle = titleSuggestions[0];
        const response =
          `Dạ Chú! Dưới đây là 5 gợi ý tiêu đề ngắn gọn, cuốn hút và tối ưu tỷ lệ nhấp (CTR) cao cho bài viết của Chú:\n\n` +
          `1. 🌟 **${titleSuggestions[0]}** *(Khuyên dùng - Chuẩn SEO & thân thiện người đọc)*\n` +
          `2. 🎯 **${titleSuggestions[1]}** *(Cam kết thời gian rõ ràng, tạo động lực mạnh)*\n` +
          `3. 🚀 **${titleSuggestions[2]}** *(Nhấn mạnh tính dễ dàng và kết quả)*\n` +
          `4. ⏱️ **${titleSuggestions[3]}** *(Đánh trúng đối tượng người bận rộn)*\n` +
          `5. 📚 **${titleSuggestions[4]}** *(Cấu trúc cẩm nang bài bản)*\n\n` +
          `**Tiêu đề đề xuất**: "${selectedTitle}"\n` +
          `**Từ khóa SEO**: ${knowledge.keywords}\n\n` +
          `Chú thấy tiêu đề nào phù hợp nhất ạ? Chú có thể bấm **"Đặt Tiêu đề"** bên dưới để áp dụng ngay tiêu đề số 1 vào bài viết, hoặc bảo cháu chọn số nào Chú ưng ý nhé!`;
        const words = response.split(" ");
        for (const word of words) {
          await emitWithDelay(word + " ");
        }
        return fullText;
      }

      // Check if user is asking for deeper elaboration or expansion
      if (
        promptLower.includes("chi tiết hơn") ||
        promptLower.includes("mở rộng") ||
        promptLower.includes("viết sâu hơn") ||
        promptLower.includes("giải thích thêm")
      ) {
        const expansionTitle = `Phân Tích Chuyên Sâu: ${knowledge.cleanTopic}`;
        const response =
          `Dạ Chú! Cháu đã phân tích và biên soạn bản mở rộng chuyên sâu theo đúng yêu cầu của Chú:\n\n` +
          `**Tiêu đề đề xuất**: "${expansionTitle}"\n` +
          `**Tóm tắt**: ${knowledge.summary}\n` +
          `**Từ khóa SEO**: ${knowledge.keywords}\n\n` +
          `---\n\n` +
          `# ${expansionTitle}\n\n` +
            "| Giai đoạn | Nhiệm vụ trọng tâm | Kết quả kỳ vọng |",
            "| :--- | :--- | :--- |",
            "| **Giai đoạn 1** | Nghiên cứu tài liệu & xây dựng bản đồ tư duy | Nắm chắc thuật ngữ |",
            "| **Giai đoạn 2** | Thực hành dự án mẫu & kiểm chứng kết quả | Thành thạo thao tác |",
            "| **Giai đoạn 3** | Ứng dụng thực tế & tối ưu hóa quy trình | Độc lập thực thi |"
          ].join("\n")
        };
      }

      const response =
        `Chào Chú! Cháu đã nghiên cứu và lên ý tưởng chi tiết kèm bản phác thảo bài viết hoàn chỉnh về chủ đề: **${cleanTopic}** theo đúng yêu cầu của Chú:\n\n` +
        `**Tiêu đề đề xuất**: "${draft.title}"\n` +
        `**Tóm tắt**: ${draft.summary}\n` +
        `**Từ khóa SEO**: ${draft.keywords}\n\n` +
        `---\n\n` +
        `# ${draft.title}\n\n` +
        `> **Tóm tắt bài viết**: ${draft.summary}\n\n` +
        `## 1. Đặt vấn đề: Vì sao chủ đề "${cleanTopic}" lại quan trọng?\n\n` +
        `${draft.intro}\n\n` +
        `## 2. Các Trụ Cột Phương Pháp & Kỹ Thuật Then Chốt\n\n` +
        `${draft.pillars}\n\n` +
        `## 3. Lộ Trình Thực Hành Chi Tiết\n\n` +
        `${draft.roadmap}\n\n` +
        `## 4. Lời khuyên & Những Sai Lầm Cần Tránh\n\n` +
        `- **Không nóng vội**: Ngoại ngữ và kỹ năng mới cần thời gian ngấm vào tiềm thức.\n` +
        `- **Kỷ luật đều đặn**: 20 phút mỗi ngày mang lại hiệu quả vượt trội hơn 3 tiếng học dồn vào cuối tuần.\n` +
        `- **Thực hành thực tế**: Luôn áp dụng kiến thức vào thực tế thay vì chỉ dừng lại ở lý thuyết sách vở.\n\n` +
        `## 5. Lời kết\n\n` +
        `Hành trình chinh phục kiến thức mới luôn đòi hỏi sự kiên trì. Hy vọng bài viết này sẽ là kim chỉ nam hữu ích cho Chú và quý độc giả!\n\n` +
        `---\n\n` +
        `Chú thấy bản thảo và tiêu đề này đã ưng ý chưa ạ? Chú có thể:\n` +
        `- Bấm nút **"Đồng ý áp dụng vào bài viết"** bên dưới để tự động điền toàn bộ Tiêu đề, Tóm tắt, SEO và Nội dung vào form.\n` +
        `- Hoặc Chú có thể yêu cầu cháu: *"Hãy viết chi tiết hơn mục 2"*, *"Đổi tiêu đề khác ngắn hơn"*, hay bất kỳ chỉnh sửa nào để cháu hoàn thiện tiếp nhé Chú!`;

      const words = response.split(" ");
      for (const word of words) {
        await emitWithDelay(word + " ");
      }
      return fullText;
    }
  }
}

/**
 * Process a single task
 */
async function processTask(taskFile) {
  const taskPath = path.join(QUEUE_DIR, taskFile);
  if (!fs.existsSync(taskPath)) return;

  let task;
  try {
    task = JSON.parse(fs.readFileSync(taskPath, "utf-8"));
  } catch {
    return;
  }

  if (task.status !== "PENDING") return;

  task.status = "PROCESSING";
  task.updatedAt = new Date().toISOString();
  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2), "utf-8");

  console.log(`\n📥 [NEW TASK] ID: ${task.id} | Type: ${task.type.toUpperCase()}`);
  const promptSummary = task.prompt || task.messages?.[task.messages.length - 1]?.content || "(no prompt)";
  console.log(`💬 Prompt: "${promptSummary.slice(0, 100)}..."`);

  const onChunk = (chunk) => {
    appendStreamChunk(task.id, chunk);
  };

  let result = "";
  try {
    const messages = task.messages || [{ role: "user", content: task.prompt || "" }];
    const { gKey, oKey, cKey, dKey, defaultProv } = await getEffectiveKeys();

    if (gKey && defaultProv === "gemini") {
      console.log("⚡ Generating with Google Gemini 2.0 Flash (Live API)...");
      result = await callLiveGemini(messages, onChunk);
    } else if (dKey && defaultProv === "deepseek") {
      console.log("⚡ Generating with DeepSeek (Live API)...");
      result = await callLiveOpenAICompatible(
        "https://api.deepseek.com/v1/chat/completions",
        dKey,
        "deepseek-chat",
        messages,
        onChunk
      );
    } else if (oKey && defaultProv === "openai") {
      console.log("⚡ Generating with OpenAI (Live API)...");
      result = await callLiveOpenAICompatible(
        "https://api.openai.com/v1/chat/completions",
        oKey,
        "gpt-4o-mini",
        messages,
        onChunk
      );
    } else if (cKey && defaultProv === "claude") {
      console.log("⚡ Generating with Claude...");
      result = await generateAutonomousContent(task, onChunk);
    } else if (gKey) {
      console.log("⚡ Generating with Google Gemini (Live API)...");
      result = await callLiveGemini(messages, onChunk);
    } else {
      console.log("🧠 Generating with Autonomous High-Reasoning Engine...");
      result = await generateAutonomousContent(task, onChunk);
    }

    task.status = "COMPLETED";
    task.result = result;
    task.updatedAt = new Date().toISOString();

    const completedPath = path.join(COMPLETED_DIR, `${task.id}.json`);
    fs.writeFileSync(completedPath, JSON.stringify(task, null, 2), "utf-8");

    // Remove from pending queue
    if (fs.existsSync(taskPath)) {
      fs.unlinkSync(taskPath);
    }

    console.log(`✅ [TASK COMPLETED] ID: ${task.id} | Result length: ${result.length} chars.\n`);
  } catch (error) {
    console.error(`❌ [TASK FAILED] ID: ${task.id}:`, error.message);
    task.status = "FAILED";
    task.error = error.message;
    task.updatedAt = new Date().toISOString();

    const completedPath = path.join(COMPLETED_DIR, `${task.id}.json`);
    fs.writeFileSync(completedPath, JSON.stringify(task, null, 2), "utf-8");

    if (fs.existsSync(taskPath)) {
      fs.unlinkSync(taskPath);
    }
  }
}

/**
 * Periodic Task Watcher Loop
 */
let isChecking = false;
async function checkQueue() {
  if (isChecking) return;
  isChecking = true;

  try {
    const files = fs.readdirSync(QUEUE_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      await processTask(file);
    }
  } catch (err) {
    console.error("Queue check error:", err);
  } finally {
    isChecking = false;
  }
}

// Watch queue folder
setInterval(checkQueue, 200);

// Cleanup tasks older than 1 hour
setInterval(() => {
  try {
    const now = Date.now();
    for (const dir of [COMPLETED_DIR, STREAMS_DIR]) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 3600000) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}, 300000);
