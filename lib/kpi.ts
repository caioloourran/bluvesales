import { sql } from "./db";

// ---- Types ----
export interface Fee {
  id: number;
  name: string;
  slug: string;
  type: "PERCENT" | "FIXED";
  value: number;
  applies_to: "SALE" | "INVESTMENT";
  payment_method: "PIX" | "BOLETO" | "CARTAO" | null;
  active: boolean;
}

export interface KPIData {
  investment: number;
  leads: number;
  salesQty: number;
  grossValue: number;
  netValue: number;
  grossCommission: number;
  netCommission: number;
  platformFees: number;
  investmentTax: number;
  productCosts: number;
  shippingCosts: number;
  discounts: number;
  cpl: number | null;
  cpa: number | null;
  leadsPerSale: number | null;
  roi: number | null;
  profit: number;
  approvedCount: number;
  approvedRevenue: number;
  approvedProfit: number;
  daysInPeriod: number;
}

export interface DailyMetric {
  date: string;
  investment: number;
  leads: number;
  salesQty: number;
  profit: number;
  grossValue: number;
  netCommission: number;
}

export interface DailyResult {
  date: string;
  investment: number;
  leads: number;
  salesQty: number;
  grossValue: number;
  cpl: number | null;
  roasAgendado: number | null;
  approvedCount: number;
  approvedRevenue: number;
  cpaAprovado: number | null;
  roasAprovado: number | null;
  lucro: number;
}

export interface SellerRanking {
  sellerId: number;
  sellerName: string;
  salesQty: number;
  grossValue: number;
  netValue: number;
  grossCommission: number;
  netCommission: number;
  investment: number;
  leads: number;
  platformFees: number;
  productCosts: number;
  shippingCosts: number;
  profit: number;
}

// ---- Fee helpers ----
async function getActiveFees(): Promise<Fee[]> {
  const rows = await sql`SELECT * FROM fees WHERE active = true`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: r.type as "PERCENT" | "FIXED",
    value: Number(r.value),
    applies_to: r.applies_to as "SALE" | "INVESTMENT",
    payment_method: r.payment_method as "PIX" | "BOLETO" | "CARTAO" | null,
    active: true,
  }));
}

function calcSaleFeesPerUnit(grossPerUnit: number, saleFees: Fee[], paymentMethod: string | null): number {
  let total = 0;
  for (const fee of saleFees) {
    if (fee.payment_method !== null && fee.payment_method !== paymentMethod) continue;
    if (fee.type === "PERCENT") {
      total += (grossPerUnit * fee.value) / 100;
    } else {
      total += fee.value;
    }
  }
  return total;
}

function calcInvestmentFeesTotal(investment: number, investmentFees: Fee[]): number {
  let total = 0;
  for (const fee of investmentFees) {
    if (fee.type === "PERCENT") {
      total += (investment * fee.value) / 100;
    } else {
      total += fee.value;
    }
  }
  return total;
}

// ---- processSalesRows: reusable logic ----
interface SalesRow {
  quantity: string | number;
  discount: string | number | null;
  sale_price_gross: string | number;
  sale_price_net: string | number | null;
  product_cost: string | number;
  shipping_cost: string | number;
  commission_pct: string | number;
  payment_method: string | null;
}

interface SalesAgg {
  salesQty: number;
  grossValue: number;
  netValue: number;
  grossCommission: number;
  netCommission: number;
  platformFees: number;
  productCosts: number;
  shippingCosts: number;
  discounts: number;
}

