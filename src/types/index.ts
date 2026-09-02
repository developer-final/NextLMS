export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ContentType = "VIDEO_YOUTUBE" | "VIDEO_CDN" | "ARTICLE" | "QUIZ";
export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "BANK_TRANSFER_MANUAL" | "VIETQR_AUTO" | "STRIPE" | "FREE";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface CourseWithDetails {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  introVideoUrl?: string | null;
  price: number;
  salePrice?: number | null;
  level: CourseLevel;
  status: CourseStatus;
  isFeatured: boolean;
  isFree: boolean;
  certificateEnabled: boolean;
  createdAt: Date;
  instructor: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    headline?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  sections: {
    id: string;
    title: string;
    orderIndex: number;
    lessons: {
      id: string;
      title: string;
      slug: string;
      contentType: ContentType;
      videoDuration: number;
      isPreview: boolean;
      orderIndex: number;
    }[];
  }[];
  _count?: {
    enrollments: number;
    reviews: number;
  };
}
