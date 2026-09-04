import { cookies, headers } from "next/headers";
import {
  NicheConfig,
  COOKIE_NICHE_KEY,
  COOKIE_BRAND_KEY,
  COOKIE_TEACHER_KEY,
  HEADER_NICHE_KEY,
  HEADER_BRAND_KEY,
  HEADER_TEACHER_KEY,
  resolveNicheConfig,
} from "./niches";

export interface ResolvedNicheInfo {
  nicheConfig: NicheConfig;
  activeNiche: string;
  activeBrand?: string;
  activeTeacher?: string;
}

function safeDecode(val: string | null | undefined): string | undefined {
  if (!val) return undefined;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export async function resolveServerNiche(searchParams?: {
  niche?: string;
  brand?: string;
  teacher?: string;
}): Promise<ResolvedNicheInfo> {
  const cookieStore = await cookies();
  const headersList = await headers();

  const rawNiche =
    searchParams?.niche ||
    headersList.get(HEADER_NICHE_KEY) ||
    cookieStore.get(COOKIE_NICHE_KEY)?.value ||
    "trading";

  const rawBrand =
    searchParams?.brand ||
    headersList.get(HEADER_BRAND_KEY) ||
    cookieStore.get(COOKIE_BRAND_KEY)?.value;

  const rawTeacher =
    searchParams?.teacher ||
    headersList.get(HEADER_TEACHER_KEY) ||
    cookieStore.get(COOKIE_TEACHER_KEY)?.value;

  const activeNiche = safeDecode(rawNiche) || "trading";
  const activeBrand = safeDecode(rawBrand);
  const activeTeacher = safeDecode(rawTeacher);

  const nicheConfig = resolveNicheConfig(
    activeNiche,
    activeBrand,
    activeTeacher
  );

  return {
    nicheConfig,
    activeNiche,
    activeBrand,
    activeTeacher,
  };
}