function processSalesRows(rows: SalesRow[], saleFees: Fee[]): SalesAgg {
  let salesQty = 0;
  let grossValue = 0;
  let netValue = 0;
  let grossCommission = 0;
  let netCommission = 0;
  let platformFees = 0;
  let productCosts = 0;
  let shippingCosts = 0;
  let discounts = 0;

  for (const row of rows) {
    const qty = Number(row.quantity);
    const discount = Number(row.discount || 0);
    const gross = Number(row.sale_price_gross);
    const net = row.sale_price_net ? Number(row.sale_price_net) : gross;
    const pct = Number(row.commission_pct) / 100;
    const pm = row.payment_method || null;

    salesQty += qty;
    grossValue += qty * gross;
    netValue += qty * net;
    discounts += discount;

    const feesPerUnit = calcSaleFeesPerUnit(gross, saleFees, pm);
    platformFees += feesPerUnit * qty;

    const afterFeesPerUnit = Math.max(gross - feesPerUnit, 0);
    grossCommission += qty * gross * pct;
    netCommission += qty * afterFeesPerUnit * pct;

    productCosts += qty * Number(row.product_cost);
    shippingCosts += qty * Number(row.shipping_cost);
  }

  return { salesQty, grossValue, netValue, grossCommission, netCommission, platformFees, productCosts, shippingCosts, discounts };
}

// ---- Main KPI calculation ----
export async function calculateKPIs(
  dateFrom: string,
  dateTo: string,
  sellerId?: number
): Promise<KPIData> {
  const fees = await getActiveFees();
  const saleFees = fees.filter((f) => f.applies_to === "SALE");
  const investmentFees = fees.filter((f) => f.applies_to === "INVESTMENT");

  // Ad metrics - single query
  const adRows = sellerId
    ? await sql`SELECT COALESCE(SUM(investment), 0) as total_investment, COALESCE(SUM(leads), 0) as total_leads, COALESCE(SUM(purchases_count), 0) as total_purchases, COUNT(DISTINCT date) as days_count FROM daily_ad_metrics WHERE date >= ${dateFrom} AND date <= ${dateTo} AND seller_id = ${sellerId}`
    : await sql`SELECT COALESCE(SUM(investment), 0) as total_investment, COALESCE(SUM(leads), 0) as total_leads, COALESCE(SUM(purchases_count), 0) as total_purchases, COUNT(DISTINCT date) as days_count FROM daily_ad_metrics WHERE date >= ${dateFrom} AND date <= ${dateTo}`;

  const investment = Number(adRows[0].total_investment);
  const leads = Number(adRows[0].total_leads);
  const daysInPeriod = Number(adRows[0].days_count);

  // Sales - single query
  const salesRows = sellerId
    ? await sql`
        SELECT dse.quantity, dse.discount, dse.payment_method, p.sale_price_gross, p.sale_price_net,
          COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
          COALESCE(sc.percent, 0) as commission_pct
        FROM daily_sales_entries dse
        JOIN plans p ON p.id = dse.plan_id
        LEFT JOIN seller_commissions sc ON sc.seller_id = dse.seller_id AND sc.plan_id = dse.plan_id
        WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo} AND dse.seller_id = ${sellerId}`
    : await sql`
        SELECT dse.quantity, dse.discount, dse.payment_method, p.sale_price_gross, p.sale_price_net,
          COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
          COALESCE(sc.percent, 0) as commission_pct
        FROM daily_sales_entries dse
        JOIN plans p ON p.id = dse.plan_id
        LEFT JOIN seller_commissions sc ON sc.seller_id = dse.seller_id AND sc.plan_id = dse.plan_id
        WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo}`;

  console.log("[v0] calculateKPIs dateFrom:", dateFrom, "dateTo:", dateTo, "sellerId:", sellerId);
  console.log("[v0] salesRows count:", salesRows.length, "first row:", salesRows[0] ? JSON.stringify(salesRows[0]) : "none");
  console.log("[v0] fees count:", fees.length, "saleFees:", saleFees.length, "investmentFees:", investmentFees.length);

  const agg = processSalesRows(salesRows, saleFees);
  const investmentTax = calcInvestmentFeesTotal(investment, investmentFees);

  console.log("[v0] agg result:", JSON.stringify(agg));

  const cpl = leads > 0 ? investment / leads : null;
  const cpa = agg.salesQty > 0 ? investment / agg.salesQty : null;
  const leadsPerSale = agg.salesQty > 0 ? leads / agg.salesQty : null;

  const profit = agg.grossValue - agg.platformFees - agg.netCommission - agg.productCosts - agg.shippingCosts - agg.discounts - investment - investmentTax;
  const roi = investment > 0 ? profit / investment : null;

  // Approved payments from daily_approved_payments table (real data, global — no seller filter)
  const approvedRows = await sql`
    SELECT dap.quantity, dap.discount, dap.payment_method, p.sale_price_gross, p.sale_price_net,
      COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
      0 as commission_pct
    FROM daily_approved_payments dap
    JOIN plans p ON p.id = dap.plan_id
    WHERE dap.date >= ${dateFrom} AND dap.date <= ${dateTo}`;

  const approvedAgg = processSalesRows(approvedRows, saleFees);
  const approvedCount = approvedAgg.salesQty;
  const approvedRevenue = approvedAgg.grossValue;
  const approvedProfit = approvedRevenue
    - approvedAgg.platformFees
    - approvedAgg.netCommission
    - approvedAgg.productCosts
    - approvedAgg.shippingCosts
    - approvedAgg.discounts
    - investment - investmentTax;

  return {
    investment, leads,
    salesQty: agg.salesQty, grossValue: agg.grossValue, netValue: agg.netValue,
    grossCommission: agg.grossCommission, netCommission: agg.netCommission,
    platformFees: agg.platformFees, investmentTax, productCosts: agg.productCosts,
    shippingCosts: agg.shippingCosts, discounts: agg.discounts,
    cpl, cpa, leadsPerSale, roi, profit,
    approvedCount, approvedRevenue, approvedProfit, daysInPeriod,
  };
}

