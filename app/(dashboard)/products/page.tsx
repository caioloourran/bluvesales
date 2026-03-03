import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ProductsClient } from "@/components/admin/products-client";

export const metadata = {
  title: "Produtos - Admin",
};

export default async function ProductsPage() {
  await requireAdmin();
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  return <ProductsClient products={products} />;
}
