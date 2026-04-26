"use server";

import mysql from "mysql2/promise";

type ProductPayload = {
  id?: number;
  name: string;
  categoryId?: number | null;
  brandId?: number | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string | null;
  phoneSimType: "none" | "sim" | "esim" | "sim_esim";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSkuPrefix(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0] + (words[1][1] || "X")).toUpperCase();
  }

  const first = (words[0] || "PRD").slice(0, 3).toUpperCase();
  return first.padEnd(3, "X");
}

function generateSku(name: string, id: number) {
  const prefix = buildSkuPrefix(name);
  return `${prefix}-${String(id).padStart(4, "0")}`;
}

function inferSerialType(categoryName?: string | null): "none" | "imei" | "serial" {
  if (!categoryName) return "none";

  const normalized = categoryName.toLowerCase();

  if (normalized.includes("iphone") || normalized.includes("telephone") || normalized.includes("téléphone")) {
    return "imei";
  }

  if (
    normalized.includes("ipad") ||
    normalized.includes("watch") ||
    normalized.includes("mac") ||
    normalized.includes("tablette") ||
    normalized.includes("ordinateur")
  ) {
    return "serial";
  }

  return "none";
}

async function getCategoryName(
  conn: mysql.Connection,
  shopId: number,
  categoryId?: number | null
) {
  if (!categoryId) return null;

  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `
    SELECT name
    FROM categories
    WHERE id = ? AND shop_id = ?
    LIMIT 1
    `,
    [categoryId, shopId]
  );

  return rows[0]?.name ? String(rows[0].name) : null;
}

async function generateUniqueSlug(
  conn: mysql.Connection,
  shopId: number,
  name: string,
  excludeId?: number
) {
  const baseSlug = slugify(name);
  let slug = baseSlug || `product-${Date.now()}`;
  let counter = 1;

  while (true) {
    const params: Array<string | number> = [shopId, slug];
    let sql = `
      SELECT id
      FROM products
      WHERE shop_id = ?
        AND slug = ?
    `;

    if (excludeId) {
      sql += ` AND id <> ?`;
      params.push(excludeId);
    }

    sql += ` LIMIT 1`;

    const [rows] = await conn.query<mysql.RowDataPacket[]>(sql, params);

    if (rows.length === 0) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

export async function createProductAction(payload: ProductPayload) {
  let conn: mysql.Connection | null = null;

  try {
    const shopId = 1;

    if (!payload.name.trim()) {
      return { success: false, message: "Le nom du produit est obligatoire." };
    }

    if (payload.price <= 0) {
      return { success: false, message: "Le prix de vente doit être supérieur à 0." };
    }

    conn = await mysql.createConnection(getDbConfig());

    const categoryName = await getCategoryName(conn, shopId, payload.categoryId);
    const serialType = inferSerialType(categoryName);
    const phoneSimType = serialType === "imei" ? payload.phoneSimType : "none";
    const slug = await generateUniqueSlug(conn, shopId, payload.name.trim());

    // Vérifier si le produit existe déjà
const [existingProduct] = await conn.query<any[]>(
  `
  SELECT id, name
  FROM products
  WHERE shop_id = ? AND LOWER(name) = LOWER(?)
  LIMIT 1
  `,
  [shopId, payload.name.trim()]
);

if (existingProduct.length > 0) {
  return {
    success: false,
    message: "Ce produit existe déjà. Veuillez plutôt mettre à jour le stock.",
  };
}

    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `
      INSERT INTO products (
        shop_id,
        category_id,
        brand_id,
        sku,
        name,
        slug,
        image_url,
        serial_type,
        phone_sim_type,
        cost_price,
        selling_price,
        min_stock,
        stock_quantity,
        is_active,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `,
      [
        shopId,
        payload.categoryId || null,
        payload.brandId || null,
        payload.name.trim(),
        slug,
        payload.imageUrl?.trim() || null,
        serialType,
        phoneSimType,
        payload.costPrice || 0,
        payload.price,
        payload.minStock || 0,
        payload.stock || 0,
      ]
    );

    const productId = result.insertId;
    const sku = generateSku(payload.name.trim(), productId);

    await conn.execute(
      `
      UPDATE products
      SET sku = ?
      WHERE id = ? AND shop_id = ?
      `,
      [sku, productId, shopId]
    );

    return {
      success: true,
      message: "Produit créé avec succès.",
    };
  } catch (error) {
    console.error("createProductAction error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erreur pendant la création du produit.",
    };
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

export async function updateProductAction(payload: ProductPayload) {
  let conn: mysql.Connection | null = null;

  try {
    const shopId = 1;

    if (!payload.id) {
      return { success: false, message: "Produit invalide." };
    }

    if (!payload.name.trim()) {
      return { success: false, message: "Le nom du produit est obligatoire." };
    }

    if (payload.price <= 0) {
      return { success: false, message: "Le prix de vente doit être supérieur à 0." };
    }

    conn = await mysql.createConnection(getDbConfig());

    const categoryName = await getCategoryName(conn, shopId, payload.categoryId);
    const serialType = inferSerialType(categoryName);
    const phoneSimType = serialType === "imei" ? payload.phoneSimType : "none";
    const slug = await generateUniqueSlug(conn, shopId, payload.name.trim(), payload.id);
    const sku = generateSku(payload.name.trim(), payload.id);

    await conn.execute(
      `
      UPDATE products
      SET
        category_id = ?,
        brand_id = ?,
        sku = ?,
        name = ?,
        slug = ?,
        image_url = ?,
        serial_type = ?,
        phone_sim_type = ?,
        cost_price = ?,
        selling_price = ?,
        min_stock = ?,
        stock_quantity = ?,
        updated_at = NOW()
      WHERE id = ? AND shop_id = ?
      `,
      [
        payload.categoryId || null,
        payload.brandId || null,
        sku,
        payload.name.trim(),
        slug,
        payload.imageUrl?.trim() || null,
        serialType,
        phoneSimType,
        payload.costPrice || 0,
        payload.price,
        payload.minStock || 0,
        payload.stock || 0,
        payload.id,
        shopId,
      ]
    );

    return {
      success: true,
      message: "Produit mis à jour avec succès.",
    };
  } catch (error) {
    console.error("updateProductAction error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erreur pendant la mise à jour du produit.",
    };
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

export async function toggleProductActiveAction(productId: number, active: boolean) {
  let conn: mysql.Connection | null = null;

  try {
    const shopId = 1;

    conn = await mysql.createConnection(getDbConfig());

    await conn.execute(
      `
      UPDATE products
      SET
        is_active = ?,
        updated_at = NOW()
      WHERE id = ? AND shop_id = ?
      `,
      [active ? 1 : 0, productId, shopId]
    );

    return {
      success: true,
      message: active ? "Produit activé." : "Produit désactivé.",
    };
  } catch (error) {
    console.error("toggleProductActiveAction error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erreur pendant le changement de statut.",
    };
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}