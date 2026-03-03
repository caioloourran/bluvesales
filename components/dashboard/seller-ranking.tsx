import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatNumber } from "@/lib/format";
import type { SellerRanking } from "@/lib/kpi";

interface SellerRankingTableProps {
  rankings: SellerRanking[];
}

export function SellerRankingTable({ rankings }: SellerRankingTableProps) {
  if (rankings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Ranking Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right">Valor Bruto</TableHead>
              <TableHead className="text-right">Valor Liquido</TableHead>
              <TableHead className="text-right">Comissao Bruta</TableHead>
              <TableHead className="text-right">Comissao Liquida</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((r) => (
              <TableRow key={r.sellerId}>
                <TableCell className="font-medium">{r.sellerName}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.salesQty)}
                </TableCell>
                <TableCell className="text-right">
                  {formatBRL(r.grossValue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatBRL(r.netValue)}
                </TableCell>
                <TableCell className="text-right">
                  {formatBRL(r.grossCommission)}
                </TableCell>
                <TableCell className="text-right">
                  {formatBRL(r.netCommission)}
                </TableCell>
                <TableCell className={`text-right font-semibold ${r.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatBRL(r.profit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
