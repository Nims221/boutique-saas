import mysql from "mysql2/promise";

export type AppUser = {
  id: number;
  shop_id: number;
  full_name: string;
  email: string;
  role: "admin" | "manager" | "seller";
  is_active: number;
  created_at: string;
  updated_at: string;
};

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "boutique_saas",
  };
}

export async function getUsers() {
  const conn = await mysql.createConnection(getDbConfig());

  try {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT id, shop_id, full_name, email, role, is_active, created_at, updated_at
      FROM users
      ORDER BY id DESC
      `
    );

    return rows as AppUser[];
  } finally {
    await conn.end();
  }
}