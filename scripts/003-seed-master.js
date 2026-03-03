import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL);

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function seed() {
  const hash = hashPassword("@Bluve123@@");

  // Upsert: update if email exists, otherwise insert
  await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Bluve Admin', 'contato@bluvecompany.com.br', ${hash}, 'ADMIN_MASTER')
    ON CONFLICT (email) DO UPDATE SET
      password_hash = ${hash},
      role = 'ADMIN_MASTER',
      updated_at = NOW()
  `;

  console.log("Master admin seeded: contato@bluvecompany.com.br");
}

seed().catch(console.error);