// ---- Daily Metrics (efficient: 3 queries total, not N) ----
export async function getDailyMetrics(
  dateFrom: string,
  dateTo: string,
  sellerId?: number
): Promise<DailyMetric[]> {
  const fees = await getActiveFees();
  const saleFees = fees.filter((f) => f.applies_to === "SALE");
  const investmentFees = fees.filter((f) => f.applies_to === "INVESTMENT");

  // 1. All dates in range
  const dateRows = await sql`SELECT generate_series(${dateFrom}::date, ${dateTo}::date, '1 day'::interval)::date as date`;

  // 2. Ad data grouped by date - single query
  const adData = sellerId
    ? await sql`SELECT date, SUM(investment) as inv, SUM(leads) as lds FROM daily_ad_metrics WHERE date >= ${dateFrom} AND date <= ${dateTo} AND seller_id = ${sellerId} GROUP BY date`
    : await sql`SELECT date, SUM(investment) as inv, SUM(leads) as lds FROM daily_ad_metrics WHERE date >= ${dateFrom} AND date <= ${dateTo} GROUP BY date`;

  const adMap = new Map<string, { inv: number; lds: number }>();
  for (const r of adData) {
    const d = new Date(r.date).toISOString().split("T")[0];
    adMap.set(d, { inv: Number(r.inv), lds: Number(r.lds) });
  }

  // 3. Sales data grouped by date - single query
  const salesData = sellerId
    ? await sql`
        SELECT dse.date, dse.quantity, dse.discount, dse.payment_method, p.sale_price_gross,
          COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
          COALESCE(sc.percent, 0) as commission_pct
        FROM daily_sales_entries dse
        JOIN plans p ON p.id = dse.plan_id
        LEFT JOIN seller_commissions sc ON sc.seller_id = dse.seller_id AND sc.plan_id = dse.plan_id
        WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo} AND dse.seller_id = ${sellerId}`
    : await sql`
        SELECT dse.date, dse.quantity, dse.discount, dse.payment_method, p.sale_price_gross,
          COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
          COALESCE(sc.percent, 0) as commission_pct
        FROM daily_sales_entries dse
        JOIN plans p ON p.id = dse.plan_id
        LEFT JOIN seller_commissions sc ON sc.seller_id = dse.seller_id AND sc.plan_id = dse.plan_id
        WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo}`;

  // Group sales by date
  const salesMap = new Map<string, typeof salesData>();
  for (const r of salesData) {
    const d = new Date(r.date).toISOString().split("T")[0];
    if (!salesMap.has(d)) salesMap.set(d, []);
    salesMap.get(d)!.push(r);
  }

  // Build results
  const result: DailyMetric[] = [];
  for (const dr of dateRows) {
    const d = new Date(dr.date).toISOString().split("T")[0];
    const ad = adMap.get(d) || { inv: 0, lds: 0 };
    const dayRows = salesMap.get(d) || [];

    const agg = processSalesRows(dayRows, saleFees);
    const dayInvTax = calcInvestmentFeesTotal(ad.inv, investmentFees);
    const dayProfit = agg.grossValue - agg.platformFees - agg.netCommission - agg.productCosts - agg.shippingCosts - agg.discounts - ad.inv - dayInvTax;

    result.push({
      date: d,
      investment: ad.inv,
      leads: ad.lds,
      salesQty: agg.salesQty,
      profit: dayProfit,
      grossValue: agg.grossValue,
      netCommission: agg.netCommission,
    });
  }

  return result;
}

