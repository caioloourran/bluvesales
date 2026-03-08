import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  Megaphone,
  Gift,
  Banknote,
  ShoppingCart,
  Shield,
  Percent,
  CheckCircle2,
  ArrowRight,
  Zap,
  LineChart,
  Calendar,
  ChevronRight,
  Star,
  Target,
} from "lucide-react";

export const metadata = {
  title: "Bluve Sales — Gestao de Performance Comercial para Afterpay",
  description:
    "Plataforma completa de metricas, vendas e gamificacao para times de afterpay. Dashboard, ranking, comissoes, cobranca e muito mais.",
};

/* ─── color helpers ──────────────────────────────────────────────────── */

const colorMap: Record<string, { card: string; icon: string; border: string; dot: string }> = {
  indigo:  { card: "from-indigo-500/15 to-indigo-500/5",  icon: "text-indigo-400",  border: "border-indigo-500/25",  dot: "bg-indigo-400"  },
  violet:  { card: "from-violet-500/15 to-violet-500/5",  icon: "text-violet-400",  border: "border-violet-500/25",  dot: "bg-violet-400"  },
  blue:    { card: "from-blue-500/15 to-blue-500/5",      icon: "text-blue-400",    border: "border-blue-500/25",    dot: "bg-blue-400"    },
  amber:   { card: "from-amber-500/15 to-amber-500/5",    icon: "text-amber-400",   border: "border-amber-500/25",   dot: "bg-amber-400"   },
  emerald: { card: "from-emerald-500/15 to-emerald-500/5",icon: "text-emerald-400", border: "border-emerald-500/25", dot: "bg-emerald-400" },
  pink:    { card: "from-pink-500/15 to-pink-500/5",      icon: "text-pink-400",    border: "border-pink-500/25",    dot: "bg-pink-400"    },
  orange:  { card: "from-orange-500/15 to-orange-500/5",  icon: "text-orange-400",  border: "border-orange-500/25",  dot: "bg-orange-400"  },
  cyan:    { card: "from-cyan-500/15 to-cyan-500/5",      icon: "text-cyan-400",    border: "border-cyan-500/25",    dot: "bg-cyan-400"    },
  rose:    { card: "from-rose-500/15 to-rose-500/5",      icon: "text-rose-400",    border: "border-rose-500/25",    dot: "bg-rose-400"    },
  yellow:  { card: "from-yellow-500/15 to-yellow-500/5",  icon: "text-yellow-400",  border: "border-yellow-500/25",  dot: "bg-yellow-400"  },
  green:   { card: "from-green-500/15 to-green-500/5",    icon: "text-green-400",   border: "border-green-500/25",   dot: "bg-green-400"   },
};

/* ─── data ───────────────────────────────────────────────────────────── */

const features = [
  {
    icon: BarChart3,   color: "indigo",
    title: "Dashboard de Performance",
    desc:  "KPIs consolidados de toda a operacao: investimento, leads, faturamento agendado e aprovado, lucro e ROI em um unico painel.",
  },
  {
    icon: TrendingUp,  color: "violet",
    title: "Resultado Diario",
    desc:  "Veja dia a dia o ROAS real, CPA, aprovados vs agendados. Identifique onde a operacao cresce ou perde com precisao.",
  },
  {
    icon: Megaphone,   color: "blue",
    title: "Metricas de Marketing",
    desc:  "Registre investimento em anuncios e leads por vendedor. Calcule CPL, ROAS e eficiencia de campanha automaticamente.",
  },
  {
    icon: Trophy,      color: "amber",
    title: "Ranking de Vendedores",
    desc:  "Leaderboard automatico com faturamento bruto, comissao liquida e lucro. Crie cultura de alta performance no time.",
  },
  {
    icon: Banknote,    color: "emerald",
    title: "Gestao de Cobranca",
    desc:  "Registre pagamentos aprovados separados dos agendados. Rastreie quem aprovou, qual plano e metodo de pagamento.",
  },
  {
    icon: Gift,        color: "pink",
    title: "Roleta de Premios",
    desc:  "Gamifique o time com premiacao configuravel. Defina premios, limite de giros diarios e ative ou pause com um clique.",
  },
  {
    icon: Percent,     color: "orange",
    title: "Comissoes e Taxas",
    desc:  "Comissoes personalizadas por vendedor e plano. Taxas de plataforma configuradas por metodo de pagamento (PIX, boleto, cartao).",
  },
  {
    icon: ShoppingCart,color: "cyan",
    title: "Lancamento de Vendas",
    desc:  "Registro diario por plano e metodo de pagamento com acumulacao automatica e historico completo para auditoria.",
  },
];

