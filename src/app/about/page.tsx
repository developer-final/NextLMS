import { resolveServerNiche } from "@/lib/server-niche";
import AboutClient from "./AboutClient";

export const dynamic = "force-dynamic";

interface AboutPageProps {
  searchParams?: Promise<{
    niche?: string;
    brand?: string;
    teacher?: string;
  }>;
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const { nicheConfig } = await resolveServerNiche(resolvedParams);

  return <AboutClient nicheConfig={nicheConfig} />;
}
