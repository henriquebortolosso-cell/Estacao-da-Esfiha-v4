import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Package, Tag, Settings, LogOut, ExternalLink,
  ChevronRight, ClipboardList, MessageCircle, Megaphone, Users,
  ChefHat, Printer, X, BarChart2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { api, PAY, type Tab, type KOrder } from "./admin/shared";

import { OverviewTab    } from "./admin/OverviewTab";
import { KanbanTab      } from "./admin/KanbanTab";
import { ProductsTab    } from "./admin/ProductsTab";
import { CategoriesTab  } from "./admin/CategoriesTab";
import { CustomersTab   } from "./admin/CustomersTab";
import { AnalyticsTab   } from "./admin/AnalyticsTab";
import { MarketingTab   } from "./admin/MarketingTab";
import { WhatsAppTab    } from "./admin/WhatsAppTab";
import { SettingsTab    } from "./admin/SettingsTab";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [newOrderAlerts, setNewOrderAlerts] = useState<KOrder[]>([]);
  const [printOrder, setPrintOrder] = useState<KOrder|null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const seenOrderIds = useRef<Set<number>>(new Set());
  const audioCtx = useRef<AudioContext|null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const playBeep = () => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; gain.gain.value = 0.3;
      osc.start(); osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 1100; g2.gain.value = 0.3;
        o2.start(); o2.stop(ctx.currentTime + 0.15);
      }, 200);
    } catch {}
  };

  const { isLoading:authLoading, isError:authError } = useQuery({ queryKey:["/api/admin/check"], queryFn:()=>api("/api/admin/check"), retry:false });
  useEffect(() => { if (authError) setLocation("/painel/login"); }, [authError]);

  const enabled = !authLoading && !authError;

  const { data:kanbanOrders=[] } = useQuery<KOrder[]>({ queryKey:["/api/admin/orders"], queryFn:()=>api("/api/admin/orders"), enabled });
  const { data:waData } = useQuery<{ orders:any[]; stats:{total:number;pendente:number;pago:number} }>({ queryKey:["/api/admin/whatsapp-orders"], queryFn:()=>api("/api/admin/whatsapp-orders"), enabled, refetchOnWindowFocus:false });

  const handleWsEvent = useCallback((event: { type: string }) => {
    if (event.type === "order:new" || event.type === "order:status") qc.invalidateQueries({ queryKey:["/api/admin/orders"] });
    if (event.type === "whatsapp:new" || event.type === "whatsapp:status") qc.invalidateQueries({ queryKey:["/api/admin/whatsapp-orders"] });
    if (event.type !== "ping") setWsConnected(true);
  }, [qc]);

  useRealtime(handleWsEvent);
  useEffect(() => { const t = setTimeout(() => setWsConnected(true), 1500); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!kanbanOrders.length) return;
    const newPending = kanbanOrders.filter(o => o.status === "pending" && !seenOrderIds.current.has(o.id));
    if (newPending.length > 0 && seenOrderIds.current.size > 0) { playBeep(); setNewOrderAlerts(prev => [...prev, ...newPending]); }
    kanbanOrders.forEach(o => seenOrderIds.current.add(o.id));
  }, [kanbanOrders]);

  const handleLogout = async () => { await fetch("/api/admin/logout",{method:"POST",credentials:"include"}); setLocation("/"); };

  if (authLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-400 text-sm">Verificando acesso...</div></div>;
  if (authError) return null;

  const navItems: { tab:Tab; label:string; icon:React.ReactNode; badge?:number }[] = [
    { tab:"overview",   label:"Visão Geral",  icon:<LayoutDashboard className="w-4 h-4"/> },
    { tab:"orders",     label:"Pedidos",       icon:<ClipboardList   className="w-4 h-4"/> },
    { tab:"products",   label:"Produtos",      icon:<Package         className="w-4 h-4"/> },
    { tab:"categories", label:"Categorias",    icon:<Tag             className="w-4 h-4"/> },
    { tab:"customers",  label:"Clientes",      icon:<Users           className="w-4 h-4"/> },
    { tab:"analytics",  label:"Relatórios",    icon:<BarChart2       className="w-4 h-4"/> },
    { tab:"marketing",  label:"Marketing",     icon:<Megaphone       className="w-4 h-4"/> },
    { tab:"whatsapp",   label:"WhatsApp",      icon:<MessageCircle   className="w-4 h-4"/>, badge:waData?.stats?.pendente||0 },
    { tab:"settings",   label:"Configurações", icon:<Settings        className="w-4 h-4"/> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><ChefHat className="w-4 h-4 text-primary"/></div>
            <div><p className="text-white font-bold text-sm leading-tight">Estação da</p><p className="text-primary font-bold text-sm leading-tight">Esfiha</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item=>(
            <button key={item.tab} onClick={()=>setActiveTab(item.tab)} data-testid={`nav-${item.tab}`} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", activeTab===item.tab?"bg-primary text-white":"text-gray-400 hover:text-white hover:bg-gray-800")}>
              {item.icon}<span className="flex-1 text-left">{item.label}</span>
              {item.badge!=null&&item.badge>0&&<span className="bg-[#25D366] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <a href="/" target="_blank" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"><ExternalLink className="w-4 h-4"/>Ver cardápio</a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all" data-testid="button-logout"><LogOut className="w-4 h-4"/>Sair</button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-10">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1.5 shrink-0"><ChefHat className="w-4 h-4 text-primary"/><span className="text-white font-bold text-xs">Admin</span></div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-0.5 w-max">
              {navItems.map(item=>(
                <button key={item.tab} onClick={()=>setActiveTab(item.tab)} className={cn("relative shrink-0 p-2 rounded-lg transition-all", activeTab===item.tab?"bg-primary text-white":"text-gray-400 hover:text-white")} title={item.label}>
                  {item.icon}
                  {item.badge!=null&&item.badge>0&&<span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#25D366] rounded-full"/>}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 shrink-0"><LogOut className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-56 min-h-screen mt-12 md:mt-0">

        {/* New order alerts */}
        {newOrderAlerts.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
            {newOrderAlerts.map(order=>(
              <div key={order.id} className="bg-red-600 rounded-xl p-3 shadow-2xl border border-red-500 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white">🔔 Novo pedido #{order.id}!</p>
                  <p className="text-red-100 text-xs">{order.customerName} · R$ {parseFloat(order.total).toFixed(2).replace(".",",")} · {PAY[order.paymentMethod]||order.paymentMethod}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={()=>{setActiveTab("orders");setNewOrderAlerts(prev=>prev.filter(o=>o.id!==order.id));}} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold text-white">Ver</button>
                  <button onClick={()=>setPrintOrder(order)} className="px-3 py-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1"><Printer className="w-3 h-3"/>Imprimir</button>
                  <button onClick={()=>setNewOrderAlerts(prev=>prev.filter(o=>o.id!==order.id))} className="p-1 text-red-200 hover:text-white"><X className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Print modal (for alert-based printing) */}
        {printOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setPrintOrder(null)}>
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Comanda #{printOrder.id}</h2>
                <button onClick={()=>setPrintOrder(null)}><X className="w-5 h-5 text-gray-400"/></button>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-700"><span className="font-semibold">Cliente:</span> {printOrder.customerName}</p>
                <p className="text-sm text-gray-700"><span className="font-semibold">Telefone:</span> {printOrder.customerPhone}</p>
                {printOrder.deliveryAddress&&<p className="text-sm text-gray-700"><span className="font-semibold">Endereço:</span> {printOrder.deliveryAddress}</p>}
                <p className="text-sm text-gray-700"><span className="font-semibold">Pagamento:</span> {PAY[printOrder.paymentMethod]||printOrder.paymentMethod}</p>
                {printOrder.changeFor&&<p className="text-sm text-gray-700"><span className="font-semibold">Troco para:</span> R$ {parseFloat(printOrder.changeFor).toFixed(2)}</p>}
                <hr className="my-2"/>
                {printOrder.items.map((it,i)=><p key={i} className="text-sm text-gray-700">{it.quantity}× {it.productName} — R$ {(parseFloat(it.unitPrice)*it.quantity).toFixed(2).replace(".",",")}{it.notes&&<span className="text-gray-500 text-xs"> ({it.notes})</span>}</p>)}
                <hr className="my-2"/>
                <p className="font-bold text-gray-900 text-base">Total: R$ {parseFloat(printOrder.total).toFixed(2).replace(".",",")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>window.print()} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90"><Printer className="w-4 h-4"/>Imprimir</button>
                <button onClick={()=>setPrintOrder(null)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab==="overview"   && <OverviewTab   setActiveTab={setActiveTab}/>}
        {activeTab==="orders"     && <KanbanTab     wsConnected={wsConnected}/>}
        {activeTab==="products"   && <ProductsTab/>}
        {activeTab==="categories" && <CategoriesTab/>}
        {activeTab==="customers"  && <CustomersTab/>}
        {activeTab==="analytics"  && <AnalyticsTab/>}
        {activeTab==="marketing"  && <MarketingTab/>}
        {activeTab==="whatsapp"   && <WhatsAppTab/>}
        {activeTab==="settings"   && <SettingsTab/>}

      </main>
    </div>
  );
}
