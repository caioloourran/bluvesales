"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { spinRoleta } from "@/lib/actions/roleta-actions";
import { SpinningWheel } from "@/components/roleta/spinning-wheel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Lock } from "lucide-react";

interface Prize {
  id: number;
  label: string;
  color: string;
}

interface Props {
  prizes: Prize[];
  enabled: boolean;
  spinsRemaining: number;
  spinsPerDay: number;
}

export function RoletaVendedorClient({
  prizes,
  enabled,
  spinsRemaining: initialSpinsRemaining,
  spinsPerDay,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [spinsRemaining, setSpinsRemaining] = useState(initialSpinsRemaining);
  const [currentPrizes, setCurrentPrizes] = useState(prizes);

  async function handleSpin() {
    const result = await spinRoleta();
    if (result.error) {
      toast.error(result.error);
      return { error: result.error };
    }
    if (result.prizes) setCurrentPrizes(result.prizes);
    setSpinsRemaining((prev) => Math.max(0, prev - 1));
    startTransition(() => router.refresh());
    return {
      winnerIndex: result.winnerIndex,
      winnerLabel: result.winnerLabel,
    };
  }

  // Disabled state
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Roleta Indisponivel</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A roleta de premios ainda nao esta ativa. Aguarde seu gestor!
          </p>
        </div>
      </div>
    );
  }

  // Not enough prizes
  if (currentPrizes.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Gift className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">
          A roleta esta sendo configurada. Volte em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
          <Gift className="h-7 w-7 text-primary" />
          Roleta de Premios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gire a roda e descubra seu premio!
        </p>
      </div>

      {/* Spin counter */}
      <Badge
        variant={spinsRemaining > 0 ? "default" : "secondary"}
        className="px-4 py-1.5 text-sm"
      >
        {spinsRemaining > 0
          ? `${spinsRemaining} de ${spinsPerDay} giro${spinsPerDay !== 1 ? "s" : ""} restante${spinsRemaining !== 1 ? "s" : ""} hoje`
          : "Voce ja usou todos os giros de hoje"}
      </Badge>

      {/* Wheel */}
      <Card className="w-fit">
        <CardContent className="p-6 sm:p-8">
          <SpinningWheel
            prizes={currentPrizes}
            onSpin={handleSpin}
            disabled={spinsRemaining === 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
