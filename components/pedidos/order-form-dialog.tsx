// components/pedidos/order-form-dialog.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { createOrderAction, updateOrderAction } from "@/lib/actions/orders-actions";
import { ImagePlus, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  product_id: number;
  plan_name: string;
}

interface Order {
  id: number;
  cpf: string;
  nome: string;
  email: string | null;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  product_id: number | null;
  plan_id: number | null;
  comprovante: string | null;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  plans: Plan[];
  order?: Order | null;
  onSuccess?: () => void;
}

function maskCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskWhatsApp(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export function OrderFormDialog({ open, onOpenChange, products, plans, order, onSuccess }: Props) {
  const isEdit = !!order;

  const [cpf, setCpf] = useState(order?.cpf ?? "");
  const [nome, setNome] = useState(order?.nome ?? "");
  const [email, setEmail] = useState(order?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(order?.whatsapp ?? "");
  const [cep, setCep] = useState(order?.cep ?? "");
  const [rua, setRua] = useState(order?.rua ?? "");
  const [numero, setNumero] = useState(order?.numero ?? "");
  const [bairro, setBairro] = useState(order?.bairro ?? "");
  const [cidade, setCidade] = useState(order?.cidade ?? "");
  const [estado, setEstado] = useState(order?.estado ?? "");
  const [complemento, setComplemento] = useState(order?.complemento ?? "");
  const [productId, setProductId] = useState<string>(order?.product_id?.toString() ?? "");
  const [planId, setPlanId] = useState<string>(order?.plan_id?.toString() ?? "");
  const [comprovante, setComprovante] = useState<string | null>(order?.comprovante ?? null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when opening in create mode
  useEffect(() => {
    if (open && !order) {
      setCpf(""); setNome(""); setEmail(""); setWhatsapp("");
      setCep(""); setRua(""); setNumero(""); setBairro("");
      setCidade(""); setEstado(""); setComplemento("");
      setProductId(""); setPlanId(""); setComprovante(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, order]);

  const filteredPlans = plans.filter((p) => p.product_id === Number(productId));

  async function handleCepBlur() {
    const rawCep = cep.replace(/\D/g, "");
    if (rawCep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
      } else {
        setRua(data.logradouro ?? "");
        setBairro(data.bairro ?? "");
        setCidade(data.localidade ?? "");
        setEstado(data.uf ?? "");
      }
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Apenas JPG e PNG são aceitos");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setComprovante(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cpf || !nome || !whatsapp || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    const data = {
      cpf, nome, email: email || undefined,
      whatsapp, cep, rua, numero, bairro, cidade, estado,
      complemento: complemento || undefined,
      product_id: productId ? Number(productId) : null,
      plan_id: planId ? Number(planId) : null,
      comprovante,
    };
    let result: { success?: true; error?: string };
    try {
      result = isEdit
        ? await updateOrderAction(order!.id, data)
        : await createOrderAction(data);
    } catch {
      result = { error: "Erro ao processar pedido" };
    } finally {
      setSaving(false);
    }
    if ("error" in result) {
      toast.error(result.error as string);
    } else {
      toast.success(isEdit ? "Pedido atualizado!" : "Pedido criado!");
      onOpenChange(false);
      onSuccess?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Endereço
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={cep}
                  onChange={(e) => setCep(maskCep(e.target.value))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
                {loadingCep && (
                  <p className="text-xs text-muted-foreground">Buscando CEP...</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="rua">Rua *</Label>
                <Input
                  id="rua"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  placeholder="Preenchido automaticamente"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Pedido */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Pedido
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Produto</Label>
                <Select
                  value={productId}
                  onValueChange={(v) => { setProductId(v); setPlanId(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plano de Tratamento</Label>
                <Select
                  value={planId}
                  onValueChange={setPlanId}
                  disabled={!productId || filteredPlans.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comprovante */}
            <div className="mt-3 space-y-1">
              <Label>Comprovante (JPG / PNG)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
              />
              {comprovante ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comprovante}
                    alt="Comprovante"
                    className="max-h-40 rounded-lg border object-contain"
                  />
                  <button
                    type="button"
                    aria-label="Remover comprovante"
                    onClick={() => {
                      setComprovante(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-4 w-4" />
                  Anexar comprovante
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
