import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.AUTH_SECRET,
    secretPreview: process.env.AUTH_SECRET
      ? process.env.AUTH_SECRET.slice(0, 8)
      : null,
  });
}