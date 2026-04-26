import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DB_HOST: process.env.DB_HOST || null,
    DB_PORT: process.env.DB_PORT || null,
    DB_USER: process.env.DB_USER || null,
    DB_PASSWORD_DEFINED: typeof process.env.DB_PASSWORD === "string",
    DB_NAME: process.env.DB_NAME || null,
  });
}