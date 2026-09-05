import {
  ChatMessage,
  CourseOutline,
  QuizQuestion,
  SEOMetadata,
} from "./types";

/**
 * Local Development Simulation Proxy
 * Generates realistic responses and simulated streams without calling paid LLM APIs.
 */

// Helper to simulate network streaming delay
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stream text chunk by chunk with realistic typing delay
 */
export async function* simulateStreamText(
  fullText: string,
  chunkDelayMs: number = 20
): AsyncGenerator<string, void, unknown> {
  // Split into small phrases or words
  const words = fullText.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 2) {
    const chunk = (words[i] || "") + (words[i + 1] || "");
    yield chunk;
    if (chunkDelayMs > 0) {
      await sleep(chunkDelayMs);
    }
  }
}

/**
 * Simulate Course Outline Generation
 */
export function simulateCourseOutline(
  topic: string,
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS" = "ALL_LEVELS",
  targetAudience: string = "All learners"
): CourseOutline {
  const safeTopic = topic.trim() || "Professional Trading Strategies";

  return {
    title: `Masterclass: ${safeTopic}`,
    description: `A comprehensive, step-by-step masterclass on ${safeTopic} designed for ${targetAudience} at ${level.toLowerCase()} level.`,
    targetAudience,
    level,
    sections: [
      {
        title: "Module 1: Foundations & Core Principles",
        description: "Understand the key theoretical foundations, terminology, and market structure.",
        lessons: [
          {
            title: `1.1 Introduction to ${safeTopic}`,
            description: "Fundamental overview, history, and why this skill matters in modern markets.",
            contentType: "VIDEO_YOUTUBE",
          },
          {
            title: "1.2 Core Terminology & Essential Frameworks",
            description: "Master the key terminology, formulas, and baseline operational mechanics.",
            contentType: "ARTICLE",
          },
          {
            title: "1.3 Avoiding Common Beginner Mistakes",
            description: "Key pitfalls, cognitive biases, and how to protect capital from day one.",
            contentType: "ARTICLE",
          },
        ],
      },
      {
        title: "Module 2: Technical Strategies & Practical Execution",
        description: "Deep-dive into actionable methodologies, analytical tools, and execution setups.",
        lessons: [
          {
            title: "2.1 Advanced Chart Analysis & Signal Identification",
            description: "Step-by-step breakdown of high-probability patterns and confirmation triggers.",
            contentType: "ARTICLE",
          },
          {
            title: "2.2 Live Execution & Setup Walkthrough",
            description: "Watch how real trades and workflows are executed under live conditions.",
            contentType: "VIDEO_YOUTUBE",
          },
          {
            title: "2.3 Risk-to-Reward Optimization & Capital Allocation",
            description: "Calculating position sizing, dynamic stop-losses, and profit targets.",
            contentType: "ARTICLE",
          },
        ],
      },
      {
        title: "Module 3: Real-World Case Studies & Risk Management",
        description: "Learn from past historical scenarios and institutional risk protocols.",
        lessons: [
          {
            title: "3.1 Case Study: Navigating Volatile Environments",
            description: "In-depth review of historical volatility spikes and defensive positioning.",
            contentType: "ARTICLE",
          },
          {
            title: "3.2 Developing Your Personal Trading Playbook",
            description: "Drafting a disciplined daily checklist and operational standard operating procedure.",
            contentType: "ARTICLE",
          },
        ],
      },
      {
        title: "Module 4: Knowledge Evaluation & Certification",
        description: "Assess comprehensive mastery before receiving the verified course certificate.",
        lessons: [
          {
            title: "4.1 Comprehensive Knowledge Assessment Quiz",
            description: "Interactive assessment covering all core competencies taught in Modules 1-3.",
            contentType: "QUIZ",
          },
        ],
      },
    ],
  };
}

/**
 * Simulate Lesson Article Content in rich Markdown
 */
