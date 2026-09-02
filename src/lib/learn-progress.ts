export interface ProgressResult {
  progressPercent: number;
  isCompleted: boolean;
}

/**
 * Calculates course progress percentage based on completed and total lessons
 */
export function calculateCourseProgress(
  completedLessons: number,
  totalLessons: number
): ProgressResult {
  if (!totalLessons || totalLessons <= 0) {
    return { progressPercent: 0, isCompleted: false };
  }

  const safeCompleted = Math.max(0, completedLessons);
  const percent = Math.min(100, Math.round((safeCompleted / totalLessons) * 100));

  return {
    progressPercent: percent,
    isCompleted: percent >= 100,
  };
}

/**
 * Generates an encrypted/unique certificate code format
 */
export function generateCertificateCode(): string {
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `CERT-${randomPart}`;
}
