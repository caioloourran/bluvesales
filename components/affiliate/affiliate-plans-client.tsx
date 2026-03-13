"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertAffiliatePlanCheckout } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save, Loader2 } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface Plan {
  id: number;
  product_name: string;
  name: string;
  sale_price_gross: string;
  active: boolean;
}

interface Props {
  plans: Plan[];
  checkoutMap: Record<number, string>;
}

export function AffiliatePlansClient({ plans, checkoutMap }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const plan of plans) {
      initial[plan.id] = checkoutMap[plan.id] || "";
    }
    return initial;
  });
  const [savingId, setSavingId] = useState<number | null>(null);

  async function handleSave(planId: number) {
    setSavingId(planId);
    const result = await upsertAffiliatePlanCheckout(planId, values[planId] || "");
    setSavingId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Checkout ID salvo!");
      router.refresh();
    }
  }

  const activePlans = plans.filter((p) => p.active);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planos</h1>
        <p className="text-sm text-muted-foreground">Configure seu Payt Checkout ID para cada plano</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planos Disponiveis</CardTitle>
        </CardHeader>
        <CardContent>
          {activePlans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum plano disponivel.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Preco</TableHead>
                  <TableHead>Seu Checkout ID</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePlans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(p.sale_price_gross))}</TableCell>
                    <TableCell>
                      <Input
                        value={values[p.id] || ""}
                        onChange={(e) => setValues((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Payt Checkout ID"
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSave(p.id)}
                        disabled={savingId === p.id}
                        title="Salvar"
                      >
                        {savingId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        O Checkout ID inserido aqui sera usado para gerar os links de pagamento Payt nos seus pedidos. Cada plano pode ter um ID diferente.
      </p>
    </div>
  );
}
