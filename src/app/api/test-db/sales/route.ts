import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

type SaleRequestItem = {
  id: number;
  quantity: number;
  price: number;
};

type SaleRequestBody = {
  customer_name?: string;
  payment_method?: "cash" | "mobile_money" | "card" | "bank_transfer" | "mixed";
  notes?: string;
  total?: number;
  items: SaleRequestItem[];
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

async function generateSaleNumber(
  conn: mysql.Connection,
  shopId: number
): Promise<string> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `
    SELECT COUNT(*) AS total
    FROM sales
    WHERE shop_id = ? AND DATE(sale_date) = CURDATE()
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

export async function POST(req: Request) {
  let conn: mysql.Connection | null = null;

  try {
    const body = (await req.json()) as SaleRequestBody;

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Le panier est vide." },
        { status: 400 }
      );
    }

    const shopId = 1;
    const paymentMethod = body.payment_method || "cash";

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
    }> = [];

    for (const item of body.items) {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        `
        SELECT
          id,
          name,
          stock_quantity,
          cost_price,
          selling_price,
          is_active
        FROM products
        WHERE id = ? AND shop_id = ?
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

      const stock = Number(product.stock_quantity);
      const quantity = Number(item.quantity || 0);

      if (quantity <= 0) {
        throw new Error(`Quantité invalide pour ${product.name}.`);
      }

      if (stock < quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }

      const unitCost = Number(product.cost_price || 0);
      const unitPrice = Number(product.selling_price || item.price || 0);
      const lineTotal = unitPrice * quantity;

      detailedItems.push({
        productId: Number(product.id),
        name: String(product.name),
        quantity,
        stock,
        unitCost,
        unitPrice,
        lineTotal,
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
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?)
      `,
      [
        shopId,
        saleNumber,
        body.customer_name || null,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        body.notes || null,
      ]
    );

    const saleId = saleResult.insertId;

    for (const item of detailedItems) {
      await conn.execute(
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

      await conn.execute(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - ?
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

    return NextResponse.json({
      success: true,
      message: `Vente ${saleNumber} enregistrée avec succès.`,
      saleId,
      saleNumber,
      totalAmount,
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }

    console.error("API /api/sales error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'enregistrement.",
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}