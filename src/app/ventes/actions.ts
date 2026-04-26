"use server";

import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";

type SaleItemInput = {
  id: number;
  quantity: number;
  unitPrice: number;
  serialNumbers?: string[];
};

type CreateSalePayload = {
  customer_name?: string | null;
  payment_method?: "cash" | "mobile_money" | "card" | "bank_transfer" | "mixed";
  notes?: string | null;
  items: SaleItemInput[];
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

async function generateSaleNumber(
  conn: mysql.Connection,
  shopId: number
): Promise<string> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM sales
    WHERE shop_id = ? AND DATE(created_at) = CURDATE()
    `,
    [shopId]
  );

  const count = Number(rows[0]?.total || 0) + 1;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const seq = String(count).padStart(3, "0");

  return `SL-${year}${month}${day}-${seq}`;
}

export async function createSaleAction(payload: CreateSalePayload) {
  let conn: mysql.Connection | null = null;

  try {
    if (!payload.items?.length) {
      return { success: false, message: "Le panier est vide." };
    }

    const shopId = 1;
    const paymentMethod = payload.payment_method || "cash";

    conn = await mysql.createConnection(getDbConfig());
    await conn.beginTransaction();

    const detailedItems: Array<{
      productId: number;
      name: string;
      quantity: number;
      stock: number;
      unitCost: number;
      unitPrice: number;
      lineTotal: number;
      serialType: "none" | "imei" | "serial";
      serialNumbers: string[];
    }> = [];

    for (const item of payload.items) {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        `
        SELECT
          p.id,
          p.name,
          p.stock_quantity,
          p.cost_price,
          p.selling_price,
          p.is_active,
          c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.shop_id = ?
        LIMIT 1
        `,
        [item.id, shopId]
      );

      const product = rows[0];

      if (!product) {
        throw new Error(`Produit introuvable (ID ${item.id}).`);
      }

      if (!Number(product.is_active)) {
        throw new Error(`${product.name} est inactif.`);
      }

      const serialType = inferSerialTypeFromCategory(product.category_name ? String(product.category_name) : null);
      const stock = Number(product.stock_quantity || 0);
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const serialNumbers = (item.serialNumbers || [])
        .map((v) => v.trim())
        .filter(Boolean);

      if (quantity <= 0) {
        throw new Error(`Quantité invalide pour ${product.name}.`);
      }

      if (stock < quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }

      if (unitPrice <= 0) {
        throw new Error(`Prix de vente invalide pour ${product.name}.`);
      }

      if (serialType !== "none") {
        if (serialNumbers.length !== quantity) {
          throw new Error(
            `${product.name} nécessite ${quantity} ${
              serialType === "imei" ? "IMEI" : "numéro(s) de série"
            }.`
          );
        }

        const normalizedSet = new Set(serialNumbers.map((v) => v.toLowerCase()));
        if (normalizedSet.size !== serialNumbers.length) {
          throw new Error(
            `${product.name} contient des ${
              serialType === "imei" ? "IMEI" : "numéros de série"
            } en double.`
          );
        }

        for (const serialNumber of serialNumbers) {
          const [existingSerialRows] = await conn.query<mysql.RowDataPacket[]>(
            `
            SELECT id
            FROM sale_item_serials
            WHERE serial_number = ?
            LIMIT 1
            `,
            [serialNumber]
          );

          if (existingSerialRows.length > 0) {
            throw new Error(
              `${serialType === "imei" ? "IMEI" : "Numéro de série"} déjà enregistré : ${serialNumber}`
            );
          }
        }
      }

      const unitCost = Number(product.cost_price || 0);
      const lineTotal = unitPrice * quantity;

      detailedItems.push({
        productId: Number(product.id),
        name: String(product.name),
        quantity,
        stock,
        unitCost,
        unitPrice,
        lineTotal,
        serialType,
        serialNumbers,
      });
    }

    const subtotal = detailedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = 0;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const saleNumber = await generateSaleNumber(conn, shopId);

    const [saleResult] = await conn.execute<mysql.ResultSetHeader>(
      `
      INSERT INTO sales (
        shop_id,
        sale_number,
        customer_name,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        sale_status,
        notes,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?, NOW(), NOW())
      `,
      [
        shopId,
        saleNumber,
        payload.customer_name || null,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        payload.notes || null,
      ]
    );

    const saleId = saleResult.insertId;

    for (const item of detailedItems) {
      const [saleItemResult] = await conn.execute<mysql.ResultSetHeader>(
        `
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          unit_cost,
          unit_price,
          line_total,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          saleId,
          item.productId,
          item.quantity,
          item.unitCost,
          item.unitPrice,
          item.lineTotal,
        ]
      );

      const saleItemId = saleItemResult.insertId;

      if (item.serialType !== "none") {
        for (const serialNumber of item.serialNumbers) {
          await conn.execute(
            `
            INSERT INTO sale_item_serials (
              sale_item_id,
              product_id,
              serial_number,
              serial_type,
              created_at
            )
            VALUES (?, ?, ?, ?, NOW())
            `,
            [saleItemId, item.productId, serialNumber, item.serialType]
          );
        }
      }

      await conn.execute(
        `
        UPDATE products
        SET
          stock_quantity = stock_quantity - ?,
          updated_at = NOW()
        WHERE id = ? AND shop_id = ?
        `,
        [item.quantity, item.productId, shopId]
      );

      await conn.execute(
        `
        INSERT INTO stock_movements (
          shop_id,
          product_id,
          movement_type,
          quantity,
          reference_type,
          reference_id,
          note,
          created_at
        )
        VALUES (?, ?, 'out', ?, 'sale', ?, ?, NOW())
        `,
        [
          shopId,
          item.productId,
          item.quantity,
          saleId,
          `Sortie vente ${saleNumber}`,
        ]
      );
    }

    await conn.commit();

    revalidatePath("/ventes");
    revalidatePath("/dashboard");
    revalidatePath("/stock");
    revalidatePath("/produits");

    return {
      success: true,
      message: `Vente ${saleNumber} enregistrée avec succès.`,
      saleId,
      saleNumber,
      totalAmount,
    };
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }

    console.error("createSaleAction error:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'enregistrement.",
    };
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}