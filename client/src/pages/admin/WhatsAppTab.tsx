import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, PhoneCall, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, PAY, type WaOrder } from "./shared";

export function WhatsAppTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data:waData, dataUpdatedAt:waUpdated } = useQuery<{ orders:WaOrder[]; stats:{total:number;pendente:number;pago:number} }>({ queryKey:["/api/admin/whatsapp-orders"], queryFn:()=>api("/api/admin/whatsapp-orders"), refetchOnWindowFocus:false });
  const updateWaStatus = useMutation({
    mutationFn: ({id,status}:{id:number;status:string}) => api(`/api/admin/whatsapp-orders/${id}/status`,"PATCH",{status}),
    onSuccess: () => { qc.invalidateQueries({queryKey:["/api/admin/whatsapp-orders"]}); toast({title:"Status atualizado!"}); },
    onError: (e:Error) => toast({title:"Erro",description:e.message,variant:"destructive"}),
  });

  const sc: Record<string,string> = { pendente:"text-amber-400 bg-amber-400/10 border-amber-400/20", pago:"text-green-400 bg-green-400/10 border-green-400/20", cancelado:"text-red-400 bg-red-400/10 border-red-400/20" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3"><MessageCircle className="w-5 h-5 text-[#25D366]"/><h1 className="text-white font-bold text-lg">Pedidos via WhatsApp</h1></div>
        <div className="text-right">
          {waUpdated>0 && <p className="text-gray-500 text-[10px]">Atualizado às {new Date(waUpdated).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</p>}
          <button onClick={()=>qc.invalidateQueries({queryKey:["/api/admin/whatsapp-orders"]})} className="text-xs text-[#25D366] hover:underline">Atualizar agora</button>
        </div>
      </div>
      <p className="text-gray-400 text-sm">Clientes que escolheram finalizar pelo WhatsApp. Marque como <strong className="text-white">Pago</strong> para contabilizar no programa de fidelidade.</p>

      {waData?.stats && (
        <div className="grid grid-cols-3 gap-4">
          {[{icon:<MessageCircle className="w-5 h-5 text-[#25D366] mx-auto mb-1"/>,v:waData.stats.total,l:"Total"},{icon:<Clock className="w-5 h-5 text-amber-400 mx-auto mb-1"/>,v:waData.stats.pendente,l:"Pendentes"},{icon:<CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1"/>,v:waData.stats.pago,l:"Pagos"}].map((s,i)=>(
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">{s.icon}<p className="text-2xl font-black text-white">{s.v}</p><p className="text-xs text-gray-400">{s.l}</p></div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2"><PhoneCall className="w-4 h-4 text-[#25D366]"/><h2 className="text-white font-semibold text-sm">Lista de Pedidos</h2></div>
        {!waData?.orders?.length?<p className="p-8 text-center text-gray-500 text-sm">Nenhum pedido via WhatsApp ainda.</p>:(
          <div className="divide-y divide-gray-800">
            {waData.orders.map(order=>{ let items:any[]=[]; try{items=JSON.parse(order.itemsJson);}catch{} return (
              <div key={order.id} className="p-4 space-y-3" data-testid={`row-whatsapp-order-${order.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-white font-bold text-sm">{order.customerName}</span><a href={`https://wa.me/55${order.customerPhone}`} target="_blank" rel="noopener noreferrer" className="text-[#25D366] text-xs hover:underline flex items-center gap-1"><PhoneCall className="w-3 h-3"/>{order.customerPhone}</a></div>
                    {order.deliveryAddress&&<p className="text-gray-400 text-xs mt-0.5">{order.deliveryAddress}</p>}
                    {order.createdAt&&<p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>}
                  </div>
                  <div className="text-right shrink-0"><p className="text-white font-black text-lg">R$ {parseFloat(order.total).toFixed(2).replace(".",",")}</p><span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border",sc[order.status]||"text-gray-400")}>{order.status}</span></div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2.5 space-y-1">{items.map((it:any,i:number)=><p key={i} className="text-gray-300 text-xs">{it.quantity}× {it.name} — R$ {(it.unitPrice*it.quantity).toFixed(2).replace(".",",")}</p>)}</div>
                <div className="text-xs text-gray-400">{PAY[order.paymentMethod]||order.paymentMethod}</div>
                {order.status==="pendente"&&(
                  <div className="flex gap-2">
                    <button onClick={()=>updateWaStatus.mutate({id:order.id,status:"pago"})} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5"/>Confirmar pago</button>
                    <button onClick={()=>updateWaStatus.mutate({id:order.id,status:"cancelado"})} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg text-xs"><XCircle className="w-3.5 h-3.5"/>Cancelar</button>
                  </div>
                )}
              </div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
