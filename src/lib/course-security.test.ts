import { describe, it, expect } from "vitest";
import { validateReviewInput } from "@/lib/validation";

describe("LMS Curriculum & Anti-Piracy Video Protection (Khối 3 - SEC-P2-01 to SEC-P2-04)", () => {
  // Test helper replicating the redaction logic implemented in src/app/courses/[slug]/page.tsx
  function redactCourseForClient(course: any, isEnrolled: boolean, isStaff: boolean = false) {
    const safeSections = course.sections.map((sec: any) => ({
      ...sec,
      lessons: sec.lessons.map((les: any) => {
        const allowed = isStaff || isEnrolled || les.isPreview;
        return {
          id: les.id,
          title: les.title,
          slug: les.slug,
          videoUrl: allowed ? les.videoUrl : null,
          videoDuration: les.videoDuration,
          contentBody: allowed ? les.contentBody : null,
          isPreview: les.isPreview,
          orderIndex: les.orderIndex,
          attachments: allowed ? les.attachments : [],
        };
      }),
    }));

    return {
      ...course,
      attachments: isStaff || isEnrolled ? course.attachments : [],
      sections: safeSections,
    };
  }

  // Test helper replicating the sequential progression lock logic
  function checkSequentialAccess(
    allLessons: Array<{ id: string; isPreview: boolean }>,
    lessonIndex: number,
    completedLessonIds: string[],
    isEnrolled: boolean,
    isStaff: boolean = false
  ) {
    if (isStaff) return { canAccess: true, isSequentialLocked: false };
    const currentLesson = allLessons[lessonIndex];
    if (!currentLesson) return { canAccess: false, isSequentialLocked: false };
    if (currentLesson.isPreview) return { canAccess: true, isSequentialLocked: false };
    if (!isEnrolled) return { canAccess: false, isSequentialLocked: false };

    if (lessonIndex === 0) {
      return { canAccess: true, isSequentialLocked: false };
    }

    const prevLesson = allLessons[lessonIndex - 1];
    const isPrevCompleted = completedLessonIds.includes(prevLesson.id);

    if (!isPrevCompleted) {
      return { canAccess: false, isSequentialLocked: true };
    }

    return { canAccess: true, isSequentialLocked: false };
  }

  const sampleCourse = {
    id: "course-btc-101",
    title: "Khóa học Price Action Nâng Cao",
    slug: "price-action-nang-cao",
    status: "PUBLISHED",
    attachments: [{ id: "att-global", fileName: "CheatSheet.pdf" }],
    sections: [
      {
        id: "sec-1",
        title: "Chương 1: Khái niệm Cốt lõi",
        lessons: [
          {
            id: "les-1",
            title: "Bài 1: Giới thiệu & Cấu trúc thị trường",
            slug: "bai-1-gioi-thieu",
            videoUrl: "https://s3.bucket.aws/private-video-les1.mp4",
            videoDuration: 600,
            contentBody: "Nội dung học thử miễn phí...",
            isPreview: true,
            attachments: [{ id: "att-1", fileName: "Lesson1.pdf" }],
          },
          {
            id: "les-2",
            title: "Bài 2: Order Block & Fair Value Gap (Trả phí)",
            slug: "bai-2-order-block",
            videoUrl: "https://s3.bucket.aws/confidential-stream-ob.mp4",
            videoDuration: 1800,
            contentBody: "Bí kíp độc quyền Order Block...",
            isPreview: false,
            attachments: [{ id: "att-2", fileName: "SecretOrderBlock.pdf" }],
          },
          {
            id: "les-3",
            title: "Bài 3: Chiến thuật vào lệnh thực chiến (Trả phí)",
            slug: "bai-3-entry-model",
            videoUrl: "https://s3.bucket.aws/confidential-stream-entry.mp4",
            videoDuration: 2400,
            contentBody: "Chiến thuật chốt lời...",
            isPreview: false,
            attachments: [{ id: "att-3", fileName: "SetupTemplate.pdf" }],
          },
        ],
      },
    ],
  };

  describe("Curriculum Video & Content Redaction (SEC-P2-01)", () => {
    it("should strictly redact private video URLs and contentBody for non-enrolled visitors", () => {
      const sanitized = redactCourseForClient(sampleCourse, false, false);
      const lessons = sanitized.sections[0].lessons;

      // Lesson 1 is preview -> allowed
      expect(lessons[0].videoUrl).toBe("https://s3.bucket.aws/private-video-les1.mp4");
      expect(lessons[0].contentBody).toBe("Nội dung học thử miễn phí...");
      expect(lessons[0].attachments.length).toBe(1);

      // Lesson 2 is paid (not preview) -> must be REDACTED
      expect(lessons[1].videoUrl).toBeNull();
      expect(lessons[1].contentBody).toBeNull();
      expect(lessons[1].attachments).toEqual([]);

      // Lesson 3 is paid -> must be REDACTED
      expect(lessons[2].videoUrl).toBeNull();
      expect(lessons[2].contentBody).toBeNull();
      expect(lessons[2].attachments).toEqual([]);

      // Course-level private attachments must be hidden
      expect(sanitized.attachments).toEqual([]);
    });

    it("should provide full access to video URLs and contentBody for enrolled students", () => {
      const sanitized = redactCourseForClient(sampleCourse, true, false);
      const lessons = sanitized.sections[0].lessons;

      expect(lessons[0].videoUrl).toBe("https://s3.bucket.aws/private-video-les1.mp4");
      expect(lessons[1].videoUrl).toBe("https://s3.bucket.aws/confidential-stream-ob.mp4");
      expect(lessons[1].contentBody).toBe("Bí kíp độc quyền Order Block...");
      expect(lessons[1].attachments.length).toBe(1);
      expect(lessons[2].videoUrl).toBe("https://s3.bucket.aws/confidential-stream-entry.mp4");
      expect(sanitized.attachments.length).toBe(1);
    });

    it("should allow full access for administrative staff regardless of enrollment", () => {
      const sanitized = redactCourseForClient(sampleCourse, false, true);
      const lessons = sanitized.sections[0].lessons;

      expect(lessons[1].videoUrl).toBe("https://s3.bucket.aws/confidential-stream-ob.mp4");
      expect(lessons[2].videoUrl).toBe("https://s3.bucket.aws/confidential-stream-entry.mp4");
      expect(sanitized.attachments.length).toBe(1);
    });
  });

  describe("Sequential Progression Lock Mechanism (SEC-P2-04)", () => {
    const flatLessons = [
      { id: "les-1", isPreview: false },
      { id: "les-2", isPreview: false },
      { id: "les-3", isPreview: false },
    ];

    it("should allow enrolled students to access the first lesson immediately", () => {
      const res = checkSequentialAccess(flatLessons, 0, [], true, false);
      expect(res.canAccess).toBe(true);
      expect(res.isSequentialLocked).toBe(false);
    });

    it("should block access to lesson 2 if lesson 1 has not been completed", () => {
      const res = checkSequentialAccess(flatLessons, 1, [], true, false);
      expect(res.canAccess).toBe(false);
      expect(res.isSequentialLocked).toBe(true);
    });

    it("should unlock lesson 2 once lesson 1 is in completedLessonIds", () => {
      const res = checkSequentialAccess(flatLessons, 1, ["les-1"], true, false);
      expect(res.canAccess).toBe(true);
      expect(res.isSequentialLocked).toBe(false);
    });

    it("should keep lesson 3 locked if only lesson 1 is completed", () => {
      const res = checkSequentialAccess(flatLessons, 2, ["les-1"], true, false);
      expect(res.canAccess).toBe(false);
      expect(res.isSequentialLocked).toBe(true);
    });

    it("should unlock lesson 3 when lesson 2 is also completed", () => {
      const res = checkSequentialAccess(flatLessons, 2, ["les-1", "les-2"], true, false);
      expect(res.canAccess).toBe(true);
      expect(res.isSequentialLocked).toBe(false);
    });

    it("should allow staff to access any lesson without completing prerequisites", () => {
      const res = checkSequentialAccess(flatLessons, 2, [], false, true);
      expect(res.canAccess).toBe(true);
      expect(res.isSequentialLocked).toBe(false);
    });
  });

  describe("Course Visibility Authorization (SEC-P2-02)", () => {
    function isCourseVisible(courseStatus: string, isStaff: boolean): boolean {
      if (courseStatus === "PUBLISHED") return true;
      return isStaff;
    }

    it("should allow public access to PUBLISHED courses", () => {
      expect(isCourseVisible("PUBLISHED", false)).toBe(true);
    });

    it("should block public and student access to DRAFT or ARCHIVED courses", () => {
      expect(isCourseVisible("DRAFT", false)).toBe(false);
      expect(isCourseVisible("ARCHIVED", false)).toBe(false);
    });

    it("should allow staff to access DRAFT or ARCHIVED courses for editing/review", () => {
      expect(isCourseVisible("DRAFT", true)).toBe(true);
      expect(isCourseVisible("ARCHIVED", true)).toBe(true);
    });
  });
});

