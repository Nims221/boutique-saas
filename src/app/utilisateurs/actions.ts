"use server";

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../lib/auth";

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "boutique_saas",
  };
}

export async function createUserAction(
  _: { success: boolean; message: string },
  formData: FormData
) {
  await requireRole(["admin"]);

  let conn: mysql.Connection | null = null;

  try {
    const fullName = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "seller") as
      | "admin"
      | "manager"
      | "seller";

    if (!fullName || !email || !password) {
      return {
        success: false,
        message: "Nom, email et mot de passe obligatoires.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      };
    }

    conn = await mysql.createConnection(getDbConfig());

    const [existing] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (existing.length > 0) {
      return {
        success: false,
        message: "Un utilisateur avec cet email existe déjà.",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await conn.execute(
      `
      INSERT INTO users (shop_id, full_name, email, password_hash, role, is_active)
      VALUES (1, ?, ?, ?, ?, 1)
      `,
      [fullName, email, passwordHash, role]
    );

    revalidatePath("/utilisateurs");

    return {
      success: true,
      message: "Utilisateur créé avec succès.",
    };
  } catch (error) {
    console.error("createUserAction error:", error);

    return {
      success: false,
      message: "Erreur serveur pendant la création.",
    };
  } finally {
    if (conn) await conn.end();
  }
}

export async function toggleUserStatusAction(formData: FormData) {
  await requireRole(["admin"]);

  let conn: mysql.Connection | null = null;

  try {
    const id = Number(formData.get("id"));
    const nextStatus = Number(formData.get("next_status"));

    conn = await mysql.createConnection(getDbConfig());

    await conn.execute(
      `UPDATE users SET is_active = ? WHERE id = ?`,
      [nextStatus, id]
    );

    revalidatePath("/utilisateurs");
  } catch (error) {
    console.error("toggleUserStatusAction error:", error);
  } finally {
    if (conn) await conn.end();
  }
}