export function simulateLessonContent(
  courseTitle: string,
  sectionTitle: string,
  lessonTitle: string,
  contextDocs?: string[]
): string {
  const contextReference = contextDocs && contextDocs.length > 0
    ? `\n\n> [!NOTE]\n> *Content curated and cross-referenced with internal curriculum documents (${contextDocs.length} source materials).*`
    : "";

  return `# ${lessonTitle}

${contextReference}

## 1. Overview & Learning Objectives

Welcome to this lesson in **${courseTitle}** (${sectionTitle}). By the end of this module, you will be able to:
- Understand the primary mechanisms behind **${lessonTitle}**.
- Apply quantitative and qualitative risk parameters systematically.
- Execute real-world analysis using proven industry frameworks.

---

## 2. Core Concepts & Theoretical Framework

Every successful strategy begins with clear market perception. When analyzing the core fundamentals:

1. **Market Structure Alignment**: Always verify the higher timeframe trend before executing lower timeframe entries.
2. **Liquidity & Volume Confirmation**: Look for institutional volume anomalies that indicate smart-money participation.
3. **Statistical Edge**: Never take an execution without a measured statistical positive expectancy over at least 50 sample occurrences.

> [!TIP]
> **Pro Rule**: Risk no more than 1% to 2% of total capital on any single setup. Capital preservation is the prerequisite for exponential growth.

---

## 3. Practical Walkthrough & Step-by-Step Execution

Here is the exact step-by-step checklist to follow:

\`\`\`markdown
Step 1: Check economic calendar for high-impact news releases.
Step 2: Map key support and resistance zones on the 4-hour chart.
Step 3: Wait for price rejection or breakout confirmation on the 15-minute timeframe.
Step 4: Calculate position size = (Total Capital * Risk%) / (Entry Price - Stop Loss).
Step 5: Set Take Profit 1 at 1:2 R:R, Take Profit 2 at key liquidity pool.
\`\`\`

---

## 4. Key Takeaways & Summary

- **Discipline Beats Prediction**: Consistency comes from executing a documented edge repeatedly.
- **Continuous Journaling**: Log every execution, emotional state, and post-trade outcome.
- **Review**: Complete the quick reflection exercise below before proceeding to the next chapter.

---

*Continue to the next lesson to learn how to integrate dynamic risk management.*`;
}

/**
 * Simulate Blog Post Content in rich Markdown
 */
export function simulateBlogPost(
  topic: string,
  tone: string = "Professional",
  keywords: string = "trading, finance, education",
  contextDocs?: string[]
): string {
  const cleanTopic = topic.trim() || "Modern Financial Markets and Systematic Trading";

  return `# ${cleanTopic}

*Published by NextLMS Editorial Desk · Written with AI Copilot (${tone} Tone)*

---

In today's dynamic global landscape, mastering **${cleanTopic}** is no longer just an advantage—it is an absolute necessity for forward-thinking professionals and investors alike.

Whether you are just starting your journey or looking to refine existing methodologies, this comprehensive guide breaks down the essential pillars of success.

## 1. The Shifting Paradigm: Why This Matters Today

Traditional approaches often fail to account for algorithmic liquidity, real-time macro fluctuations, and behavioral psychology. To maintain a competitive edge, market participants must adapt:

- **Data-Driven Decision Making**: Moving away from emotional guesswork toward systematic rules.
- **Automated Risk Safeguards**: Deploying algorithmic stop-losses and predefined portfolio exposure limits.
- **Lifelong Skill Compounding**: Continuously upgrading knowledge through verified educational academies.

> [!IMPORTANT]
> Success in any competitive domain is 20% mechanics and 80% discipline. Without a clear execution framework, even the best insights fall short.

## 2. Key Strategies for Sustainable Performance

When structuring your daily routine, consider these core principles:

1. **Establish a High-Probability Playbook**: Focus on 2-3 setups that you have backtested thoroughly.
2. **Embrace Variance**: Accept short-term drawdowns as standard operating overhead.
3. **Review and Iterate**: Perform weekly performance post-mortems to identify behavioral leaks.

## 3. Conclusion & Next Steps

Mastering **${cleanTopic}** is a marathon, not a sprint. By prioritizing risk management, consistency, and disciplined execution, you position yourself for long-term compound growth.

*Explore our full catalog of specialized courses on NextLMS to take your understanding to the next level.*`;
}

