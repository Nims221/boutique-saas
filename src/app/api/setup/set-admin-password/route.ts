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

export async function GET(req: Request) {
  let conn: mysql.Connection | null = null;

  try {
    const { searchParams } = new URL(req.url);

    const email = String(searchParams.get("email") || "").trim().toLowerCase();
    const password = String(searchParams.get("password") || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email et mot de passe obligatoires." },
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
      `SELECT id, email FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
      `
      UPDATE users
      SET password_hash = ?, is_active = 1
      WHERE email = ?
      `,
      [hashedPassword, email]
    );

    return NextResponse.json({
      success: true,
      message: "Mot de passe défini avec succès.",
      email,
    });
  } catch (error) {
    console.error("set-password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur pendant la mise à jour du mot de passe.",
      },
      { status: 500 }
    );
  } finally {
    if (conn) await conn.end();
  }
}