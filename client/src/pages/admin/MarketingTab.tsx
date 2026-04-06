import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Tag, MessageCircle, Link2, Copy, Check, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, type Coupon, type CustStat } from "./shared";
import type { StoreSettings } from "@shared/schema";

function WALinkGen({ waNumber }: { waNumber?:string }) {
  const [copied, setCopied] = useState(false);
  const domain   = window.location.origin;
  const menuLink = `${domain}/`;
  const waLink   = waNumber ? `https://wa.me/55${waNumber}?text=${encodeURIComponent(`Olá! Vim pelo cardápio: ${menuLink}`)}` : "";
  const copy = (t:string) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Gerador de Links</h2></div>
      <div className="space-y-3">
        <div>
          <p className="text-gray-400 text-xs mb-1.5">Link do cardápio</p>
          <div className="flex gap-2">
            <input value={menuLink} readOnly className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm"/>
            <button onClick={()=>copy(menuLink)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4 text-gray-400"/>}
            </button>
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1.5">Link direto para o WhatsApp da loja</p>
          {waNumber ? (
            <div className="flex gap-2">
              <input value={waLink} readOnly className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm"/>
              <button onClick={()=>copy(waLink)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"><Copy className="w-4 h-4 text-gray-400"/></button>
            </div>
          ) : <p className="text-gray-600 text-xs">Configure o número do WhatsApp nas Configurações para gerar este link.</p>}
        </div>
      </div>
    </div>
  );
}

function CouponModal({ onClose, onSave }: { onClose:()=>void; onSave:(d:object)=>void }) {
  const [form, setForm] = useState({ code:"", type:"percent", value:"", minOrder:"", maxUses:"", expiresAt:"" });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-bold">Novo Cupom</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
        </div>
        <form onSubmit={e=>{ e.preventDefault(); onSave({ code:form.code.toUpperCase().trim(), type:form.type, value:form.value, minOrder:form.minOrder||null, maxUses:form.maxUses?Number(form.maxUses):null, expiresAt:form.expiresAt||null, active:true }); }} className="p-5 space-y-4">
          <div><label className="block text-xs text-gray-400 mb-1">Código</label><input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" placeholder="PRIMEIRACOMPRA" required/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-400 mb-1">Tipo</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"><option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select></div>
            <div><label className="block text-xs text-gray-400 mb-1">{form.type==="percent"?"Desconto (%)":"Desconto (R$)"}</label><input type="number" step="0.01" min="0" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={form.type==="percent"?"10":"5.00"} required/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-400 mb-1">Pedido mínimo (R$)</label><input type="number" step="0.01" min="0" value={form.minOrder} onChange={e=>setForm(f=>({...f,minOrder:e.target.value}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Sem mínimo"/></div>
            <div><label className="block text-xs text-gray-400 mb-1">Limite de usos</label><input type="number" min="1" value={form.maxUses} onChange={e=>setForm(f=>({...f,maxUses:e.target.value}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ilimitado"/></div>
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Validade</label><input type="datetime-local" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"/></div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">Criar cupom</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MarketingTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [couponModal, setCouponModal] = useState(false);

  const { data:settings     } = useQuery<StoreSettings>({ queryKey:["/api/settings"], queryFn:()=>api("/api/settings") });
  const { data:coupons=[]   } = useQuery<Coupon[]>({ queryKey:["/api/admin/coupons"], queryFn:()=>api("/api/admin/coupons") });
  const { data:customersStats=[] } = useQuery<CustStat[]>({ queryKey:["/api/admin/analytics/customers-stats"], queryFn:()=>api("/api/admin/analytics/customers-stats") });

  const createCoupon = useMutation({ mutationFn:(d:object)=>api("/api/admin/coupons","POST",d), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/admin/coupons"]}); setCouponModal(false); toast({title:"Cupom criado!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });
  const deleteCoupon = useMutation({ mutationFn:(id:number)=>api(`/api/admin/coupons/${id}`,"DELETE"), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/admin/coupons"]}); toast({title:"Cupom removido!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-primary"/><h1 className="text-white font-bold text-lg">Marketing & Divulgação</h1></div>

      <WALinkGen waNumber={(settings as any)?.whatsappNumber}/>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Cupons de Desconto</h2></div>
          <button onClick={()=>setCouponModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors"><Plus className="w-3.5 h-3.5"/>Novo cupom</button>
        </div>
        {coupons.length===0?<p className="text-gray-600 text-sm text-center py-10">Nenhum cupom criado ainda.</p>:(
          <div className="divide-y divide-gray-800">
            {coupons.map(coupon=>{ const isExpired=coupon.expiresAt&&new Date(coupon.expiresAt)<new Date(); const isExhausted=coupon.maxUses!==null&&coupon.usedCount>=coupon.maxUses; const isActive=coupon.active&&!isExpired&&!isExhausted; return (
              <div key={coupon.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="text-white font-mono font-bold text-sm">{coupon.code}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive?"bg-green-500/20 text-green-400":"bg-gray-700 text-gray-500"}`}>{isActive?"Ativo":isExpired?"Expirado":isExhausted?"Esgotado":"Inativo"}</span></div>
                  <p className="text-gray-400 text-xs mt-0.5">{coupon.type==="percent"?`${coupon.value}% off`:`R$ ${parseFloat(coupon.value).toFixed(2).replace(".",",")} off`}{coupon.minOrder&&` · mín. R$ ${parseFloat(coupon.minOrder).toFixed(2).replace(".",",")}`}{coupon.maxUses!==null&&` · ${coupon.usedCount}/${coupon.maxUses} usos`}{coupon.expiresAt&&` · expira ${new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}`}</p>
                </div>
                <button onClick={()=>deleteCoupon.mutate(coupon.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
            ); })}
          </div>
        )}
      </div>

      {couponModal && <CouponModal onClose={()=>setCouponModal(false)} onSave={d=>createCoupon.mutate(d)}/>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#25D366]"/><h2 className="text-white font-semibold text-sm">Disparar para Clientes</h2></div>
          <span className="text-gray-500 text-xs">{customersStats.length} clientes cadastrados</span>
        </div>
        <div className="px-4 py-3 border-b border-gray-800"><p className="text-gray-400 text-xs">Clique no botão WhatsApp para abrir uma conversa direta com o cliente. Ideal para promoções, avisos e fidelização.</p></div>
        {customersStats.length===0?<p className="text-gray-600 text-sm text-center py-8">Nenhum cliente cadastrado ainda.</p>:(
          <div className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
            {customersStats.map(c=>{
              const msg=encodeURIComponent(`Olá ${c.name}! Temos novidades na Estação da Esfiha. Confira nossas promoções! 🍕`);
              const waLink=`https://wa.me/55${c.phone}?text=${msg}`;
              return (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-800/40 transition-colors">
                  <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium">{c.name}</p><p className="text-gray-500 text-xs">{c.phone}{c.email&&` · ${c.email}`}</p></div>
                  <div className="text-right shrink-0 mr-2"><p className="text-green-400 text-xs font-bold">R$ {c.totalSpent.toFixed(2).replace(".",",")}</p><p className="text-gray-600 text-xs">{c.orderCount} pedidos</p></div>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl text-xs font-bold shrink-0 transition-colors"><MessageCircle className="w-3.5 h-3.5"/>WhatsApp</a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