// ---- Daily Results (for Resultado Diário page) ----
export async function getDailyResults(
  dateFrom: string,
  dateTo: string
): Promise<DailyResult[]> {
  const fees = await getActiveFees();
  const saleFees = fees.filter((f) => f.applies_to === "SALE");
  const investmentFees = fees.filter((f) => f.applies_to === "INVESTMENT");

  // 1. All dates in range
  const dateRows = await sql`SELECT generate_series(${dateFrom}::date, ${dateTo}::date, '1 day'::interval)::date as date`;

  // 2. Ad data grouped by date
  const adData = await sql`SELECT date, SUM(investment) as inv, SUM(leads) as lds FROM daily_ad_metrics WHERE date >= ${dateFrom} AND date <= ${dateTo} GROUP BY date`;
  const adMap = new Map<string, { inv: number; lds: number }>();
  for (const r of adData) {
    const d = new Date(r.date).toISOString().split("T")[0];
    adMap.set(d, { inv: Number(r.inv), lds: Number(r.lds) });
  }

  // 3. Sales data grouped by date
  const salesData = await sql`
    SELECT dse.date, dse.quantity, dse.discount, dse.payment_method, p.sale_price_gross,
      COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
      COALESCE(sc.percent, 0) as commission_pct
    FROM daily_sales_entries dse
    JOIN plans p ON p.id = dse.plan_id
    LEFT JOIN seller_commissions sc ON sc.seller_id = dse.seller_id AND sc.plan_id = dse.plan_id
    WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo}`;
  const salesMap = new Map<string, typeof salesData>();
  for (const r of salesData) {
    const d = new Date(r.date).toISOString().split("T")[0];
    if (!salesMap.has(d)) salesMap.set(d, []);
    salesMap.get(d)!.push(r);
  }

  // 4. Approved payments grouped by date
  const approvedData = await sql`
    SELECT dap.date, dap.quantity, dap.discount, dap.payment_method, p.sale_price_gross, p.sale_price_net,
      COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
      0 as commission_pct
    FROM daily_approved_payments dap
    JOIN plans p ON p.id = dap.plan_id
    WHERE dap.date >= ${dateFrom} AND dap.date <= ${dateTo}`;
  const approvedMap = new Map<string, typeof approvedData>();
  for (const r of approvedData) {
    const d = new Date(r.date).toISOString().split("T")[0];
    if (!approvedMap.has(d)) approvedMap.set(d, []);
    approvedMap.get(d)!.push(r);
  }

  // Build results
  const result: DailyResult[] = [];
  for (const dr of dateRows) {
    const d = new Date(dr.date).toISOString().split("T")[0];
    const ad = adMap.get(d) || { inv: 0, lds: 0 };
    const daySalesRows = salesMap.get(d) || [];
    const dayApprovedRows = approvedMap.get(d) || [];

    const salesAgg = processSalesRows(daySalesRows, saleFees);
    const approvedAgg = processSalesRows(dayApprovedRows, saleFees);
    const dayInvTax = calcInvestmentFeesTotal(ad.inv, investmentFees);

    const lucro = approvedAgg.grossValue
      - approvedAgg.platformFees
      - approvedAgg.netCommission
      - approvedAgg.productCosts
      - approvedAgg.shippingCosts
      - approvedAgg.discounts
      - ad.inv - dayInvTax;

    result.push({
      date: d,
      investment: ad.inv,
      leads: ad.lds,
      salesQty: salesAgg.salesQty,
      grossValue: salesAgg.grossValue,
      cpl: ad.lds > 0 ? ad.inv / ad.lds : null,
      roasAgendado: ad.inv > 0 ? salesAgg.grossValue / ad.inv : null,
      approvedCount: approvedAgg.salesQty,
      approvedRevenue: approvedAgg.grossValue,
      cpaAprovado: approvedAgg.salesQty > 0 ? ad.inv / approvedAgg.salesQty : null,
      roasAprovado: ad.inv > 0 ? approvedAgg.grossValue / ad.inv : null,
      lucro,
    });
  }

  return result;
}

