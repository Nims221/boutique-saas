"use server";

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "../../lib/auth";

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "boutique_saas",
  };
}

export async function loginAction(
  _: { success: boolean; message: string },
  formData: FormData
) {
  let conn: mysql.Connection | null = null;

  try {
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return {
        success: false,
        message: "Email et mot de passe obligatoires.",
      };
    }

    conn = await mysql.createConnection(getDbConfig());

    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT id, full_name, email, password_hash, role, is_active
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return {
        success: false,
        message: "Identifiants invalides.",
      };
    }

    if (!Number(user.is_active)) {
      return {
        success: false,
        message: "Ce compte est désactivé.",
      };
    }

    if (!user.password_hash) {
      return {
        success: false,
        message: "Ce compte n'a pas encore de mot de passe configuré.",
      };
    }

    const isValid = await bcrypt.compare(password, String(user.password_hash));

    if (!isValid) {
      return {
        success: false,
        message: "Identifiants invalides.",
      };
    }

    await createSession({
      id: Number(user.id),
      name: String(user.full_name),
      email: String(user.email),
      role: String(user.role) as "admin" | "manager" | "seller",
    });
  } catch (error) {
    console.error("loginAction error:", error);
    return {
      success: false,
      message: "Erreur serveur pendant la connexion.",
    };
  } finally {
    if (conn) await conn.end();
  }

  redirect("/dashboard");
}