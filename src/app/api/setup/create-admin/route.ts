import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return POST(new Request("http://localhost"));
}

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "boutique_saas",
  };
}

export async function POST(req: Request) {
  let conn: mysql.Connection | null = null;

  try {
    const body = await req.json();

    const fullName = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Nom, email et mot de passe obligatoires." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Le mot de passe doit contenir au moins 6 caractères.",
        },
        { status: 400 }
      );
    }

    conn = await mysql.createConnection(getDbConfig());

    const [existing] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Un utilisateur avec cet email existe déjà.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
      `
      INSERT INTO users (shop_id, full_name, email, password_hash, role, is_active)
      VALUES (1, ?, ?, ?, 'admin', 1)
      `,
      [fullName, email, hashedPassword]
    );

    return NextResponse.json({
      success: true,
      message: "Administrateur créé avec succès.",
    });
  } catch (error) {
    console.error("create-admin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur pendant la création de l'admin.",
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}