import { NextResponse } from "next/server";
import {
  VIETNAM_BANKS,
  getPopularBanks,
  getOtherBanks,
} from "@/lib/vietnam-banks";

export async function GET() {
  return NextResponse.json({
    success: true,
    total: VIETNAM_BANKS.length,
    popularBanks: getPopularBanks(),
    otherBanks: getOtherBanks(),
    banks: VIETNAM_BANKS,
  });
}
