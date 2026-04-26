"use server";

import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";

type CreateStockEntryPayload = {
  productId: number;
  quantity: number;
  costPrice?: number | null;
  note?: string | null;
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

export async function createStockEntryAction(payload: CreateStockEntryPayload) {
  let conn: mysql.Connection | null = null;

  try {
    const shopId = 1;

    if (!payload.productId) {
      return { success: false, message: "Produit invalide." };
    }

    if (!payload.quantity || payload.quantity <= 0) {
      return { success: false, message: "Quantité invalide." };
    }

    conn = await mysql.createConnection(getDbConfig());
    await conn.beginTransaction();

    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        id,
        name,
        stock_quantity,
        cost_price,
        is_active
      FROM products
      WHERE id = ? AND shop_id = ?
      LIMIT 1
      `,
      [payload.productId, shopId]
    );

    const product = rows[0];

    if (!product) {
      throw new Error("Produit introuvable.");
    }

    if (!Number(product.is_active)) {
      throw new Error("Ce produit est inactif.");
    }

    const nextCostPrice =
      payload.costPrice && payload.costPrice > 0
        ? payload.costPrice
        : Number(product.cost_price || 0);

    await conn.execute(
      `
      UPDATE products
      SET
        stock_quantity = stock_quantity + ?,
        cost_price = ?,
        updated_at = NOW()
      WHERE id = ? AND shop_id = ?
      `,
      [payload.quantity, nextCostPrice, payload.productId, shopId]
    );

    await conn.execute(
      `
      INSERT INTO stock_movements (
        shop_id,
        product_id,
        movement_type,
        quantity,
        reference_type,
        note
      )
      VALUES (?, ?, 'in', ?, 'manual_entry', ?)
      `,
      [
        shopId,
        payload.productId,
        payload.quantity,
        payload.note?.trim() || "Entrée de stock manuelle",
      ]
    );

    await conn.commit();

    revalidatePath("/reappro");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/ventes");
    revalidatePath("/produits");

    return {
      success: true,
      message: `Entrée de stock enregistrée pour ${product.name}.`,
    };
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }

    console.error("createStockEntryAction error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'entrée de stock.",
    };
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}