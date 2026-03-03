"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertCommission } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";

interface Seller {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  plan_name: string;
  product_name: string;
}

interface Commission {
  id: number;
  seller_id: number;
  plan_id: number;
  percent: string;
  seller_name: string;
  plan_name: string;
  product_name: string;
}

interface Props {
  sellers: Seller[];
  plans: Plan[];
  commissions: Commission[];
}

export function CommissionsClient({ sellers, plans, commissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sellerId, setSellerId] = useState(sellers[0]?.id?.toString() || "");
  const [planId, setPlanId] = useState(plans[0]?.id?.toString() || "");
  const [percent, setPercent] = useState("");

  function handleSave() {
    startTransition(async () => {
      const result = await upsertCommission({
        sellerId: Number(sellerId),
        planId: Number(planId),
        percent: Number(percent),
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Comissao salva!");
        setPercent("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comissoes</h1>
        <p className="text-sm text-muted-foreground">
          Defina a comissao de cada vendedor por plano
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Definir Comissao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Vendedor</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Plano</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.product_name} - {p.plan_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Comissao (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                className="w-24"
                placeholder="0"
              />
            </div>
            <Button onClick={handleSave} disabled={isPending} size="sm">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comissoes Definidas</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma comissao definida. Crie vendedores e defina comissoes acima.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Comissao (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.seller_name}</TableCell>
                    <TableCell>{c.product_name}</TableCell>
                    <TableCell>{c.plan_name}</TableCell>
                    <TableCell className="text-right">{Number(c.percent).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
