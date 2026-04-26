import mysql from "mysql2/promise";

export type StockSummaryItem = {
  label: string;
  value: number | string;
  tone: "neutral" | "warning" | "danger" | "success";
};

export type StockProductItem = {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  stock: number;
  minStock: number;
  status: "available" | "low" | "critical";
};

export type StockMovementItem = {
  id: number;
  productName: string;
  sku: string;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  referenceType: string | null;
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

function getStatus(stock: number, minStock: number): "available" | "low" | "critical" {
  if (stock <= 0) return "critical";
  if (stock <= minStock) return "low";
  return "available";
}

export async function getStockPageData(shopId = 1) {
  const conn = await mysql.createConnection(getDbConfig());

  try {
    const [summaryRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        COUNT(*) AS total_products,
        SUM(CASE WHEN stock_quantity <= min_stock THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) AS critical_count,
        COALESCE(SUM(stock_quantity), 0) AS total_units
      FROM products
      WHERE shop_id = ? AND is_active = 1
      `,
      [shopId]
    );

    const summaryRow = summaryRows[0];

    const [productRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        c.name AS category_name,
        p.stock_quantity,
        p.min_stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.shop_id = ?
        AND p.is_active = 1
      ORDER BY p.stock_quantity ASC, p.name ASC
      `,
      [shopId]
    );

    const products: StockProductItem[] = productRows.map((row) => {
      const stock = Number(row.stock_quantity || 0);
      const minStock = Number(row.min_stock || 0);

      return {
        id: Number(row.id),
        name: String(row.name),
        sku: String(row.sku),
        category: row.category_name ? String(row.category_name) : null,
        stock,
        minStock,
        status: getStatus(stock, minStock),
      };
    });

    const [movementRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        sm.id,
        p.name AS product_name,
        p.sku,
        sm.movement_type,
        sm.quantity,
        sm.reference_type,
        sm.note,
        sm.created_at
      FROM stock_movements sm
      INNER JOIN products p ON p.id = sm.product_id
      WHERE sm.shop_id = ?
      ORDER BY sm.created_at DESC
      LIMIT 10
      `,
      [shopId]
    );

    const movements: StockMovementItem[] = movementRows.map((row) => ({
      id: Number(row.id),
      productName: String(row.product_name),
      sku: String(row.sku),
      movementType: String(row.movement_type) as "in" | "out" | "adjustment",
      quantity: Number(row.quantity || 0),
      referenceType: row.reference_type ? String(row.reference_type) : null,
      note: row.note ? String(row.note) : null,
      createdAt: String(row.created_at),
    }));

    const summary: StockSummaryItem[] = [
      {
        label: "Produits actifs",
        value: Number(summaryRow?.total_products || 0),
        tone: "neutral",
      },
      {
        label: "Stock faible",
        value: Number(summaryRow?.low_stock_count || 0),
        tone: "warning",
      },
      {
        label: "Stock critique",
        value: Number(summaryRow?.critical_count || 0),
        tone: "danger",
      },
      {
        label: "Unités en stock",
        value: Number(summaryRow?.total_units || 0),
        tone: "success",
      },
    ];

    return {
      summary,
      products,
      movements,
    };
  } finally {
    await conn.end();
  }
}