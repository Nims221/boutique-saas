export type MetricItem = {
  label: string;
  value: number;
  delta: number;
  suffix?: string;
};

export type SalesTrendPoint = {
  name: string;
  sales: number;
};

export type TopProductItem = {
  id: number;
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
};

export type StockAlertItem = {
  id: number;
  sku: string;
  name: string;
  stock: number;
  threshold: number;
  status: "low" | "critical";
};

export type StockItem = {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  threshold: number;
  status: "available" | "low" | "critical";
  price?: string | number;
};

export type ActivityItem = {
  id: number;
  type: "sale" | "purchase" | "alert";
  title: string;
  subtitle: string;
  amount?: string;
  time: string;
};

export function getDashboardData() {
  const metrics: MetricItem[] = [
    {
      label: "CA aujourd'hui",
      value: 5680000,
      delta: 12,
      suffix: "F",
    },
    {
      label: "Ventes",
      value: 24,
      delta: 8,
    },
    {
      label: "Panier moyen",
      value: 236000,
      delta: 5,
      suffix: "F",
    },
    {
      label: "Stock faible",
      value: 7,
      delta: -2,
    },
  ];

  const salesTrend: SalesTrendPoint[] = [
    { name: "Lun", sales: 620000 },
    { name: "Mar", sales: 860000 },
    { name: "Mer", sales: 540000 },
    { name: "Jeu", sales: 1190000 },
    { name: "Ven", sales: 990000 },
    { name: "Sam", sales: 1480000 },
    { name: "Dim", sales: 780000 },
  ];

  const topProducts: TopProductItem[] = [
    {
      id: 1,
      name: "iPhone 15 Pro",
      sku: "IPH-0015",
      quantitySold: 18,
      revenue: 16020000,
    },
    {
      id: 2,
      name: "AirPods Pro 2",
      sku: "APD-0008",
      quantitySold: 14,
      revenue: 3920000,
    },
    {
      id: 3,
      name: "Apple Watch S9",
      sku: "AWT-0009",
      quantitySold: 9,
      revenue: 2655000,
    },
  ];

  const stockAlerts: StockAlertItem[] = [
    {
      id: 1,
      sku: "APD-0008",
      name: "AirPods",
      stock: 3,
      threshold: 5,
      status: "low",
    },
    {
      id: 2,
      sku: "AWT-0009",
      name: "Apple Watch",
      stock: 2,
      threshold: 4,
      status: "low",
    },
    {
      id: 3,
      sku: "MAC-0012",
      name: "Mac",
      stock: 0,
      threshold: 2,
      status: "critical",
    },
  ];

  const activity: ActivityItem[] = [
    {
      id: 1,
      type: "sale",
      title: "iPhone 15 Pro • Client comptoir",
      subtitle: "Vente enregistrée",
      amount: "890 000 F",
      time: "Il y a 4 min",
    },
    {
      id: 2,
      type: "alert",
      title: "AirPods Pro 2 sous le seuil minimum",
      subtitle: "Alerte de stock faible",
      time: "Il y a 22 min",
    },
    {
      id: 3,
      type: "purchase",
      title: "PO-20260415-02 • Apple Supplier",
      subtitle: "Commande fournisseur créée",
      amount: "3 200 000 F",
      time: "Il y a 1 h",
    },
    {
      id: 4,
      type: "sale",
      title: "Apple Watch Series 9",
      subtitle: "Vente enregistrée",
      amount: "295 000 F",
      time: "Il y a 1 h 14",
    },
  ];

  return {
    metrics,
    salesTrend,
    topProducts,
    stockAlerts,
    activity,
  };
}

export function getSalesPageData() {
  return {
    products: [
      {
        id: 1,
        name: "iPhone 15 Pro",
        sku: "IPH-0015",
        category: "iPhone",
        price: 890000,
        stock: 8,
      },
      {
        id: 2,
        name: "AirPods Pro 2",
        sku: "APD-0008",
        category: "AirPods",
        price: 280000,
        stock: 3,
      },
      {
        id: 3,
        name: "Apple Watch S9",
        sku: "AWT-0009",
        category: "Watch",
        price: 295000,
        stock: 5,
      },
      {
        id: 4,
        name: "MacBook Air M3",
        sku: "MAC-0012",
        category: "Mac",
        price: 1250000,
        stock: 2,
      },
      {
        id: 5,
        name: "iPad Air",
        sku: "IPD-0011",
        category: "iPad",
        price: 520000,
        stock: 6,
      },
      {
        id: 6,
        name: "Chargeur USB-C 20W",
        sku: "CHR-0004",
        category: "Accessoire",
        price: 18000,
        stock: 14,
      },
    ],
  };
}

