import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";

export type CreateSaleItemInput = {
  productId: number;
  quantity: number;
};

export type CreateSaleInput = {
  shopId?: number;
  customerName?: string;
  paymentMethod?: "cash" | "mobile_money" | "card" | "bank_transfer" | "mixed";
  notes?: string;
  items: CreateSaleItemInput[];
};

async function generateSaleNumber(
  conn: PoolConnection,
  shopId: number
): Promise<string> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM sales
    WHERE shop_id = ?
      AND DATE(sale_date) = CURDATE()
    `,
    [shopId]
  );

  const count = Number(rows[0]?.total || 0) + 1;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const seq = String(count).padStart(3, "0");

  return `SL-${y}${m}${d}-${seq}`;
}

export async function createSale(input: CreateSaleInput) {
  const shopId = input.shopId ?? 1;
  const paymentMethod = input.paymentMethod ?? "cash";

  if (!input.items.length) {
    throw new Error("Le panier est vide.");
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const detailedItems: Array<{
      productId: number;
      quantity: number;
      name: string;
      stock: number;
      unitCost: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    for (const item of input.items) {
      const [rows] = await conn.query<RowDataPacket[]>(
        `
        SELECT id, name, stock_quantity, cost_price, selling_price
        FROM products
        WHERE id = ? AND shop_id = ? AND is_active = 1
        LIMIT 1
        `,
        [item.productId, shopId]
      );

      const product = rows[0];
      if (!product) {
        throw new Error(`Produit introuvable (ID ${item.productId}).`);
      }

      const stock = Number(product.stock_quantity);
      if (item.quantity <= 0) {
        throw new Error(`Quantité invalide pour ${product.name}.`);
      }

      if (stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }

      const unitCost = Number(product.cost_price);
      const unitPrice = Number(product.selling_price);
      const lineTotal = unitPrice * item.quantity;

      detailedItems.push({
        productId: Number(product.id),
        quantity: item.quantity,
        name: String(product.name),
        stock,
        unitCost,
        unitPrice,
        lineTotal,
      });
    }

    const subtotal = detailedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = 0;
    const discountAmount = 0;
    const totalAmount = subtotal - discountAmount + taxAmount;
    const saleNumber = await generateSaleNumber(conn, shopId);

    const [saleResult] = await conn.query<ResultSetHeader>(
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
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?)
      `,
      [
        shopId,
        saleNumber,
        input.customerName || null,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        input.notes || null,
      ]
    );

    const saleId = saleResult.insertId;

    for (const item of detailedItems) {
      await conn.query(
        `
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          unit_cost,
          unit_price,
          line_total
        )
        VALUES (?, ?, ?, ?, ?, ?)
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

      await conn.query(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - ?
        WHERE id = ? AND shop_id = ?
        `,
        [item.quantity, item.productId, shopId]
      );

      await conn.query(
        `
        INSERT INTO stock_movements (
          shop_id,
          product_id,
          movement_type,
          quantity,
          reference_type,
          reference_id,
          note
        )
        VALUES (?, ?, 'out', ?, 'sale', ?, ?)
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

    return {
      success: true,
      saleId,
      saleNumber,
      totalAmount,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}