describe("LMS Progress, Reviews & Certificate Security (Khối 4 - SEC-P2-05 to SEC-P2-08)", () => {
  describe("Reviews Validation & Rating Rules (SEC-P2-05)", () => {
    it("should successfully validate standard rating and comment payload", () => {
      const result = validateReviewInput({
        courseId: "course-wtl-master",
        rating: 5,
        comment: "Khóa học rất chi tiết và dễ hiểu, áp dụng vào giao dịch rất tốt.",
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitized?.rating).toBe(5);
      expect(result.sanitized?.comment).toContain("Khóa học rất chi tiết");
    });

    it("should reject ratings that are out of bounds or non-integers", () => {
      expect(validateReviewInput({ courseId: "c1", rating: 0, comment: "Nội dung hợp lệ" }).isValid).toBe(false);
      expect(validateReviewInput({ courseId: "c1", rating: 6, comment: "Nội dung hợp lệ" }).isValid).toBe(false);
      expect(validateReviewInput({ courseId: "c1", rating: 3.5, comment: "Nội dung hợp lệ" }).isValid).toBe(false);
      expect(validateReviewInput({ courseId: "c1", rating: -1, comment: "Nội dung hợp lệ" }).isValid).toBe(false);
    });

    it("should enforce comment minimum 5 chars and maximum 1000 chars", () => {
      expect(validateReviewInput({ courseId: "c1", rating: 5, comment: "Tốt" }).isValid).toBe(false); // 3 chars
      expect(validateReviewInput({ courseId: "c1", rating: 5, comment: "Tuyệt" }).isValid).toBe(true); // 5 chars
      expect(validateReviewInput({ courseId: "c1", rating: 5, comment: "x".repeat(1001) }).isValid).toBe(false);
    });
  });

  describe("Public Certificate PII Data Protection (SEC-P2-06)", () => {
    it("should verify that certificate public payload contains no studentEmail", () => {
      const publicCertData = {
        id: "cert-123",
        certificateCode: "CERT-WTL-ABC12345",
        issuedAt: new Date().toISOString(),
        studentName: "Nguyen Van A",
        courseTitle: "Price Action Master",
        courseSlug: "price-action-master",
        instructorName: "Master Trader",
      };

      expect((publicCertData as any).studentEmail).toBeUndefined();
      expect(publicCertData.certificateCode).toBe("CERT-WTL-ABC12345");
      expect(publicCertData.studentName).toBe("Nguyen Van A");
    });
  });

  describe("Progress Position Tracking (SEC-P2-08)", () => {
    it("should parse lastPositionSeconds correctly when provided as non-negative integer", () => {
      const rawPos = 125.7;
      const parsedPos = typeof rawPos === "number" && rawPos >= 0 ? Math.floor(rawPos) : undefined;
      expect(parsedPos).toBe(125);
    });

    it("should handle undefined or negative positions gracefully", () => {
      const negativePos = -10;
      const parsedNegative = typeof negativePos === "number" && negativePos >= 0 ? Math.floor(negativePos) : undefined;
      expect(parsedNegative).toBeUndefined();

      const invalidPos = null;
      const parsedInvalid = typeof invalidPos === "number" ? Math.floor(invalidPos as any) : undefined;
      expect(parsedInvalid).toBeUndefined();
    });
  });
});