/**
 * Simulate SEO Metadata
 */
export function simulateSEOMetadata(title: string, content: string): SEOMetadata {
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const cleanTitle = title.replace(/[#*]/g, "").trim();

  return {
    metaTitle: `${cleanTitle.slice(0, 55)} | NextLMS Academy`,
    metaDescription: `Discover key insights on ${cleanTitle}. Learn essential frameworks, practical strategies, and verified best practices to accelerate your growth.`,
    metaKeywords: "elearning, online course, professional education, academy, trading, finance",
    summary: `An in-depth guide covering key principles, execution checklists, and strategic insights for ${cleanTitle}.`,
    readingTime,
    suggestedTags: ["Finance", "Education", "Strategy", "Masterclass"],
  };
}

/**
 * Simulate Quiz Questions
 */
export function simulateQuiz(content: string, count: number = 5): QuizQuestion[] {
  return [
    {
      question: "What is the recommended maximum capital risk percentage per trade according to risk management best practices?",
      options: [
        "10% to 15% of total portfolio",
        "1% to 2% of total portfolio",
        "50% of available margin",
        "Zero risk (risk-free arbitrage only)",
      ],
      correctAnswerIndex: 1,
      explanation: "Industry standard risk management recommends risking no more than 1% to 2% of total portfolio equity on any single execution.",
    },
    {
      question: "Before executing any setup on a lower timeframe, what should an analyst verify first?",
      options: [
        "Social media sentiment",
        "Higher timeframe market structure and trend alignment",
        "Unverified insider tips",
        "Immediate maximum leverage availability",
      ],
      correctAnswerIndex: 1,
      explanation: "Multi-timeframe alignment ensures that lower-timeframe tactical entries trade in harmony with dominant institutional volume.",
    },
    {
      question: "Which element accounts for the majority of long-term sustainable performance?",
      options: [
        "Finding a secret 100% win-rate indicator",
        "Executing without stop-losses",
        "Psychological discipline and emotional management",
        "Constantly changing trading systems daily",
      ],
      correctAnswerIndex: 2,
      explanation: "Discipline and psychology represent approximately 80% of long-term performance, ensuring adherence to statistical edge.",
    },
    {
      question: "What is the primary benefit of maintaining a comprehensive trading journal?",
      options: [
        "To impress friends on social media",
        "To identify behavioral mistakes, cognitive biases, and measurable edge leaks",
        "To increase broker transaction fees",
        "It has no measurable benefit",
      ],
      correctAnswerIndex: 1,
      explanation: "Journaling allows objective tracking of performance, helping eliminate emotional errors and refine execution quality.",
    },
    {
      question: "What formula is used to calculate correct position sizing?",
      options: [
        "(Total Capital * Risk%) / (Entry Price - Stop Loss)",
        "Total Capital * 100x Leverage",
        "Arbitrary guess based on confidence",
        "(Entry Price + Take Profit) / 2",
      ],
      correctAnswerIndex: 0,
      explanation: "Position size should strictly be derived from the predetermined risk amount divided by the dollar distance to the stop-loss level.",
    },
  ].slice(0, count);
}

/**
 * Simulate Interactive AI Copilot Chat
 */
export async function* simulateCopilotChatStream(
  messages: ChatMessage[],
  contextDocs?: string[]
): AsyncGenerator<string, void, unknown> {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

  let reply = "";

  if (lastMessage.includes("sửa") || lastMessage.includes("fix") || lastMessage.includes("chính tả")) {
    reply = `Dạ Chú, cháu đã rà soát lại đoạn văn bản của Chú. Dưới đây là đề xuất biên tập giúp câu văn mượt mà, gãy gọn và giàu tính thuyết phục hơn:

> "Để đạt được kết quả bền vững trong đầu tư, việc tuân thủ kỷ luật quản trị rủi ro đóng vai trò quyết định 80% thành công. Hãy luôn xác định điểm cắt lỗ và tỷ lệ lợi nhuận/rủi ro (R:R) tối thiểu 1:2 trước khi mở bất kỳ vị thế nào."

Chú có thể bấm nút **"Chèn vào bài viết"** hoặc **"Thay thế đoạn đang chọn"** để áp dụng ngay ạ!`;
  } else if (lastMessage.includes("tóm tắt") || lastMessage.includes("summarize")) {
    reply = `Dạ Chú, đây là bản tóm tắt các điểm cốt lõi (Key Takeaways):

1. **Hiểu rõ cấu trúc thị trường**: Phân tích khung thời gian lớn trước khi tìm điểm vào lệnh.
2. **Kỷ luật vốn**: Tuyệt đối không rủi ro quá 1-2% tổng tài khoản cho mỗi giao dịch.
3. **Nhật ký hành vi**: Ghi chép chi tiết cảm xúc và lý do vào lệnh để hoàn thiện phương pháp.

Chú có muốn cháu mở rộng thêm phần bài tập thực hành cho học viên không ạ?`;
  } else if (lastMessage.includes("quiz") || lastMessage.includes("trắc nghiệm")) {
    reply = `Dạ Chú, cháu đã soạn sẵn bộ 3 câu hỏi trắc nghiệm ôn tập cho bài học này:

**Câu 1**: Mức rủi ro tối đa được khuyến nghị trên mỗi giao dịch là bao nhiêu?
- A. 10%
- B. **1% - 2% (Đáp án đúng)**
- C. 5%
- D. Tùy ý

**Câu 2**: Bước đầu tiên cần làm trước khi vào lệnh là gì?
- A. **Kiểm tra lịch kinh tế và xu hướng khung thời gian lớn (Đáp án đúng)**
- B. Đặt lệnh ngay lập tức
- C. Hỏi ý kiến người khác

Chú có muốn cháu lưu trực tiếp các câu hỏi này vào bài trắc nghiệm của khóa học không ạ?`;
  } else {
    const rawTopic = messages[messages.length - 1]?.content || "Phương pháp học tiếng Ấn Độ";
    const promptLower = rawTopic.toLowerCase();
    const knowledge = generateDomainKnowledge(rawTopic);

    // Check if this is a follow-up conversation asking for title suggestions or changes
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
      reply =
        `Dạ Chú! Dưới đây là 5 gợi ý tiêu đề ngắn gọn, cuốn hút và tối ưu tỷ lệ nhấp (CTR) cao cho bài viết của Chú:\n\n` +
        `1. 🌟 **${titleSuggestions[0]}** *(Khuyên dùng - Chuẩn SEO & thân thiện người đọc)*\n` +
        `2. 🎯 **${titleSuggestions[1]}** *(Cam kết thời gian rõ ràng, tạo động lực mạnh)*\n` +
        `3. 🚀 **${titleSuggestions[2]}** *(Nhấn mạnh tính dễ dàng và kết quả)*\n` +
        `4. ⏱️ **${titleSuggestions[3]}** *(Đánh trúng đối tượng người bận rộn)*\n` +
        `5. 📚 **${titleSuggestions[4]}** *(Cấu trúc cẩm nang bài bản)*\n\n` +
        `**Tiêu đề đề xuất**: "${selectedTitle}"\n` +
        `**Từ khóa SEO**: ${knowledge.keywords}\n\n` +
        `Chú thấy tiêu đề nào phù hợp nhất ạ? Chú có thể bấm **"Đặt Tiêu đề"** bên dưới để áp dụng ngay tiêu đề số 1 vào bài viết, hoặc bảo cháu chọn số nào Chú ưng ý nhé!`;
      for await (const chunk of simulateStreamText(reply, 20)) {
        yield chunk;
      }
      return;
    }

    // Check if this is a follow-up asking to expand or detail a section
    if (
      promptLower.includes("chi tiết hơn") ||
      promptLower.includes("mở rộng") ||
      promptLower.includes("viết sâu hơn") ||
      promptLower.includes("giải thích thêm")
    ) {
      const expansionTitle = `Phân Tích Chuyên Sâu: ${knowledge.cleanTopic}`;
      reply =
        `Dạ Chú! Cháu đã phân tích và biên soạn bản mở rộng chuyên sâu theo đúng yêu cầu của Chú:\n\n` +
        `**Tiêu đề đề xuất**: "${expansionTitle}"\n` +
        `**Tóm tắt**: ${knowledge.summary}\n` +
        `**Từ khóa SEO**: ${knowledge.keywords}\n\n` +
        `---\n\n` +
        `# ${expansionTitle}\n\n` +
        `## Phân Tích Kỹ Thuật & Khung Thực Hành Chi Tiết\n\n` +
        `${knowledge.pillars}\n\n` +
        `## Bảng So Sánh & Tiêu Chí Đánh Giá\n\n` +
        `${knowledge.table}\n\n` +
        `## Các Điểm Lưu Ý Then Chốt\n\n` +
        `${knowledge.mistakes}\n\n` +
        `---\n\n` +
        `Chú có thể bấm **"Chèn vào nội dung"** để bổ sung phần phân tích này vào bài viết, hoặc bấm **"Đồng ý áp dụng vào bài viết"** nếu Chú muốn lưu toàn bộ vào form nhé Chú!`;

      for await (const chunk of simulateStreamText(reply, 20)) {
        yield chunk;
      }
      return;
    }

    reply =
      `Chào Chú! Cháu đã nghiên cứu và lên ý tưởng chi tiết kèm bản phác thảo bài viết hoàn chỉnh về chủ đề: **${knowledge.cleanTopic}** theo đúng yêu cầu của Chú:\n\n` +
      `**Tiêu đề đề xuất**: "${knowledge.title}"\n` +
      `**Tóm tắt**: ${knowledge.summary}\n` +
      `**Từ khóa SEO**: ${knowledge.keywords}\n\n` +
      `---\n\n` +
      `# ${knowledge.title}\n\n` +
      `> **Tóm tắt bài viết**: ${knowledge.summary}\n\n` +
      `## 1. Đặt vấn đề: Vì sao chủ đề "${knowledge.cleanTopic}" lại quan trọng?\n\n` +
      `${knowledge.intro}\n\n` +
      `## 2. Các Trụ Cột Phương Pháp & Kỹ Thuật Then Chốt\n\n` +
      `${knowledge.pillars}\n\n` +
      `## 3. Lộ Trình Thực Hành Chi Tiết\n\n` +
      `${knowledge.table}\n\n` +
      `## 4. Lời khuyên & Những Sai Lầm Cần Tránh\n\n` +
      `${knowledge.mistakes}\n\n` +
      `## 5. Lời kết\n\n` +
      `Hành trình chinh phục kiến thức mới luôn đòi hỏi sự kiên trì và kỷ luật. Hy vọng bài viết này sẽ là kim chỉ nam hữu ích cho Chú và quý độc giả!\n\n` +
      `---\n\n` +
      `Chú thấy bản thảo và tiêu đề này đã ưng ý chưa ạ? Chú có thể:\n` +
      `- Bấm nút **"Đồng ý áp dụng vào bài viết"** bên dưới để tự động điền toàn bộ Tiêu đề, Tóm tắt, SEO và Nội dung vào form.\n` +
      `- Hoặc Chú có thể yêu cầu cháu: *"Hãy viết chi tiết hơn mục 2"*, *"Đổi tiêu đề khác ngắn hơn"*, hay bất kỳ chỉnh sửa nào để cháu hoàn thiện tiếp nhé Chú!`;
  }

  for await (const chunk of simulateStreamText(reply, 20)) {
    yield chunk;
  }
}
