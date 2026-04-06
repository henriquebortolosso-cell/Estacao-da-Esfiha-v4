import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ShoppingBag, Phone, X, Mail, Check, Trophy, Gift, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, PAY, type Customer, type LoyaltyStats, type CustStat, type InactiveCustomer } from "./shared";
import type { Order } from "@shared/schema";

function CustomerDrawer({ customer, onClose }: { customer:Customer; onClose:()=>void }) {
  const { data: orders=[] } = useQuery<Order[]>({
    queryKey: ["/api/admin/customers", customer.phone, "orders"],
    queryFn: () => api(`/api/admin/customers/${customer.phone}/orders`),
  });
  const freeEarned    = Math.floor(customer.paidDeliveryOrders/10);
  const freeAvailable = freeEarned - customer.freeDeliveriesUsed;
  const progress      = customer.paidDeliveryOrders % 10;
  const lastOrder     = orders[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative w-full max-w-sm bg-gray-950 border-l border-gray-800 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
          <div><p className="text-white font-bold">{customer.name}</p><p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{customer.phone}</p></div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-3">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Fidelidade</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-white font-black text-xl">{customer.paidDeliveryOrders}</p><p className="text-gray-500 text-[10px]">Pedidos pagos</p></div>
              <div><p className="text-green-400 font-black text-xl">{freeAvailable}</p><p className="text-gray-500 text-[10px]">Frete grátis disp.</p></div>
              <div><p className="text-amber-400 font-black text-xl">{progress}/10</p><p className="text-gray-500 text-[10px]">Progresso</p></div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width:`${(progress/10)*100}%` }}/></div>
            <p className="text-gray-500 text-xs text-center">{freeAvailable>0?`${freeAvailable} entrega(s) grátis disponível!`:`${10-progress} pedidos para a próxima entrega grátis`}</p>
          </div>
          {lastOrder && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-2">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Último Pedido</p>
              <div className="flex items-center justify-between">
                <p className="text-white font-bold">R$ {parseFloat(lastOrder.total).toFixed(2).replace(".",",")}</p>
                {lastOrder.createdAt && <p className="text-gray-500 text-xs">{new Date(lastOrder.createdAt).toLocaleDateString("pt-BR")}</p>}
              </div>
              {lastOrder.paymentMethod && <p className="text-gray-400 text-xs">{PAY[lastOrder.paymentMethod]||lastOrder.paymentMethod}</p>}
            </div>
          )}
          {orders.length>0 ? (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Histórico ({orders.length})</p>
              {orders.map(o=>(
                <div key={o.id} className="bg-gray-900 rounded-lg px-3 py-2.5 border border-gray-800 flex items-center justify-between">
                  <div><p className="text-gray-300 text-xs font-medium">Pedido #{o.id}</p>{o.createdAt&&<p className="text-gray-500 text-[10px]">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</p>}</div>
                  <p className="text-white text-sm font-bold">R$ {parseFloat(o.total).toFixed(2).replace(".",",")}</p>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-8 text-gray-600 text-sm"><ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40"/>Nenhum pedido encontrado</div>}
        </div>
      </div>
    </div>
  );
}

function CustomerEmailCell({ phone, email, onSave }: { phone:string; email:string|null; onSave:(phone:string,email:string)=>void }) {
  const [editing,setEditing] = useState(false);
  const [val,setVal] = useState(email??"");
  return editing ? (
    <div className="flex items-center gap-1">
      <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter"){onSave(phone,val);setEditing(false);} if(e.key==="Escape")setEditing(false); }}
        className="flex-1 min-w-0 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none" placeholder="email@exemplo.com"/>
      <button onClick={()=>{onSave(phone,val);setEditing(false);}} className="p-1 text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5"/></button>
      <button onClick={()=>setEditing(false)} className="p-1 text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5"/></button>
    </div>
  ) : (
    <button onClick={()=>setEditing(true)} className="flex items-center gap-1.5 text-xs text-left group w-full">
      <Mail className="w-3 h-3 text-gray-600 group-hover:text-primary shrink-0"/>
      {email?<span className="text-gray-400 group-hover:text-white truncate">{email}</span>:<span className="text-gray-700 group-hover:text-gray-500 italic">Adicionar email</span>}
    </button>
  );
}

export function CustomersTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"inactive">("all");
  const [selected, setSelected] = useState<Customer|null>(null);

  const { data:loyaltyData } = useQuery<{ customers:Customer[]; stats:LoyaltyStats }>({ queryKey:["/api/admin/loyalty"], queryFn:()=>api("/api/admin/loyalty") });
  const { data:customersStats=[] } = useQuery<CustStat[]>({ queryKey:["/api/admin/analytics/customers-stats"], queryFn:()=>api("/api/admin/analytics/customers-stats") });
  const { data:inactiveCustomers=[] } = useQuery<InactiveCustomer[]>({ queryKey:["/api/admin/customers/inactive"], queryFn:()=>api("/api/admin/customers/inactive"), refetchOnWindowFocus:false });

  const updateEmail = useMutation({
    mutationFn: ({phone,email}:{phone:string;email:string}) => api(`/api/admin/customers/${phone}/email`,"PATCH",{email}),
    onSuccess: () => { qc.invalidateQueries({queryKey:["/api/admin/analytics/customers-stats"]}); toast({title:"Email atualizado!"}); },
    onError: (e:Error) => toast({title:"Erro",description:e.message,variant:"destructive"}),
  });

  const crmCustomers = (loyaltyData?.customers??[]).filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search.replace(/\D/g,"")));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary"/><h1 className="text-white font-bold text-lg">Clientes</h1></div>
        <p className="text-gray-500 text-xs">{customersStats.length} cliente{customersStats.length!==1?"s":""} cadastrado{customersStats.length!==1?"s":""}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"><Users className="w-5 h-5 text-primary mx-auto mb-1"/><p className="text-2xl font-black text-white">{customersStats.length}</p><p className="text-xs text-gray-400">Clientes</p></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"><Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1"/><p className="text-2xl font-black text-white">{loyaltyData?.stats?.totalPaidOrders??0}</p><p className="text-xs text-gray-400">Pedidos c/ fidelidade</p></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"><Gift className="w-5 h-5 text-green-400 mx-auto mb-1"/><p className="text-2xl font-black text-white">{loyaltyData?.stats?.totalFreeDeliveries??0}</p><p className="text-xs text-gray-400">Fretes grátis usados</p></div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setFilter("all")} className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-colors", filter==="all"?"bg-primary text-white":"bg-gray-800 text-gray-400 hover:text-white")}>Todos</button>
        <button onClick={()=>setFilter("inactive")} className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-colors", filter==="inactive"?"bg-primary text-white":"bg-gray-800 text-gray-400 hover:text-white")}>Inativos 30d</button>
      </div>

      {filter==="all" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30"/>
          </div>
          {customersStats.length===0
            ? <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center"><Users className="w-8 h-8 text-gray-600 mx-auto mb-2"/><p className="text-gray-400 text-sm">Nenhum cliente cadastrado</p></div>
            : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-12 px-4 py-2 border-b border-gray-800 text-gray-500 text-[10px] font-semibold uppercase tracking-wider">
                  <div className="col-span-3">Cliente</div><div className="col-span-3">Telefone</div><div className="col-span-4">Email</div><div className="col-span-1 text-right">Pedidos</div><div className="col-span-1 text-right">Total</div>
                </div>
                <div className="divide-y divide-gray-800">
                  {(()=>{
                    const filtered = search.trim() ? customersStats.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search)) : customersStats;
                    return filtered.map(c=>(
                      <div key={c.id} className="grid grid-cols-12 px-4 py-3 hover:bg-gray-800/40 transition-colors items-center">
                        <div className="col-span-12 md:col-span-3">
                          <button onClick={()=>setSelected(crmCustomers.find(x=>x.phone===c.phone)||null)} className="text-left">
                            <p className="text-white text-sm font-semibold hover:text-primary transition-colors">{c.name}</p>
                            <p className="text-gray-500 text-xs md:hidden">{c.phone}</p>
                          </button>
                        </div>
                        <div className="hidden md:flex col-span-3 items-center gap-1 text-gray-400 text-xs"><Phone className="w-3 h-3 text-gray-600"/>{c.phone}</div>
                        <div className="hidden md:block col-span-4"><CustomerEmailCell phone={c.phone} email={c.email} onSave={(phone,email)=>updateEmail.mutate({phone,email})}/></div>
                        <div className="col-span-2 md:col-span-1 text-right"><p className="text-gray-300 text-xs font-medium">{c.orderCount}</p></div>
                        <div className="col-span-2 md:col-span-2 text-right hidden md:block"><p className="text-green-400 text-sm font-bold">R$ {c.totalSpent.toFixed(2).replace(".",",")}</p></div>
                        <div className="md:hidden flex items-center justify-between mt-1">
                          <span className="text-gray-500 text-xs">{c.orderCount} pedidos</span>
                          <span className="text-green-400 text-xs font-bold">R$ {c.totalSpent.toFixed(2).replace(".",",")}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )
          }
        </>
      )}

      {filter==="inactive" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {inactiveCustomers.length===0
            ? <p className="text-gray-600 text-sm text-center py-10">Nenhum cliente inativo há mais de 30 dias</p>
            : (
              <div className="divide-y divide-gray-800">
                {inactiveCustomers.map(c=>{
                  const msg = encodeURIComponent(`Olá ${c.name}! Sentimos sua falta na Estação da Esfiha 🍕 Temos novidades esperando por você!`);
                  return (
                    <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium">{c.name}</p><p className="text-gray-500 text-xs">{c.phone} · {c.daysSinceLastOrder}d sem pedir</p></div>
                      <div className="text-right shrink-0 mr-2"><p className="text-green-400 text-xs font-bold">R$ {c.totalSpent.toFixed(2).replace(".",",")}</p><p className="text-gray-600 text-xs">{c.orderCount} pedidos</p></div>
                      <a href={`https://wa.me/55${c.phone}?text=${msg}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl text-xs font-bold shrink-0 transition-colors">WhatsApp</a>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {selected && <CustomerDrawer customer={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}
