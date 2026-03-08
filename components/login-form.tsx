"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl shadow-black/30">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <Image
            src="/logo.png"
            alt="Bluve Sales"
            width={44}
            height={44}
            className="rounded-xl"
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Bluve Sales</h1>
        <p className="mt-1 text-sm text-indigo-200">Plataforma de Performance Comercial</p>
      </div>

      {/* Form body */}
      <div className="bg-card px-8 py-7">
        <form action={formAction} className="flex flex-col gap-5">
          {state?.error && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@empresa.com"
              required
              autoComplete="email"
              className="h-11 bg-background/50 transition-colors focus-visible:ring-indigo-500/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Sua senha"
              required
              autoComplete="current-password"
              className="h-11 bg-background/50 transition-colors focus-visible:ring-indigo-500/50"
            />
          </div>

          <Button type="submit" className="mt-1 h-11 w-full text-base" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Acesso restrito a membros da equipe
        </p>
      </div>
    </div>
  );
}
