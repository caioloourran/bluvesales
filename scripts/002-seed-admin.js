import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

// Simple hash for seed - in production we use bcryptjs
function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function seed() {
  const hash = hashPassword("admin123");

  await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Admin Master', 'admin@empresa.com', ${hash}, 'ADMIN_MASTER')
    ON CONFLICT (email) DO NOTHING
  `;

  console.log("Admin user seeded: admin@empresa.com / admin123");

  // Seed a sample product and plans
  const product = await sql`
    INSERT INTO products (name, active)
    VALUES ('Produto Principal', true)
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  if (product.length > 0) {
    const productId = product[0].id;
    await sql`
      INSERT INTO plans (product_id, name, sale_price_gross, sale_price_net, active)
      VALUES 
        (${productId}, 'Plano 1 Mes', 197.00, 167.00, true),
        (${productId}, 'Plano 3 Meses', 497.00, 420.00, true),
        (${productId}, 'Plano 6 Meses', 897.00, 760.00, true)
      ON CONFLICT DO NOTHING
    `;
    console.log("Sample product and plans seeded");
  }
}

seed().catch(console.error);