export function getStockPageData() {
  return {
    summary: [
      { label: "Produits suivis", value: 24, tone: "neutral" as const },
      { label: "Disponibles", value: 17, tone: "success" as const },
      { label: "Stock faible", value: 5, tone: "warning" as const },
      { label: "Critiques", value: 2, tone: "danger" as const },
    ],
    products: [
      {
        id: 1,
        name: "iPhone 15 Pro",
        sku: "IPH-0015",
        category: "iPhone",
        stock: 8,
        threshold: 3,
        status: "available" as const,
      },
      {
        id: 2,
        name: "AirPods Pro 2",
        sku: "APD-0008",
        category: "AirPods",
        stock: 3,
        threshold: 5,
        status: "low" as const,
      },
      {
        id: 3,
        name: "Apple Watch S9",
        sku: "AWT-0009",
        category: "Watch",
        stock: 2,
        threshold: 4,
        status: "low" as const,
      },
      {
        id: 4,
        name: "MacBook Air M3",
        sku: "MAC-0012",
        category: "Mac",
        stock: 0,
        threshold: 2,
        status: "critical" as const,
      },
      {
        id: 5,
        name: "iPad Air",
        sku: "IPD-0011",
        category: "iPad",
        stock: 6,
        threshold: 3,
        status: "available" as const,
      },
      {
        id: 6,
        name: "Chargeur USB-C 20W",
        sku: "CHR-0004",
        category: "Accessoire",
        stock: 14,
        threshold: 5,
        status: "available" as const,
      },
      {
        id: 7,
        name: "Coque iPhone 15 Pro",
        sku: "COK-0012",
        category: "Accessoire",
        stock: 1,
        threshold: 4,
        status: "critical" as const,
      },
      {
        id: 8,
        name: "AirTag",
        sku: "ART-0003",
        category: "Accessoire",
        stock: 9,
        threshold: 3,
        status: "available" as const,
      },
    ],
  };
}

export function getReapproPageData() {
  return {
    summary: [
      { label: "Commandes en attente", value: 6, tone: "warning" as const },
      { label: "Réceptions du jour", value: 3, tone: "success" as const },
      { label: "Produits à recommander", value: 8, tone: "danger" as const },
      { label: "Valeur d’achat prévue", value: "4 860 000 F", tone: "neutral" as const },
    ],
    suggestions: [
      {
        id: 1,
        product: "AirPods Pro 2",
        sku: "APD-0008",
        stock: 3,
        threshold: 8,
        suggestedQty: 15,
        supplier: "Apple Supplier",
      },
      {
        id: 2,
        product: "Apple Watch S9",
        sku: "AWT-0009",
        stock: 2,
        threshold: 6,
        suggestedQty: 10,
        supplier: "Premium Tech",
      },
      {
        id: 3,
        product: "Coque iPhone 15 Pro",
        sku: "COK-0012",
        stock: 1,
        threshold: 10,
        suggestedQty: 25,
        supplier: "iStore Supply",
      },
      {
        id: 4,
        product: "Chargeur USB-C 20W",
        sku: "CHR-0004",
        stock: 4,
        threshold: 12,
        suggestedQty: 20,
        supplier: "Apple Supplier",
      },
    ],
    orders: [
      {
        id: 1,
        number: "PO-20260421-01",
        supplier: "Apple Supplier",
        amount: 3200000,
        status: "transit" as const,
        date: "21/04/2026",
      },
      {
        id: 2,
        number: "PO-20260419-03",
        supplier: "Premium Tech",
        amount: 980000,
        status: "pending" as const,
        date: "19/04/2026",
      },
      {
        id: 3,
        number: "PO-20260417-02",
        supplier: "iStore Supply",
        amount: 680000,
        status: "received" as const,
        date: "17/04/2026",
      },
    ],
  };
}


export function getProductsPageData() {
  return {
    summary: [
      { label: "Références actives", value: 24, tone: "success" as const },
      { label: "Catégories", value: 8, tone: "neutral" as const },
      { label: "Stock faible", value: 6, tone: "warning" as const },
      { label: "Valeur catalogue", value: "18 460 000 F", tone: "neutral" as const },
    ],
    products: [
      {
        id: 1,
        name: "iPhone 15 Pro",
        sku: "IPH-0015",
        category: "iPhone",
        brand: "Apple",
        price: 890000,
        stock: 8,
        active: true,
      },
      {
        id: 2,
        name: "AirPods Pro 2",
        sku: "APD-0008",
        category: "AirPods",
        brand: "Apple",
        price: 280000,
        stock: 3,
        active: true,
      },
      {
        id: 3,
        name: "Apple Watch S9",
        sku: "AWT-0009",
        category: "Watch",
        brand: "Apple",
        price: 295000,
        stock: 5,
        active: true,
      },
      {
        id: 4,
        name: "MacBook Air M3",
        sku: "MAC-0012",
        category: "Mac",
        brand: "Apple",
        price: 1250000,
        stock: 2,
        active: true,
      },
      {
        id: 5,
        name: "iPad Air",
        sku: "IPD-0011",
        category: "iPad",
        brand: "Apple",
        price: 520000,
        stock: 6,
        active: true,
      },
      {
        id: 6,
        name: "Chargeur USB-C 20W",
        sku: "CHR-0004",
        category: "Accessoire",
        brand: "Apple",
        price: 18000,
        stock: 14,
        active: true,
      },
      {
        id: 7,
        name: "Coque iPhone 15 Pro",
        sku: "COK-0012",
        category: "Accessoire",
        brand: "Apple",
        price: 15000,
        stock: 1,
        active: true,
      },
      {
        id: 8,
        name: "AirTag",
        sku: "ART-0003",
        category: "Accessoire",
        brand: "Apple",
        price: 24000,
        stock: 9,
        active: true,
      },
    ],
  };
}