import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, Clock, MapPin, QrCode, Save, ToggleLeft, ToggleRight, Plus, X, ChefHat, ExternalLink, BarChart3, Bike, Trash2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "./shared";
import type { StoreSettings } from "@shared/schema";
import { DeliveryMap } from "@/components/DeliveryMap";

type Rider = { id:number; name:string; phone:string; pin:string; active:boolean };

function RidersSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const inp = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const { data:riderList=[] } = useQuery<Rider[]>({ queryKey:["/api/admin/riders"], queryFn:()=>api("/api/admin/riders") });
  const [rName,setRName]=useState(""); const [rPhone,setRPhone]=useState(""); const [rPin,setRPin]=useState("");
  const addRider = useMutation({
    mutationFn:()=>api("/api/admin/riders","POST",{name:rName,phone:rPhone,pin:rPin}),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/admin/riders"]}); setRName(""); setRPhone(""); setRPin(""); toast({title:"Motoqueiro adicionado!"}); },
    onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}),
  });
  const toggleRider = useMutation({
    mutationFn:({id,active}:{id:number;active:boolean})=>api(`/api/admin/riders/${id}`,"PATCH",{active}),
    onSuccess:()=>qc.invalidateQueries({queryKey:["/api/admin/riders"]}),
  });
  const deleteRider = useMutation({
    mutationFn:(id:number)=>api(`/api/admin/riders/${id}`,"DELETE"),
    onSuccess:()=>qc.invalidateQueries({queryKey:["/api/admin/riders"]}),
  });
  const riderUrl = `${window.location.origin}/moto`;
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
      <div className="flex items-center gap-2"><Bike className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Motoqueiros</h2></div>
      <p className="text-gray-500 text-xs -mt-2">Cadastre os motoqueiros para que compartilhem localização em tempo real. O link de acesso deles é: <a href={riderUrl} target="_blank" className="text-primary underline">{riderUrl}</a></p>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="block text-[10px] text-gray-500 mb-0.5">Nome</label><input value={rName} onChange={e=>setRName(e.target.value)} className={inp} placeholder="João"/></div>
        <div><label className="block text-[10px] text-gray-500 mb-0.5">Telefone</label><input value={rPhone} onChange={e=>setRPhone(e.target.value.replace(/\D/g,""))} className={inp} placeholder="11999998888" inputMode="numeric"/></div>
        <div><label className="block text-[10px] text-gray-500 mb-0.5">PIN (4+ dígitos)</label><input value={rPin} onChange={e=>setRPin(e.target.value.replace(/\D/g,""))} className={inp} placeholder="1234" maxLength={8} inputMode="numeric"/></div>
      </div>
      <button onClick={()=>addRider.mutate()} disabled={!rName||!rPhone||rPin.length<4||addRider.isPending}
        className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
        <Plus className="w-3.5 h-3.5"/>Adicionar motoqueiro
      </button>
      {riderList.length > 0 && (
        <div className="space-y-2 pt-1">
          {riderList.map((r:Rider)=>(
            <div key={r.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", r.active?"bg-gray-800/50 border-gray-700":"bg-gray-900/50 border-gray-800 opacity-60")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", r.active?"bg-blue-600":"bg-gray-700")}>🏍️</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{r.name}</p>
                <p className="text-gray-400 text-xs flex items-center gap-1"><Phone className="w-3 h-3"/>{r.phone} · PIN: {r.pin}</p>
              </div>
              <button onClick={()=>toggleRider.mutate({id:r.id,active:!r.active})} className="shrink-0">
                {r.active?<ToggleRight className="w-7 h-7 text-blue-400"/>:<ToggleLeft className="w-7 h-7 text-gray-600"/>}
              </button>
              <button onClick={()=>deleteRider.mutate(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [changed, setChanged] = useState(false);

  const { data:settings } = useQuery<StoreSettings>({ queryKey:["/api/settings"], queryFn:()=>api("/api/settings") });
  useEffect(() => { if (settings) { setForm(settings); setChanged(false); } }, [settings]);

  const saveSettings = useMutation({
    mutationFn: (d:Partial<StoreSettings>) => api("/api/admin/settings","PUT",d),
    onSuccess: () => { qc.invalidateQueries({queryKey:["/api/settings"]}); setChanged(false); toast({title:"Configurações salvas!"}); },
    onError: (e:Error) => toast({title:"Erro",description:e.message,variant:"destructive"}),
  });

  const sf = (k: keyof StoreSettings | string, v: unknown) => { setForm(f=>({...f,[k]:v})); setChanged(true); };
  const sf2 = (k: string, v: unknown) => sf(k as keyof StoreSettings, v);

  const inp = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-white">Configurações</h1><p className="text-gray-400 text-sm mt-0.5">Gerencie as informações da sua loja</p></div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><Store className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Status da loja</h2></div>
        <div className="flex items-center justify-between">
          <div><p className="text-gray-200 text-sm font-medium">Loja aberta</p><p className="text-gray-500 text-xs">Quando fechado, clientes verão um aviso</p></div>
          <button onClick={()=>sf("isOpen",!form.isOpen)} data-testid="toggle-settings-store-open">
            {form.isOpen?<ToggleRight className="w-9 h-9 text-green-500"/>:<ToggleLeft className="w-9 h-9 text-gray-600"/>}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-400 mb-1">Abre às</label><input type="time" value={form.openTime||"10:00"} onChange={e=>sf("openTime",e.target.value)} className={inp} data-testid="input-open-time"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Fecha às</label><input type="time" value={form.closeTime||"23:00"} onChange={e=>sf("closeTime",e.target.value)} className={inp} data-testid="input-close-time"/></div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Entrega</h2></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-400 mb-1">Tempo mínimo (min)</label><input type="number" value={form.estimatedTimeMin||10} onChange={e=>sf("estimatedTimeMin",Number(e.target.value))} className={inp} min="1" data-testid="input-time-min"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Tempo máximo (min)</label><input type="number" value={form.estimatedTimeMax||60} onChange={e=>sf("estimatedTimeMax",Number(e.target.value))} className={inp} min="1" data-testid="input-time-max"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Taxa de entrega (R$)</label><input type="number" step="0.01" value={form.deliveryFee||"5.00"} onChange={e=>sf("deliveryFee",e.target.value)} className={inp} min="0" data-testid="input-delivery-fee"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Pedido mínimo (R$)</label><input type="number" step="0.01" value={form.minOrder||"15.00"} onChange={e=>sf("minOrder",e.target.value)} className={inp} min="0" data-testid="input-min-order"/></div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Zonas de Entrega</h2></div>
        <p className="text-gray-500 text-xs -mt-2">Configure as zonas por distância (km) e as taxas correspondentes.</p>
        {(()=>{
          const defaultZones = [{ label:"Zona 1 (até 3km)", maxKm:3, fee:"5.00" }, { label:"Zona 2 (3-7km)", maxKm:7, fee:"8.00" }, { label:"Zona 3 (7-15km)", maxKm:15, fee:"12.00" }];
          let zones = defaultZones;
          try { const parsed = JSON.parse((form as any).deliveryZones || "[]"); if(Array.isArray(parsed) && parsed.length > 0) zones = parsed; } catch {}
          const updateZone = (idx:number, field:string, val:string) => { const u = [...zones]; u[idx] = {...u[idx], [field]:field==="maxKm"?Number(val):val}; sf2("deliveryZones", JSON.stringify(u)); };
          const addZone = () => { const u=[...zones,{label:`Zona ${zones.length+1}`,maxKm:0,fee:"0.00"}]; sf2("deliveryZones", JSON.stringify(u)); };
          const removeZone = (idx:number) => { sf2("deliveryZones", JSON.stringify(zones.filter((_,i)=>i!==idx))); };
          return (
            <div className="space-y-2">
              {zones.map((zone:any, idx:number) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div><label className="block text-[10px] text-gray-500 mb-0.5">Nome</label><input value={zone.label} onChange={e=>updateZone(idx,"label",e.target.value)} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"/></div>
                    <div><label className="block text-[10px] text-gray-500 mb-0.5">Máx. KM</label><input type="number" value={zone.maxKm} onChange={e=>updateZone(idx,"maxKm",e.target.value)} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" min="0"/></div>
                    <div><label className="block text-[10px] text-gray-500 mb-0.5">Taxa (R$)</label><input type="number" step="0.50" value={zone.fee} onChange={e=>updateZone(idx,"fee",e.target.value)} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" min="0"/></div>
                  </div>
                  <button onClick={()=>removeZone(idx)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors shrink-0"><X className="w-4 h-4"/></button>
                </div>
              ))}
              <button onClick={addZone} className="flex items-center gap-1.5 text-primary text-xs font-semibold hover:text-primary/80 transition-colors px-1 py-1"><Plus className="w-3.5 h-3.5"/>Adicionar zona</button>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
                <div><label className="block text-xs text-gray-400 mb-1">Frete grátis acima de (R$)</label><input type="number" step="0.01" value={(form as any).freeShippingAbove||""} onChange={e=>sf2("freeShippingAbove",e.target.value||null)} className={inp} placeholder="0 = sem frete grátis"/></div>
                <div><label className="block text-xs text-gray-400 mb-1">Pedidos p/ fidelidade (frete grátis)</label><input type="number" value={(form as any).loyaltyOrdersRequired||10} onChange={e=>sf2("loyaltyOrdersRequired",Number(e.target.value))} className={inp} min="1"/></div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Banner promocional</h2></div>
        <p className="text-gray-500 text-xs -mt-2">Deixe em branco para ocultar.</p>
        {([{label:"URL da imagem",key:"bannerImageUrl",ph:"https://exemplo.com/banner.jpg",t:"input-banner-image"},{label:"Título",key:"bannerTitle",ph:"Ex: Promoção",t:"input-banner-title"},{label:"Link ao clicar",key:"bannerLink",ph:"https://linkdoapp.com",t:"input-banner-link"}]).map(({label,key,ph,t})=>(
          <div key={key}><label className="block text-xs text-gray-400 mb-1">{label}</label><input value={(form as any)[key]||""} onChange={e=>sf2(key,e.target.value||null)} className={inp} placeholder={ph} data-testid={t}/></div>
        ))}
        {(form as any).bannerImageUrl&&<img src={(form as any).bannerImageUrl} alt="preview" className="w-full rounded-xl max-h-32 object-cover border border-gray-700"/>}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Informações da loja</h2></div>
        {([{label:"Nome",key:"storeName",ph:"Estação da Esfiha",t:"input-store-name"},{label:"Descrição (hero)",key:"storeDescription",ph:"As melhores esfihas!",t:"input-store-description"},{label:"URL imagem hero",key:"heroImageUrl",ph:"https://exemplo.com/foto.jpg",t:"input-hero-image"}]).map(({label,key,ph,t})=>(
          <div key={key}><label className="block text-xs text-gray-400 mb-1">{label}</label><input value={(form as any)[key]||""} onChange={e=>sf2(key,e.target.value||null)} className={inp} placeholder={ph} data-testid={t}/></div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-400 mb-1">Nota</label><input value={(form as any).ratingScore||""} onChange={e=>sf2("ratingScore",e.target.value||null)} className={inp} placeholder="4.2" data-testid="input-rating-score"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Texto da avaliação</label><input value={(form as any).ratingText||""} onChange={e=>sf2("ratingText",e.target.value||null)} className={inp} placeholder="1.555 avaliações" data-testid="input-rating-text"/></div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Localização & Contato</h2></div>
        <div><label className="block text-xs text-gray-400 mb-1">Endereço</label><input value={(form as any).address||""} onChange={e=>sf2("address",e.target.value||null)} className={inp} placeholder="Av. dos Autonomistas, 6250" data-testid="input-address"/></div>
        <div><label className="block text-xs text-gray-400 mb-1">WhatsApp (só números, com DDD)</label><input value={(form as any).whatsappNumber||""} onChange={e=>sf2("whatsappNumber",e.target.value.replace(/\D/g,"")||null)} className={inp} placeholder="11999998888" data-testid="input-whatsapp"/></div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Horário por dia da semana</h2></div>
        {(()=>{ const def=[{day:"Segunda-feira",hours:"11:00 às 23:59"},{day:"Terça-feira",hours:"00:00 às 04:00"},{day:"Quarta-feira",hours:"11:00 às 23:59"},{day:"Quinta-feira",hours:"11:00 às 23:59"},{day:"Sexta-feira",hours:"11:00 às 23:59"},{day:"Sábado",hours:"11:00 às 23:58"},{day:"Domingo",hours:"11:00 às 23:59"}]; let sc=def; try{sc=JSON.parse((form as any).weeklySchedule||"")||def;}catch{} return sc.map((item:any,idx:number)=>(<div key={item.day} className="flex items-center gap-3"><span className="text-gray-400 text-xs w-28 shrink-0">{item.day}</span><input value={item.hours} onChange={e=>{ const u=[...sc]; u[idx]={...item,hours:e.target.value}; sf2("weeklySchedule",JSON.stringify(u)); }} className={`flex-1 ${inp}`} placeholder="11:00 às 23:59"/></div>)); })()}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Formas de pagamento</h2></div>
        {["Dinheiro","Cartão de Crédito","Cartão de Débito","Pix"].map(method=>{ let m:string[]=[]; try{m=JSON.parse((form as any).paymentMethods||"")||[];}catch{} const checked=m.includes(method); return (
          <label key={method} className="flex items-center gap-3 cursor-pointer" onClick={()=>{ let c:string[]=[]; try{c=JSON.parse((form as any).paymentMethods||"")||[];}catch{} const n=checked?c.filter((x:string)=>x!==method):[...c,method]; sf2("paymentMethods",JSON.stringify(n)); }}>
            <div className={cn("w-5 h-5 border-2 flex items-center justify-center rounded-sm transition-colors",checked?"bg-primary border-primary":"border-gray-600")}>{checked&&<span className="text-white text-xs font-black">✓</span>}</div>
            <span className="text-gray-300 text-sm">{method}</span>
          </label>
        ); })}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
        <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Chave PIX</h2></div>
        <input value={(form as any).pixKey||""} onChange={e=>sf2("pixKey",e.target.value||null)} className={inp} placeholder="email@exemplo.com, CPF, CNPJ ou telefone" data-testid="input-pix-key"/>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><ExternalLink className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Nossa História</h2></div>
        <div><label className="block text-xs text-gray-400 mb-1">Título</label><input value={form.storyTitle||""} onChange={e=>sf("storyTitle",e.target.value||null)} className={inp} placeholder="Nossa História" data-testid="input-story-title"/></div>
        <div><label className="block text-xs text-gray-400 mb-1">Texto</label><textarea value={form.storyText||""} onChange={e=>sf("storyText",e.target.value||null)} rows={6} className={`${inp} resize-none`} placeholder="Escreva a história da sua loja..." data-testid="input-story-text"/></div>
        <div><label className="block text-xs text-gray-400 mb-1">URL imagem de fundo</label><input value={(form as any).storyBgUrl||""} onChange={e=>sf2("storyBgUrl",e.target.value||null)} className={inp} placeholder="https://exemplo.com/fundo.jpg" data-testid="input-story-bg"/></div>
      </div>


      {/* Mapa de Entrega */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Mapa de Área de Entrega</h2></div>
        <p className="text-gray-500 text-xs -mt-2">Informe as coordenadas da sua loja para exibir o mapa de entrega. Clique no mapa para definir a localização.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Latitude</label>
            <input
              type="text"
              value={(form as any).storeLatitude || ""}
              onChange={e => sf2("storeLatitude", e.target.value || null)}
              className={inp}
              placeholder="-23.5505"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Longitude</label>
            <input
              type="text"
              value={(form as any).storeLongitude || ""}
              onChange={e => sf2("storeLongitude", e.target.value || null)}
              className={inp}
              placeholder="-46.6333"
            />
          </div>
        </div>
        {(() => {
          const lat = parseFloat((form as any).storeLatitude || "");
          const lng = parseFloat((form as any).storeLongitude || "");
          const defaultZones = [{ label:"Zona 1 (até 3km)", maxKm:3, fee:"5.00" }, { label:"Zona 2 (3-7km)", maxKm:7, fee:"8.00" }, { label:"Zona 3 (7-15km)", maxKm:15, fee:"12.00" }];
          let zones = defaultZones;
          try { const parsed = JSON.parse((form as any).deliveryZones || "[]"); if(Array.isArray(parsed) && parsed.length > 0) zones = parsed; } catch {}
          return (
            <DeliveryMap
              latitude={isNaN(lat) ? undefined : lat}
              longitude={isNaN(lng) ? undefined : lng}
              zones={zones}
              interactive
              onLocationSelect={(lat, lng) => {
                sf2("storeLatitude", String(lat.toFixed(6)));
                sf2("storeLongitude", String(lng.toFixed(6)));
              }}
              className="h-72 rounded-xl overflow-hidden border border-gray-700"
            />
          );
        })()}
        <p className="text-gray-600 text-xs">Dica: clique no mapa para definir o ponto exato da sua loja automaticamente.</p>
      </div>

      <RidersSection />

      {/* Integrações */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary"/><h2 className="text-white font-semibold text-sm">Integrações de Analytics</h2></div>
        <p className="text-gray-500 text-xs -mt-2">Conecte seu app ao Google Analytics e ao Facebook/Instagram para rastrear visitas e conversões automaticamente.</p>

        <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white">
              <svg viewBox="0 0 48 48" className="w-3.5 h-3.5"><path fill="#FFA000" d="M40.65 40H7.35L5 44h38z"/><path fill="#FF6F00" d="M24 8 8 40h32z"/><path fill="#FFC107" d="M24 8l8.8 17.6L40 8z"/></svg>
            </div>
            <span className="text-white text-sm font-medium">Google Analytics 4</span>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Measurement ID (G-XXXXXXXXXX)</label>
            <input
              value={(form as any).ga4Id || ""}
              onChange={e => sf2("ga4Id", e.target.value || null)}
              className={inp}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <p className="text-gray-600 text-xs">Encontre seu ID em: Analytics → Administrador → Fluxos de dados</p>
        </div>

        <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-600">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073c0 6.026 4.388 11.02 10.125 11.928v-8.43H7.078v-3.498h3.047V9.428c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.498h-2.796v8.43C19.612 23.093 24 18.099 24 12.073z"/></svg>
            </div>
            <span className="text-white text-sm font-medium">Facebook / Instagram Pixel</span>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pixel ID</label>
            <input
              value={(form as any).facebookPixelId || ""}
              onChange={e => sf2("facebookPixelId", e.target.value || null)}
              className={inp}
              placeholder="123456789012345"
            />
          </div>
          <p className="text-gray-600 text-xs">Encontre seu Pixel ID em: Gerenciador de Anúncios → Eventos → Pixel</p>
        </div>
      </div>

      <button onClick={()=>saveSettings.mutate(form)} disabled={!changed||saveSettings.isPending} data-testid="button-save-settings" className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all", changed?"bg-primary hover:bg-primary/90 text-white":"bg-gray-800 text-gray-600 cursor-not-allowed")}>
        <Save className="w-4 h-4"/>{saveSettings.isPending?"Salvando...":"Salvar configurações"}
      </button>
    </div>
  );
}
