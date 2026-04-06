import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart2, TrendingUp, DollarSign, Star, ShoppingBag, ArrowUpDown, MessageCircle, ClipboardList, Plus, Settings, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, PAY, type Tab, type AnalyticsSummary, type ChartDay, type PlatformStat, type ReturnRate, type WaOrder } from "./shared";
import type { StoreSettings } from "@shared/schema";

export function OverviewTab({ setActiveTab }: { setActiveTab:(t:Tab)=>void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data:analyticsSummary } = useQuery<AnalyticsSummary>({ queryKey:["/api/admin/analytics/summary"], queryFn:()=>api("/api/admin/analytics/summary"), refetchOnWindowFocus:false });
  const { data:revenueChart=[]  } = useQuery<ChartDay[]>({ queryKey:["/api/admin/analytics/revenue-chart"], queryFn:()=>api("/api/admin/analytics/revenue-chart?days=30"), refetchOnWindowFocus:false });
  const { data:topProducts      } = useQuery<{productId:number;name:string;totalSold:number}[]>({ queryKey:["/api/admin/analytics/top-products"], queryFn:()=>api("/api/admin/analytics/top-products"), refetchOnWindowFocus:false });
  const { data:platformBreakdown=[] } = useQuery<PlatformStat[]>({ queryKey:["/api/admin/analytics/platform-breakdown"], queryFn:()=>api("/api/admin/analytics/platform-breakdown"), refetchOnWindowFocus:false });
  const { data:returnRateData } = useQuery<ReturnRate>({ queryKey:["/api/admin/analytics/return-rate"], queryFn:()=>api("/api/admin/analytics/return-rate"), refetchOnWindowFocus:false });
  const { data:waData } = useQuery<{ orders:WaOrder[]; stats:{total:number;pendente:number;pago:number} }>({ queryKey:["/api/admin/whatsapp-orders"], queryFn:()=>api("/api/admin/whatsapp-orders"), refetchOnWindowFocus:false });
  const { data:settings } = useQuery<StoreSettings>({ queryKey:["/api/settings"], queryFn:()=>api("/api/settings") });

  const saveSettings = useMutation({
    mutationFn: (d:Partial<StoreSettings>) => api("/api/admin/settings","PUT",d),
    onSuccess: () => { qc.invalidateQueries({queryKey:["/api/settings"]}); toast({title:"Configurações salvas!"}); },
    onError: (e:Error) => toast({title:"Erro",description:e.message,variant:"destructive"}),
  });

  const toggleStore = () => {
    if (!settings) return;
    const updated = { ...settings, isOpen: !settings.isOpen };
    saveSettings.mutate(updated);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-bold text-white">Visão Geral</h1><p className="text-gray-400 text-sm mt-0.5">Resumo financeiro e operacional</p></div>
        <button onClick={()=>setActiveTab("analytics")} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold"><BarChart2 className="w-3.5 h-3.5"/>Ver relatórios completos</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-green-500/10 border-green-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Faturamento hoje</p><DollarSign className="w-3.5 h-3.5 text-green-400"/></div><p className="text-2xl font-bold text-green-400">R$ {(analyticsSummary?.todayRevenue??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">{analyticsSummary?.todayCount??0} pedido{(analyticsSummary?.todayCount??0)!==1?"s":""}</p></div>
        <div className="rounded-xl border bg-blue-500/10 border-blue-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Esta semana</p><TrendingUp className="w-3.5 h-3.5 text-blue-400"/></div><p className="text-2xl font-bold text-blue-400">R$ {(analyticsSummary?.weekRevenue??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">desde segunda-feira</p></div>
        <div className="rounded-xl border bg-purple-500/10 border-purple-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Este mês</p><Star className="w-3.5 h-3.5 text-purple-400"/></div><p className="text-2xl font-bold text-purple-400">R$ {(analyticsSummary?.monthRevenue??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">{analyticsSummary?.monthCount??0} pedido{(analyticsSummary?.monthCount??0)!==1?"s":""}</p></div>
        <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Ticket médio</p><ShoppingBag className="w-3.5 h-3.5 text-amber-400"/></div><p className="text-2xl font-bold text-amber-400">R$ {(analyticsSummary?.avgTicket??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">{analyticsSummary?.totalOrders??0} pedidos totais</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-rose-500/10 border-rose-500/20 p-4 flex items-center justify-between">
          <div><p className="text-gray-400 text-xs mb-1">Taxa de retorno</p><p className="text-3xl font-black text-rose-400">{returnRateData ? `${returnRateData.returnRate.toFixed(0)}%` : "—"}</p><p className="text-gray-500 text-xs mt-0.5">{returnRateData?.returningCustomers??0} de {returnRateData?.totalCustomers??0} clientes voltaram</p></div>
          <TrendingUp className="w-8 h-8 text-rose-400/30"/>
        </div>
        {platformBreakdown.length>0 && (
          <div className="rounded-xl border bg-gray-800/50 border-gray-700 p-4">
            <p className="text-gray-400 text-xs mb-3">Origem dos pedidos</p>
            <div className="space-y-2">
              {(()=>{ const total=platformBreakdown.reduce((s,p)=>s+p.count,0); return platformBreakdown.map(p=><div key={p.platform}><div className="flex items-center justify-between mb-0.5"><span className="text-gray-300 text-xs capitalize">{p.platform==="site"?"Site":p.platform==="whatsapp"?"WhatsApp":p.platform}</span><span className="text-white text-xs font-bold">{p.count}</span></div><div className="h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${total>0?(p.count/total)*100:0}%`}}/></div></div>); })()}
            </div>
          </div>
        )}
      </div>

      {revenueChart.length>0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Faturamento — últimos 30 dias</h2></div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueChart} margin={{top:4,right:4,left:-20,bottom:0}}>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="date" tick={{fill:"#6b7280",fontSize:10}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:"#6b7280",fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>`R$${v}`}/>
              <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,color:"#fff",fontSize:12}} formatter={(v:number)=>[`R$ ${v.toFixed(2).replace(".",",")}`, "Faturamento"]}/>
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {topProducts && topProducts.length>0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><ArrowUpDown className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Produtos mais vendidos</h2></div>
          <div className="space-y-3">
            {topProducts.map((p,i)=>(
              <div key={p.productId} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-4 shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                  <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width:`${(p.totalSold/topProducts[0].totalSold)*100}%` }}/></div>
                </div>
                <span className="text-gray-300 text-xs font-bold shrink-0">{p.totalSold} un.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {waData && (
        <div className="bg-[#075E54]/10 border border-[#25D366]/20 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#075E54]/20 transition-colors" onClick={()=>setActiveTab("whatsapp")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-[#25D366]"/></div>
            <div><p className="text-white font-semibold text-sm">Pedidos via WhatsApp</p><p className="text-gray-400 text-xs">{waData.stats.pago} confirmado{waData.stats.pago!==1?"s":""} · {waData.stats.pendente} pendente{waData.stats.pendente!==1?"s":""}</p></div>
          </div>
          <div className="text-right"><p className="text-2xl font-black text-[#25D366]">{waData.stats.total}</p><p className="text-xs text-gray-400">total</p></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-white font-semibold mb-4">Ações rápidas</h2>
          <div className="space-y-2">
            {([{label:"Kanban de pedidos",tab:"orders"as Tab,icon:<ClipboardList className="w-4 h-4"/>},{label:"Adicionar produto",tab:"products"as Tab,icon:<Plus className="w-4 h-4"/>},{label:"Configurações",tab:"settings"as Tab,icon:<Settings className="w-4 h-4"/>}]).map((a,i)=>(
              <button key={i} onClick={()=>setActiveTab(a.tab)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all group">
                <div className="flex items-center gap-3 text-gray-300 group-hover:text-white"><span className="text-primary">{a.icon}</span><span className="text-sm font-medium">{a.label}</span></div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400"/>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-white font-semibold mb-4">Status da loja</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Estado</span>
              <button onClick={toggleStore} className="flex items-center gap-2">
                {settings?.isOpen ? <><ToggleRight className="w-7 h-7 text-green-500"/><span className="text-green-400 text-sm font-semibold">Aberto</span></> : <><ToggleLeft className="w-7 h-7 text-gray-500"/><span className="text-gray-400 text-sm font-semibold">Fechado</span></>}
              </button>
            </div>
            <div className="flex items-center justify-between"><span className="text-gray-400 text-sm">Horário</span><span className="text-white text-sm font-medium">{settings?.openTime??"—"} – {settings?.closeTime??"—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-400 text-sm">Tempo estimado</span><span className="text-white text-sm font-medium">{settings?.estimatedTimeMin??10}–{settings?.estimatedTimeMax??60} min</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