// ---- Seller Rankings (efficient: 3 queries total, not N per seller) ----
export async function getSellerRankings(
  dateFrom: string,
  dateTo: string
): Promise<SellerRanking[]> {
  const fees = await getActiveFees();
  const saleFees = fees.filter((f) => f.applies_to === "SALE");
  const investmentFees = fees.filter((f) => f.applies_to === "INVESTMENT");

  // 1. All sellers
  const sellers = await sql`SELECT id, name FROM users WHERE role = 'SELLER' ORDER BY name`;

  // 2. Ad data grouped by seller - single query
  const adData = await sql`
    SELECT seller_id, COALESCE(SUM(investment), 0) as inv, COALESCE(SUM(leads), 0) as lds
    FROM daily_ad_metrics WHERE date >= ${dateFrom} AND date <= ${dateTo}
    GROUP BY seller_id`;

  const adMap = new Map<number, { inv: number; lds: number }>();
  for (const r of adData) {
    adMap.set(r.seller_id, { inv: Number(r.inv), lds: Number(r.lds) });
  }

  // 3. Sales data with seller_id - single query
  const salesData = await sql`
    SELECT dse.seller_id, dse.quantity, dse.discount, dse.payment_method, p.sale_price_gross, p.sale_price_net,
      COALESCE(p.product_cost, 0) as product_cost, COALESCE(p.shipping_cost, 0) as shipping_cost,
      COALESCE(sc.percent, 0) as commission_pct
    FROM daily_sales_entries dse
    JOIN plans p ON p.id = dse.plan_id
    LEFT JOIN seller_commissions sc ON sc.seller_id = dse.seller_id AND sc.plan_id = dse.plan_id
    WHERE dse.date >= ${dateFrom} AND dse.date <= ${dateTo}`;

  // Group sales by seller
  const salesBySeller = new Map<number, typeof salesData>();
  for (const r of salesData) {
    const sid = r.seller_id;
    if (!salesBySeller.has(sid)) salesBySeller.set(sid, []);
    salesBySeller.get(sid)!.push(r);
  }

  // Build rankings
  const rankings: SellerRanking[] = [];
  for (const seller of sellers) {
    const sid = seller.id;
    const ad = adMap.get(sid) || { inv: 0, lds: 0 };
    const rows = salesBySeller.get(sid) || [];

    const agg = processSalesRows(rows, saleFees);
    const invTax = calcInvestmentFeesTotal(ad.inv, investmentFees);
    const profit = agg.grossValue - agg.platformFees - agg.netCommission - agg.productCosts - agg.shippingCosts - ad.inv - invTax;

    rankings.push({
      sellerId: sid,
      sellerName: seller.name,
      salesQty: agg.salesQty,
      grossValue: agg.grossValue,
      netValue: agg.netValue,
      grossCommission: agg.grossCommission,
      netCommission: agg.netCommission,
      investment: ad.inv,
      leads: ad.lds,
      platformFees: agg.platformFees,
      productCosts: agg.productCosts,
      shippingCosts: agg.shippingCosts,
      profit,
    });
  }

  rankings.sort((a, b) => b.profit - a.profit);
  return rankings;
}
