import { requireAdmin } from "@/lib/auth";
import { getAllWithdrawals } from "@/lib/actions/withdrawal-actions";
import { SaquesClient } from "@/components/admin/saques-client";

export const metadata = {
  title: "Saques - Administracao",
};

export default async function SaquesPage() {
  await requireAdmin();
  const withdrawals = await getAllWithdrawals();

  return <SaquesClient withdrawals={withdrawals} />;
}