const kpis = [
  { label: "Investimento em Ads",  color: "rose"    },
  { label: "Leads Gerados",        color: "violet"  },
  { label: "CPL (Custo por Lead)", color: "blue"    },
  { label: "ROAS Agendado",        color: "yellow"  },
  { label: "ROAS Aprovado",        color: "yellow"  },
  { label: "CPA Agendado",         color: "orange"  },
  { label: "CPA Aprovado",         color: "orange"  },
  { label: "Faturamento Bruto",    color: "green"   },
  { label: "Faturamento Aprovado", color: "green"   },
  { label: "Comissao Bruta",       color: "indigo"  },
  { label: "Comissao Liquida",     color: "indigo"  },
  { label: "Lucro Total",          color: "emerald" },
];

const roles = [
  {
    role: "Administrador", icon: Shield, color: "indigo",
    badge: "Visao 360",
    desc:  "Controle total da operacao com acesso a todos os dados, configuracoes e relatorios da empresa.",
    perks: [
      "Dashboard com todos os vendedores",
      "Ranking e comparativo de performance",
      "Gestao de produtos, planos e comissoes",
      "Taxas por metodo de pagamento",
      "Controle total da roleta de premios",
      "Gerenciamento de usuarios e permissoes",
    ],
  },
  {
    role: "Vendedor", icon: Users, color: "violet",
    badge: "Performance Individual",
    desc:  "Dashboard pessoal com foco na propria producao, lancamentos e premiacao diaria.",
    perks: [
      "Dashboard com seus proprios KPIs",
      "Lancamento diario de vendas por plano",
      "Historico completo de lancamentos",
      "Gire a roleta e concorra a premios",
      "Resultado diario da propria producao",
      "Acompanhe evolucao e meta pessoal",
    ],
  },
  {
    role: "Cobranca", icon: Banknote, color: "emerald",
    badge: "Pagamentos Aprovados",
    desc:  "Foco no registro e controle de pagamentos aprovados, com rastreabilidade completa.",
    perks: [
      "Registro de pagamentos aprovados",
      "Controle por plano e metodo de pagamento",
      "Meu Desempenho com comissao calculada",
      "Lancamentos rastreados por usuario",
      "Historico de aprovacoes por periodo",
      "Operacao independente dos vendedores",
    ],
  },
];

const steps = [
  {
    step: "01", icon: Shield,      color: "indigo",
    title: "Admin configura a operacao",
    desc:  "Cadastre produtos, planos, comissoes por vendedor e taxas da plataforma. Sem codigo, sem complicacao.",
  },
  {
    step: "02", icon: ShoppingCart,color: "violet",
    title: "Vendedores lancam suas vendas",
    desc:  "Cada vendedor registra as vendas do dia por plano e forma de pagamento. O sistema acumula automaticamente.",
  },
  {
    step: "03", icon: Banknote,    color: "emerald",
    title: "Cobranca confirma aprovados",
    desc:  "O time de cobranca registra os pagamentos efetivamente aprovados, separando do que ainda esta agendado.",
  },
  {
    step: "04", icon: BarChart3,   color: "blue",
    title: "Dashboard calcula tudo em tempo real",
    desc:  "ROAS, CPA, comissoes, lucro, ranking — calculados automaticamente. Veja o resultado a qualquer momento.",
  },
];

