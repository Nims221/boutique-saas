import mysql from "mysql2/promise";

export type DashboardMetric = {
  label: string;
  value: number;
  delta: number;
  suffix?: string;
};

export type DashboardSalesPoint = {
  day: string;
  amount: number;
};

export type DashboardTopProduct = {
  rank: number;
  name: string;
  sku: string;
  amount: string;
  units: string;
  imageUrl?: string | null;
};

export type DashboardStockAlert = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  threshold: number;
  status: "low" | "critical";
};

export type DashboardActivityItem = {
  id: string;
  type: "sale" | "purchase";
  title: string;
  subtitle: string;
  amount?: number;
  time: string;
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

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfYesterday() {
  const today = startOfToday();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

function formatDayShort(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
    .format(date)
    .replace(".", "");
}

function relativeTimeFromDate(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) {
    if (current > 0) return 100;
    return 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} F CFA`;
}

export async function getDashboardData(shopId = 1) {
  const conn = await mysql.createConnection(getDbConfig());

  try {
    const today = startOfToday();
    const yesterday = startOfYesterday();

    const [todayRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS sales_count
      FROM sales
      WHERE shop_id = ?
        AND sale_status = 'completed'
        AND created_at >= ?
      `,
      [shopId, today]
    );

    const [yesterdayRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS sales_count
      FROM sales
      WHERE shop_id = ?
        AND sale_status = 'completed'
        AND created_at >= ?
        AND created_at < ?
      `,
      [shopId, yesterday, today]
    );

    const todayRevenue = Number(todayRows[0]?.revenue || 0);
    const todaySalesCount = Number(todayRows[0]?.sales_count || 0);
    const yesterdayRevenue = Number(yesterdayRows[0]?.revenue || 0);
    const yesterdaySalesCount = Number(yesterdayRows[0]?.sales_count || 0);

    const todayAverageBasket =
      todaySalesCount > 0 ? Math.round(todayRevenue / todaySalesCount) : 0;
    const yesterdayAverageBasket =
      yesterdaySalesCount > 0
        ? Math.round(yesterdayRevenue / yesterdaySalesCount)
        : 0;

    const [lowStockRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE shop_id = ?
        AND is_active = 1
        AND stock_quantity <= min_stock
      `,
      [shopId]
    );

    const lowStockCount = Number(lowStockRows[0]?.total || 0);

    const [sevenDaysRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        DATE(created_at) AS sale_day,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM sales
      WHERE shop_id = ?
        AND sale_status = 'completed'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY sale_day ASC
      `,
      [shopId]
    );

    const salesMap = new Map<string, number>();
    for (const row of sevenDaysRows) {
      const key = new Date(row.sale_day).toISOString().slice(0, 10);
      salesMap.set(key, Number(row.revenue || 0));
    }

    const salesTrend: DashboardSalesPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);

      salesTrend.push({
        day: formatDayShort(d),
        amount: salesMap.get(key) || 0,
      });
    }

    const totalSales = salesTrend.reduce((sum, item) => sum + item.amount, 0);
    const averageSales =
      salesTrend.length > 0 ? Math.round(totalSales / salesTrend.length) : 0;

    const [topProductsRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.image_url,
        COALESCE(SUM(si.quantity), 0) AS quantity_sold,
        COALESCE(SUM(si.line_total), 0) AS revenue
      FROM sale_items si
      INNER JOIN sales s ON s.id = si.sale_id
      INNER JOIN products p ON p.id = si.product_id
      WHERE s.shop_id = ?
        AND s.sale_status = 'completed'
      GROUP BY p.id, p.name, p.sku, p.image_url
      ORDER BY revenue DESC, quantity_sold DESC
      LIMIT 5
      `,
      [shopId]
    );

    const topProducts: DashboardTopProduct[] = topProductsRows.map((row, index) => ({
      rank: index + 1,
      name: String(row.name),
      sku: String(row.sku),
      amount: formatAmount(Number(row.revenue || 0)),
      units: `${Number(row.quantity_sold || 0)} unité${
        Number(row.quantity_sold || 0) > 1 ? "s" : ""
      }`,
      imageUrl: row.image_url ? String(row.image_url) : null,
    }));

    const [stockAlertRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        id,
        name,
        sku,
        stock_quantity,
        min_stock
      FROM products
      WHERE shop_id = ?
        AND is_active = 1
        AND stock_quantity <= min_stock
      ORDER BY stock_quantity ASC, min_stock DESC, name ASC
      LIMIT 6
      `,
      [shopId]
    );

    const stockAlerts: DashboardStockAlert[] = stockAlertRows.map((row) => {
      const stock = Number(row.stock_quantity || 0);
      const threshold = Number(row.min_stock || 0);

      return {
        id: Number(row.id),
        name: String(row.name),
        sku: String(row.sku),
        stock,
        threshold,
        status: stock <= 0 ? "critical" : "low",
      };
    });

    const [recentSalesRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        id,
        sale_number,
        customer_name,
        total_amount,
        created_at
      FROM sales
      WHERE shop_id = ?
        AND sale_status = 'completed'
      ORDER BY created_at DESC
      LIMIT 4
      `,
      [shopId]
    );

    const [recentPurchaseRows] = await conn.query<mysql.RowDataPacket[]>(
      `
      SELECT
        po.id,
        po.po_number,
        s.name AS supplier_name,
        po.total_amount,
        po.created_at
      FROM purchase_orders po
      INNER JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.shop_id = ?
      ORDER BY po.created_at DESC
      LIMIT 4
      `,
      [shopId]
    );

    const saleActivities: DashboardActivityItem[] = recentSalesRows.map((row) => ({
      id: `sale-${row.id}`,
      type: "sale",
      title: String(row.sale_number),
      subtitle: row.customer_name
        ? `Vente • ${String(row.customer_name)}`
        : "Vente comptoir",
      amount: Number(row.total_amount || 0),
      time: relativeTimeFromDate(String(row.created_at)),
      createdAt: String(row.created_at),
    }));

    const purchaseActivities: DashboardActivityItem[] = recentPurchaseRows.map(
      (row) => ({
        id: `purchase-${row.id}`,
        type: "purchase",
        title: String(row.po_number),
        subtitle: `Commande fournisseur • ${String(row.supplier_name)}`,
        amount: Number(row.total_amount || 0),
        time: relativeTimeFromDate(String(row.created_at)),
        createdAt: String(row.created_at),
      })
    );

    const activity = [...saleActivities, ...purchaseActivities]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);

    const metrics: DashboardMetric[] = [
      {
        label: "CA aujourd'hui",
        value: todayRevenue,
        delta: percentDelta(todayRevenue, yesterdayRevenue),
        suffix: "F",
      },
      {
        label: "Ventes",
        value: todaySalesCount,
        delta: percentDelta(todaySalesCount, yesterdaySalesCount),
      },
      {
        label: "Panier moyen",
        value: todayAverageBasket,
        delta: percentDelta(todayAverageBasket, yesterdayAverageBasket),
        suffix: "F",
      },
      {
        label: "Stock faible",
        value: lowStockCount,
        delta: lowStockCount === 0 ? 0 : -Math.min(lowStockCount, 100),
      },
    ];

    return {
      metrics,
      salesTrend,
      salesSummary: {
        total: formatAmount(totalSales),
        average: formatAmount(averageSales),
      },
      topProducts,
      stockAlerts,
      activity,
    };
  } finally {
    await conn.end();
  }
}

export async function getDashboardPageData(shopId = 1) {
  return getDashboardData(shopId);
}

export async function getDashboard(shopId = 1) {
  return getDashboardData(shopId);
}

const dashboardService = {
  getDashboardData,
  getDashboardPageData,
  getDashboard,
};

export default dashboardService;