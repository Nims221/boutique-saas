import mysql from "mysql2/promise";
import { unstable_noStore as noStore } from "next/cache";

export type ReapproSummaryItem = {
  label: string;
  value: number | string;
  tone: "neutral" | "warning" | "danger" | "success";
};

export type ReapproProductItem = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  stock: number;
  minStock: number;
  costPrice: number;
  imageUrl: string | null;
};

export type ReapproMovementItem = {
  id: number;
  productName: string;
  sku: string;
  quantity: number;
  note: string | null;
  createdAt: string;
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

export async function getReapproPageData(shopId = 1) {
  noStore();

  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection(getDbConfig());

    const [productSummaryRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        COUNT(*) AS total_products,
        SUM(CASE WHEN stock_quantity <= min_stock THEN 1 ELSE 0 END) AS low_stock_count,
        COALESCE(SUM(stock_quantity), 0) AS total_units
      FROM products
      WHERE shop_id = ?
        AND is_active = 1
      `,
      [shopId]
    );

    const [receivedTodayRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        COALESCE(SUM(quantity), 0) AS received_today
      FROM stock_movements
      WHERE shop_id = ?
        AND movement_type = 'in'
        AND DATE(created_at) = CURDATE()
      `,
      [shopId]
    );

    const [productRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        c.name AS category_name,
        p.stock_quantity,
        p.min_stock,
        p.cost_price,
        p.image_url
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.shop_id = ?
        AND p.is_active = 1
      ORDER BY p.name ASC
      `,
      [shopId]
    );

    const [movementRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        sm.id,
        p.name AS product_name,
        p.sku,
        sm.quantity,
        sm.note,
        sm.created_at
      FROM stock_movements sm
      INNER JOIN products p ON p.id = sm.product_id
      WHERE sm.shop_id = ?
        AND sm.movement_type = 'in'
      ORDER BY sm.created_at DESC
      LIMIT 10
      `,
      [shopId]
    );

    const productSummary = productSummaryRows[0];
    const receivedSummary = receivedTodayRows[0];

    const summary: ReapproSummaryItem[] = [
      {
        label: "Produits suivis",
        value: Number(productSummary?.total_products || 0),
        tone: "neutral",
      },
      {
        label: "Stock faible",
        value: Number(productSummary?.low_stock_count || 0),
        tone: "warning",
      },
      {
        label: "Unités en stock",
        value: Number(productSummary?.total_units || 0),
        tone: "success",
      },
      {
        label: "Entrées aujourd'hui",
        value: Number(receivedSummary?.received_today || 0),
        tone: "neutral",
      },
    ];

    const products: ReapproProductItem[] = productRows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      sku: String(row.sku),
      category: row.category_name ? String(row.category_name) : null,
      stock: Number(row.stock_quantity || 0),
      minStock: Number(row.min_stock || 0),
      costPrice: Number(row.cost_price || 0),
      imageUrl: row.image_url ? String(row.image_url) : null,
    }));

    const movements: ReapproMovementItem[] = movementRows.map((row) => ({
      id: Number(row.id),
      productName: String(row.product_name),
      sku: String(row.sku),
      quantity: Number(row.quantity || 0),
      note: row.note ? String(row.note) : null,
      createdAt: String(row.created_at),
    }));

    return {
      summary,
      products,
      movements,
    };
  } catch (error) {
    console.error("getReapproPageData error:", error);

    return {
      summary: [
        { label: "Produits suivis", value: 0, tone: "neutral" as const },
        { label: "Stock faible", value: 0, tone: "warning" as const },
        { label: "Unités en stock", value: 0, tone: "success" as const },
        { label: "Entrées aujourd'hui", value: 0, tone: "neutral" as const },
      ],
      products: [],
      movements: [],
    };
  } finally {
    if (conn) {
      await conn.end().catch(() => {});
    }
  }
}