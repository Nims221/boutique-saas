export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(request: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", request.url));
}