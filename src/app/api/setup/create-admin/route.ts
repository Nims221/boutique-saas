import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "boutique_saas",
  };
}

// 🔥 GET = création automatique admin
export async function GET() {
  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection(getDbConfig());

    const email = "admin@boutique.local";
    const password = "admin123"; // 🔥 mot de passe simple pour test

    const [existing] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Admin existe déjà",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
      `
      INSERT INTO users (shop_id, full_name, email, password_hash, role, is_active)
      VALUES (1, ?, ?, ?, 'admin', 1)
      `,
      ["Admin", email, hashedPassword]
    );

    return NextResponse.json({
      success: true,
      message: "Admin créé",
      email,
      password,
    });
  } catch (error) {
    console.error("create-admin error:", error);

    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}

// 🔹 POST (tu peux garder si besoin)
export async function POST(req: Request) {
  return NextResponse.json({ success: false, message: "Utilise GET" });
}