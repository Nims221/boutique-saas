import mysql from "mysql2/promise";
import { unstable_noStore as noStore } from "next/cache";

export type ProductCardItem = {
  id: number;
  name: string;
  sku: string;
  categoryId?: number | null;
  brandId?: number | null;
  category: string | null;
  brand: string | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  imageUrl: string | null;
  serialType: "none" | "imei" | "serial";
  phoneSimType: "none" | "sim" | "esim" | "sim_esim";
};

export type ProductSummaryItem = {
  label: string;
  value: number | string;
  tone: "neutral" | "warning" | "danger" | "success";
};

export type ProductOptionItem = {
  id: number;
  name: string;
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

function inferSerialTypeFromCategory(categoryName?: string | null): "none" | "imei" | "serial" {
  if (!categoryName) return "none";

  const c = categoryName.toLowerCase().trim();

  if (["iphone", "telephone", "téléphone"].includes(c)) return "imei";
  if (["ipad", "watch", "mac", "airpods"].includes(c)) return "serial";
  if (["accessoire", "airtag", "coque", "chargeur", "cable", "câble"].includes(c)) return "none";

  return "none";
}

function inferPhoneSimType(
  categoryName?: string | null,
  dbValue?: string | null
): "none" | "sim" | "esim" | "sim_esim" {
  const c = (categoryName || "").toLowerCase().trim();

  if (c !== "iphone" && c !== "telephone" && c !== "téléphone") {
    return "none";
  }

  const v = (dbValue || "none") as "none" | "sim" | "esim" | "sim_esim";
  return v;
}

function mapProduct(row: mysql.RowDataPacket): ProductCardItem {
  const category = row.category ? String(row.category) : null;
  const effectiveSerialType = inferSerialTypeFromCategory(category);
  const effectivePhoneSimType = inferPhoneSimType(category, row.phone_sim_type);

  return {
    id: Number(row.id),
    name: String(row.name),
    sku: String(row.sku),
    categoryId: row.category_id ? Number(row.category_id) : null,
    brandId: row.brand_id ? Number(row.brand_id) : null,
    category,
    brand: row.brand ? String(row.brand) : null,
    price: Number(row.price || 0),
    costPrice: Number(row.cost_price || 0),
    stock: Number(row.stock || 0),
    minStock: Number(row.min_stock || 0),
    active: Boolean(row.active),
    imageUrl: row.image_url ? String(row.image_url) : null,
    serialType: effectiveSerialType,
    phoneSimType: effectivePhoneSimType,
  };
}

export async function getProductsForSales(shopId = 1): Promise<ProductCardItem[]> {
  noStore();

  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection(getDbConfig());

    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.category_id,
        p.brand_id,
        c.name AS category,
        b.name AS brand,
        p.selling_price AS price,
        p.cost_price,
        p.stock_quantity AS stock,
        p.min_stock,
        p.is_active AS active,
        p.image_url AS image_url,
        p.serial_type AS serial_type,
        p.phone_sim_type AS phone_sim_type
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.shop_id = ?
        AND p.is_active = 1
      ORDER BY p.name ASC
      `,
      [shopId]
    );

    return rows.map(mapProduct);
  } catch (error) {
    console.error("getProductsForSales error:", error);
    return [];
  } finally {
    if (conn) {
      await conn.end().catch(() => {});
    }
  }
}

export async function getProductsPageData(shopId = 1) {
  noStore();

  let conn: mysql.Connection | null = null;

  try {
    conn = await mysql.createConnection(getDbConfig());

    const [summaryRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        COUNT(*) AS total_products,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_products,
        SUM(CASE WHEN stock_quantity <= min_stock THEN 1 ELSE 0 END) AS low_stock_count,
        COALESCE(SUM(selling_price * stock_quantity), 0) AS inventory_value
      FROM products
      WHERE shop_id = ?
      `,
      [shopId]
    );

    const [productRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.category_id,
        p.brand_id,
        c.name AS category,
        b.name AS brand,
        p.selling_price AS price,
        p.cost_price,
        p.stock_quantity AS stock,
        p.min_stock,
        p.is_active AS active,
        p.image_url AS image_url,
        p.serial_type AS serial_type,
        p.phone_sim_type AS phone_sim_type
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE p.shop_id = ?
      ORDER BY p.created_at DESC, p.id DESC
      `,
      [shopId]
    );

    const [categoryRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT id, name
      FROM categories
      WHERE shop_id = ?
        AND is_active = 1
      ORDER BY name ASC
      `,
      [shopId]
    );

    const [brandRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT id, name
      FROM brands
      WHERE shop_id = ?
        AND is_active = 1
      ORDER BY name ASC
      `,
      [shopId]
    );

    const row = summaryRows[0];

    const summary: ProductSummaryItem[] = [
      {
        label: "Références actives",
        value: Number(row?.active_products || 0),
        tone: "success",
      },
      {
        label: "Catalogue total",
        value: Number(row?.total_products || 0),
        tone: "neutral",
      },
      {
        label: "Stock faible",
        value: Number(row?.low_stock_count || 0),
        tone: "warning",
      },
      {
        label: "Valeur stock",
        value: `${new Intl.NumberFormat("fr-FR").format(
          Number(row?.inventory_value || 0)
        )} F`,
        tone: "neutral",
      },
    ];

    const products: ProductCardItem[] = productRows.map(mapProduct);

    const categories: ProductOptionItem[] = categoryRows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
    }));

    const brands: ProductOptionItem[] = brandRows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
    }));

    return {
      summary,
      products,
      categories,
      brands,
    };
  } catch (error) {
    console.error("getProductsPageData error:", error);

    return {
      summary: [
        { label: "Références actives", value: 0, tone: "success" as const },
        { label: "Catalogue total", value: 0, tone: "neutral" as const },
        { label: "Stock faible", value: 0, tone: "warning" as const },
        { label: "Valeur stock", value: "0 F", tone: "neutral" as const },
      ],
      products: [],
      categories: [],
      brands: [],
    };
  } finally {
    if (conn) {
      await conn.end().catch(() => {});
    }
  }
}