/* ─── page ───────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060A14] text-white">

      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute bottom-1/4 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-800/8 blur-[100px]" />
      </div>

      {/* ══════ NAVBAR ══════ */}
      <header className="relative z-50 border-b border-white/[0.06] bg-[#060A14]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30">
              <Image src="/logo.png" alt="Bluve Sales" width={22} height={22} className="rounded-md" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Bluve Sales</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              { href: "#funcionalidades", label: "Funcionalidades" },
              { href: "#metricas",        label: "Metricas"        },
              { href: "#equipe",          label: "Para sua equipe" },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="text-sm text-white/50 transition-colors hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 active:scale-95"
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ══════ HERO ══════ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-32">
        <div className="flex flex-col items-center text-center">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            <Zap className="h-3 w-3" />
            Plataforma de Performance para Times de Afterpay
          </div>

          <h1 className="max-w-4xl text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
            Controle total da sua{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              operacao comercial
            </span>
            {" "}em um so lugar
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
            Do lancamento de vendas ao ROAS de anuncios, da gestao de cobranca ao ranking de
            vendedores — tudo que um time de afterpay precisa para crescer com dados reais.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/35 active:scale-95"
            >
              Acessar o sistema
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#funcionalidades"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-white/70 transition-all duration-200 hover:border-white/20 hover:text-white"
            >
              Ver funcionalidades
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Dashboard mockup */}
          <div className="relative mt-16 w-full max-w-4xl">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm sm:p-7">
              <div className="mb-5 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-white/20">Dashboard — Bluve Sales</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Investimento",     value: "R$ 4.280", color: "rose",    sub: "Este mes"       },
                  { label: "Leads",            value: "1.340",    color: "violet",  sub: "CPL R$ 3,19"    },
                  { label: "ROAS Aprovado",    value: "4,2x",     color: "yellow",  sub: "Pagamentos aprov." },
                  { label: "Lucro",            value: "R$ 18.900",color: "emerald", sub: "Liquido"         },
                ].map(({ label, value, color, sub }) => {
                  const c = colorMap[color];
                  return (
                    <div key={label} className={`rounded-xl border bg-gradient-to-br p-4 ${c.card} ${c.border}`}>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{label}</p>
                      <p className="mt-1 text-xl font-bold text-white">{value}</p>
                      <p className="mt-0.5 text-[10px] text-white/30">{sub}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-end justify-between gap-1 rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
                <span className="text-xs text-white/25">Faturamento — ultimos 7 dias</span>
                <div className="flex items-end gap-1.5">
                  {[38, 62, 44, 78, 52, 92, 68].map((h, i) => (
                    <div
                      key={i}
                      className="w-5 rounded-t bg-indigo-500/50"
                      style={{ height: `${h * 0.44}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating: ranking */}
            <div className="absolute -right-4 -top-5 hidden rounded-xl border border-amber-500/20 bg-[#060A14] px-4 py-3 shadow-2xl sm:block">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-white/35">1 lugar no ranking</p>
                  <p className="text-xs font-semibold text-white">Ana Silva — R$ 32k</p>
                </div>
              </div>
            </div>

            {/* Floating: spin */}
            <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-pink-500/20 bg-[#060A14] px-4 py-3 shadow-2xl sm:block">
              <div className="flex items-center gap-2.5">
                <Gift className="h-4 w-4 text-pink-400" />
                <div>
                  <p className="text-[10px] text-white/35">Roleta de Premios</p>
                  <p className="text-xs font-semibold text-white">Voce ganhou R$ 100!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ STATS BAR ══════ */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "12+",  label: "KPIs rastreados"       },
              { value: "3",    label: "Perfis de acesso"       },
              { value: "360°", label: "Visao da operacao"      },
              { value: "Real", label: "Dados em tempo real"    },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className="text-xs text-white/35">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section id="funcionalidades" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
            <Star className="h-3 w-3" /> Funcionalidades
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Tudo que sua operacao precisa,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              nada que nao precisa
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/40">
            Construido especificamente para times de afterpay. Cada modulo foi pensado para o fluxo
            real de quem vende, cobra e gerencia resultados diariamente.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, color, title, desc }) => {
            const c = colorMap[color];
            return (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.05]"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br ${c.card} ${c.border}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/45">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════ METRICAS ══════ */}
      <section id="metricas" className="relative border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">

            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                <LineChart className="h-3 w-3" /> Metricas
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Todas as metricas que importam{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  para o afterpay
                </span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/50">
                Nao basta registrar vendas. Voce precisa saber o custo real de cada lead, o retorno
                de cada campanha, e quanto sobra de lucro depois de comissoes e taxas.
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/50">
                A Bluve Sales calcula tudo automaticamente: ROAS agendado vs aprovado, CPA real,
                comissao liquida e lucro por periodo — com filtros por vendedor e data.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { icon: Calendar, color: "indigo", label: "Filtro por periodo" },
                  { icon: Users,    color: "violet", label: "Filtro por vendedor" },
                  { icon: Target,   color: "emerald",label: "Agendado vs Aprovado" },
                ].map(({ icon: Ico, color, label }) => {
                  const c = colorMap[color];
                  return (
                    <div key={label} className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white/60">
                      <Ico className={`h-4 w-4 ${c.icon}`} />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {kpis.map(({ label, color }) => {
                const c = colorMap[color];
                return (
                  <div key={label} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                    <span className="text-xs font-medium text-white/55">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ ROLES ══════ */}
      <section id="equipe" className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            <Users className="h-3 w-3" /> Para toda a equipe
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Cada perfil tem sua{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              propria experiencia
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/40">
            Tres perfis de acesso com as ferramentas certas para cada funcao — sem informacao
            desnecessaria, sem complexidade a mais.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {roles.map(({ role, icon: Icon, color, badge, desc, perks }) => {
            const c = colorMap[color];
            return (
              <div key={role} className={`relative overflow-hidden rounded-2xl border ${c.border} bg-white/[0.02] p-7`}>
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br ${c.card} ${c.border}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <div className={`mb-3 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.border} ${c.icon}`}>
                  {badge}
                </div>
                <h3 className="mb-1 text-xl font-bold text-white">{role}</h3>
                <p className="mb-6 text-sm text-white/40">{desc}</p>
                <ul className="flex flex-col gap-2.5">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${c.icon}`} />
                      <span className="text-sm text-white/55">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════ GAMIFICATION ══════ */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/8 via-violet-500/5 to-transparent p-8 sm:p-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">

              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/25 bg-pink-500/10 px-3 py-1 text-xs text-pink-300">
                  <Gift className="h-3 w-3" /> Gamificacao
                </div>
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Mantenha sua equipe{" "}
                  <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
                    motivada e engajada
                  </span>
                </h2>
                <p className="mt-5 text-base leading-relaxed text-white/50">
                  A Roleta de Premios transforma a rotina de vendas em uma experiencia divertida.
                  Configure os premios, defina quantos giros cada vendedor tem por dia e ative quando quiser.
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {[
                    "Premios 100% personalizaveis pelo admin",
                    "Limite de giros diarios configuravel",
                    "Ative ou pause a roleta com um clique",
                    "Historico de quem ganhou cada premio",
                    "Roda SVG animada e interativa",
                    "Aparece automaticamente no menu dos vendedores",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/20">
                        <CheckCircle2 className="h-3 w-3 text-pink-400" />
                      </div>
                      <span className="text-sm text-white/55">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Wheel visual */}
              <div className="flex justify-center">
                <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
                  <div className="absolute inset-0 rounded-full border-4 border-white/[0.05]" />
                  <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
                  {[
                    { label: "R$ 50",  bg: "#6366f1", rot: 0   },
                    { label: "R$ 100", bg: "#8b5cf6", rot: 60  },
                    { label: "Brinde", bg: "#ec4899", rot: 120 },
                    { label: "R$ 200", bg: "#10b981", rot: 180 },
                    { label: "Folga",  bg: "#f59e0b", rot: 240 },
                    { label: "R$ 150", bg: "#06b6d4", rot: 300 },
                  ].map(({ label, bg, rot }, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 flex origin-center items-start justify-center pt-4"
                      style={{ transform: `rotate(${rot}deg)` }}
                    >
                      <div className="h-[116px] w-[3px] rounded-full opacity-70" style={{ backgroundColor: bg }} />
                      <span
                        className="absolute top-8 text-[9px] font-bold text-white/80"
                        style={{ transform: `rotate(${rot + 30}deg) translateX(52px) rotate(${-(rot + 30)}deg)` }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/10 bg-[#060A14] shadow-2xl">
                    <Gift className="h-5 w-5 text-pink-400" />
                  </div>
                  <div className="absolute -top-1.5 left-1/2 z-20 -translate-x-1/2">
                    <div className="h-5 w-3 bg-white/80" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <Zap className="h-3 w-3" /> Como funciona
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Simples de usar,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              poderoso nos resultados
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {steps.map(({ step, icon: Icon, color, title, desc }) => {
            const c = colorMap[color];
            return (
              <div key={step} className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${c.card} ${c.border}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`mb-1 text-xs font-bold ${c.icon} opacity-60`}>Passo {step}</div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/45">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="relative border-t border-white/[0.05] py-28">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[450px] w-[700px] rounded-full bg-indigo-600/10 blur-[110px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
            <Star className="h-3 w-3" /> Comece agora
          </div>
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            Sua operacao de afterpay{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              merece dados de verdade
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/40">
            Acesse a plataforma e comece a tomar decisoes baseadas em metricas reais —
            nao em planilhas e achismos.
          </p>
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-9 py-4 text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/35 active:scale-95"
            >
              Acessar a Plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-white/[0.05] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600/20 ring-1 ring-indigo-500/30">
              <Image src="/logo.png" alt="Bluve Sales" width={18} height={18} className="rounded" />
            </div>
            <span className="text-sm font-semibold text-white/50">Bluve Sales</span>
          </div>
          <p className="text-xs text-white/20">Plataforma de gestao de performance para times de afterpay.</p>
          <Link href="/login" className="text-xs text-white/30 transition-colors hover:text-white/60">
            Entrar na plataforma
          </Link>
        </div>
      </footer>

    </div>
  );
}
