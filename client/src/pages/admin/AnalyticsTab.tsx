import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart2, TrendingUp, DollarSign, Star, ShoppingBag, ArrowUpDown, CreditCard } from "lucide-react";
import { api, PAY, type AnalyticsSummary, type ChartDay, type PayMethod, type CustStat, type PlatformStat, type ReturnRate } from "./shared";

export function AnalyticsTab() {
  const { data:analyticsSummary } = useQuery<AnalyticsSummary>({ queryKey:["/api/admin/analytics/summary"], queryFn:()=>api("/api/admin/analytics/summary"), refetchOnWindowFocus:false });
  const { data:revenueChart=[]  } = useQuery<ChartDay[]>({ queryKey:["/api/admin/analytics/revenue-chart"], queryFn:()=>api("/api/admin/analytics/revenue-chart?days=30"), refetchOnWindowFocus:false });
  const { data:paymentMethods=[] } = useQuery<PayMethod[]>({ queryKey:["/api/admin/analytics/payment-methods"], queryFn:()=>api("/api/admin/analytics/payment-methods"), refetchOnWindowFocus:false });
  const { data:topProducts       } = useQuery<{productId:number;name:string;totalSold:number}[]>({ queryKey:["/api/admin/analytics/top-products"], queryFn:()=>api("/api/admin/analytics/top-products"), refetchOnWindowFocus:false });
  const { data:platformBreakdown=[] } = useQuery<PlatformStat[]>({ queryKey:["/api/admin/analytics/platform-breakdown"], queryFn:()=>api("/api/admin/analytics/platform-breakdown"), refetchOnWindowFocus:false });
  const { data:returnRateData } = useQuery<ReturnRate>({ queryKey:["/api/admin/analytics/return-rate"], queryFn:()=>api("/api/admin/analytics/return-rate"), refetchOnWindowFocus:false });
  const { data:customersStats=[] } = useQuery<CustStat[]>({ queryKey:["/api/admin/analytics/customers-stats"], queryFn:()=>api("/api/admin/analytics/customers-stats") });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3"><BarChart2 className="w-5 h-5 text-primary"/><h1 className="text-white font-bold text-lg">Relatórios</h1></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-green-500/10 border-green-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Hoje</p><DollarSign className="w-3.5 h-3.5 text-green-400"/></div><p className="text-2xl font-bold text-green-400">R$ {(analyticsSummary?.todayRevenue??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">{analyticsSummary?.todayCount??0} pedido{(analyticsSummary?.todayCount??0)!==1?"s":""}</p></div>
        <div className="rounded-xl border bg-blue-500/10 border-blue-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Esta semana</p><TrendingUp className="w-3.5 h-3.5 text-blue-400"/></div><p className="text-2xl font-bold text-blue-400">R$ {(analyticsSummary?.weekRevenue??0).toFixed(2).replace(".",",")}</p></div>
        <div className="rounded-xl border bg-purple-500/10 border-purple-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Este mês</p><Star className="w-3.5 h-3.5 text-purple-400"/></div><p className="text-2xl font-bold text-purple-400">R$ {(analyticsSummary?.monthRevenue??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">{analyticsSummary?.monthCount??0} pedidos</p></div>
        <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 p-4"><div className="flex items-center justify-between mb-1"><p className="text-gray-400 text-xs">Ticket médio</p><ShoppingBag className="w-3.5 h-3.5 text-amber-400"/></div><p className="text-2xl font-bold text-amber-400">R$ {(analyticsSummary?.avgTicket??0).toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs mt-0.5">{analyticsSummary?.totalOrders??0} totais</p></div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Faturamento — últimos 30 dias</h2></div>
        {revenueChart.length===0?<p className="text-gray-600 text-sm text-center py-8">Nenhum dado ainda</p>:(
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChart} margin={{top:4,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="date" tick={{fill:"#6b7280",fontSize:10}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fill:"#6b7280",fontSize:10}} tickLine={false} axisLine={false} tickFormatter={v=>`R$${v}`}/>
              <Tooltip contentStyle={{background:"#111827",border:"1px solid #374151",borderRadius:8,color:"#fff",fontSize:12}} formatter={(v:number)=>[`R$ ${v.toFixed(2).replace(".",",")}`, "Faturamento"]}/>
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-rose-500/10 border-rose-500/20 p-4 flex items-center justify-between">
          <div><p className="text-gray-400 text-xs mb-1">Taxa de retorno</p><p className="text-3xl font-black text-rose-400">{returnRateData?`${returnRateData.returnRate.toFixed(0)}%`:"—"}</p><p className="text-gray-500 text-xs mt-0.5">{returnRateData?.returningCustomers??0} de {returnRateData?.totalCustomers??0} clientes voltaram</p></div>
          <TrendingUp className="w-8 h-8 text-rose-400/30"/>
        </div>
        {platformBreakdown.length>0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><BarChart2 className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Origem dos pedidos</h2></div>
            <div className="space-y-2">
              {(()=>{ const total=platformBreakdown.reduce((s,p)=>s+p.count,0); return platformBreakdown.map(p=><div key={p.platform}><div className="flex items-center justify-between mb-0.5"><span className="text-gray-300 text-xs capitalize">{p.platform==="site"?"Site":p.platform==="whatsapp"?"WhatsApp":p.platform}</span><div className="text-right"><span className="text-white text-xs font-bold">{p.count} pedidos</span><span className="text-gray-500 text-xs ml-2">R$ {p.revenue.toFixed(2).replace(".",",")}</span></div></div><div className="h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${total>0?(p.count/total)*100:0}%`}}/></div><p className="text-gray-600 text-xs text-right mt-0.5">{total>0?((p.count/total)*100).toFixed(1):0}%</p></div>); })()}
            </div>
          </div>
        ) : <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-center"><p className="text-gray-600 text-sm">Nenhum dado de plataforma ainda</p></div>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><CreditCard className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Formas de pagamento</h2></div>
          {paymentMethods.length===0?<p className="text-gray-600 text-sm text-center py-6">Nenhum dado ainda</p>:(
            <div className="space-y-3">
              {(()=>{ const total=paymentMethods.reduce((s,m)=>s+m.count,0); return paymentMethods.map(m=>(
                <div key={m.method}>
                  <div className="flex items-center justify-between mb-1"><span className="text-gray-300 text-xs font-medium">{PAY[m.method]||m.method}</span><div className="text-right"><span className="text-white text-xs font-bold">{m.count} pedidos</span><span className="text-gray-500 text-xs ml-2">R$ {m.revenue.toFixed(2).replace(".",",")}</span></div></div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{width:`${total>0?(m.count/total)*100:0}%`}}/></div>
                  <p className="text-gray-600 text-xs mt-0.5 text-right">{total>0?((m.count/total)*100).toFixed(1):0}%</p>
                </div>
              )); })()}
            </div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><ArrowUpDown className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Produtos mais vendidos</h2></div>
          {!topProducts||topProducts.length===0?<p className="text-gray-600 text-sm text-center py-6">Nenhum dado ainda</p>:(
            <div className="space-y-3">
              {topProducts.map((p,i)=>(
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-4 shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${(p.totalSold/topProducts[0].totalSold)*100}%`}}/></div>
                  </div>
                  <span className="text-gray-300 text-xs font-bold shrink-0">{p.totalSold} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800"><h2 className="text-white font-semibold text-sm">Top clientes por faturamento</h2></div>
        {customersStats.length===0?<p className="text-gray-600 text-sm text-center py-6">Nenhum dado ainda</p>:(
          <div className="divide-y divide-gray-800">
            {customersStats.slice(0,10).map((c,i)=>(
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <span className="text-gray-500 text-xs w-5 shrink-0 font-bold">{i+1}</span>
                <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium">{c.name}</p><p className="text-gray-500 text-xs">{c.phone}{c.email&&` · ${c.email}`}</p></div>
                <div className="text-right shrink-0"><p className="text-green-400 text-sm font-bold">R$ {c.totalSpent.toFixed(2).replace(".",",")}</p><p className="text-gray-500 text-xs">{c.orderCount} pedidos</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
