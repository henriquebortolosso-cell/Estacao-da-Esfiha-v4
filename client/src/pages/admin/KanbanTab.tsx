import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, MapPin, Phone, Printer, RefreshCw, Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api, PAY, KCOLS, type KOrder, type RiderLocation } from "./shared";
import { useEffect, useRef } from "react";

function PrintReceipt({ order }: { order: KOrder }) {
  return (
    <div id={`receipt-${order.id}`} className="hidden print:block" style={{ fontFamily:"monospace", width:280 }}>
      <h2 style={{ textAlign:"center", fontSize:16, margin:"0 0 4px" }}>Estação da Esfiha</h2>
      <hr />
      <p style={{ margin:"4px 0" }}>Pedido #{order.id} — {order.createdAt ? new Date(order.createdAt).toLocaleString("pt-BR") : ""}</p>
      <p style={{ margin:"4px 0" }}>Cliente: {order.customerName}</p>
      <p style={{ margin:"4px 0" }}>Tel: {order.customerPhone}</p>
      {order.deliveryAddress && <p style={{ margin:"4px 0" }}>End: {order.deliveryAddress}</p>}
      <hr />
      {order.items.map((item,i) => (
        <p key={i} style={{ margin:"2px 0" }}>
          {item.quantity}x {item.productName} ... R$ {(parseFloat(item.unitPrice)*item.quantity).toFixed(2).replace(".",",")}
          {item.notes && <span> ({item.notes})</span>}
        </p>
      ))}
      <hr />
      {order.discountAmount && parseFloat(order.discountAmount)>0 && (
        <p style={{ margin:"4px 0" }}>Desconto: -R$ {parseFloat(order.discountAmount).toFixed(2).replace(".",",")}</p>
      )}
      <p style={{ margin:"4px 0", fontWeight:"bold" }}>TOTAL: R$ {parseFloat(order.total).toFixed(2).replace(".",",")}</p>
      <p style={{ margin:"4px 0" }}>Pagamento: {PAY[order.paymentMethod]||order.paymentMethod}</p>
      {order.changeFor && <p style={{ margin:"4px 0" }}>Troco p/ R$ {parseFloat(order.changeFor).toFixed(2).replace(".",",")}</p>}
    </div>
  );
}

function RiderMap({ locations }: { locations: RiderLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRefs = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstance.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      if (locations.length > 0) {
        map.setView([locations[0].lat, locations[0].lng], 14);
      } else {
        map.setView([-23.55, -46.63], 12);
      }
    });
    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      markerRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then(L => {
      markerRefs.current.forEach(m => m.remove());
      markerRefs.current.clear();
      locations.forEach(loc => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#3b82f6;color:white;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:bold;white-space:nowrap;display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏍️ ${loc.riderName}</div>`,
          iconAnchor: [40, 16],
        });
        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(mapInstance.current);
        markerRefs.current.set(loc.riderId, marker);
      });
      if (locations.length > 0) {
        mapInstance.current.setView([locations[0].lat, locations[0].lng], mapInstance.current.getZoom() || 14);
      }
    });
  }, [JSON.stringify(locations)]);

  return <div ref={mapRef} className="h-44 rounded-xl overflow-hidden border border-blue-800/40 mt-2" />;
}

function OrderCard({ order, onMove, riderLocations }: { order:KOrder; onMove:(id:number,status:string)=>void; riderLocations: RiderLocation[] }) {
  const col = KCOLS.find(c => c.key === order.status) || KCOLS.find(c => c.key === "preparing");

  const FLOW: Record<string, { next: string; label: string; color: string }> = {
    pending:          { next: "preparing",        label: "✓ Aceitar e Preparar",     color: "bg-amber-500 hover:bg-amber-400" },
    preparing:        { next: "out_for_delivery", label: "🏍️ Saiu para Entrega",    color: "bg-blue-500 hover:bg-blue-400" },
    out_for_delivery: { next: "completed",         label: "✓ Marcar como Entregue",  color: "bg-green-600 hover:bg-green-500" },
  };

  const action = FLOW[order.status];

  const handlePrint = async () => {
    const eAPI = (window as any).electronAPI;
    if (eAPI?.isElectron) {
      const r = await eAPI.printSilent({ pageSize:"A4" });
      if (r?.success) return;
    }
    const el = document.getElementById(`receipt-${order.id}`);
    if (!el) return;
    const win = window.open("","_blank","width=400,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Pedido #${order.id}</title></head><body>${el.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  return (
    <div className={cn("bg-gray-900 rounded-xl border-l-4 p-4 space-y-3", col?.color || "border-gray-700")}>
      <PrintReceipt order={order} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-bold text-sm">{order.customerName}</p>
          <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{order.customerPhone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-white font-black text-lg">R$ {parseFloat(order.total).toFixed(2).replace(".",",")}</p>
          <p className="text-gray-500 text-[10px]">#{order.id}</p>
        </div>
      </div>
      {order.deliveryAddress && (
        <p className="text-gray-400 text-xs flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0"/>{order.deliveryAddress}</p>
      )}
      <div className="space-y-1">
        {order.items.map((item,i) => (
          <p key={i} className="text-gray-300 text-xs">
            {item.quantity}× {item.productName}
            {item.notes && <span className="text-gray-500"> ({item.notes})</span>}
          </p>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <CreditCard className="w-3 h-3"/>
        {PAY[order.paymentMethod]||order.paymentMethod}
        {order.changeFor && <span className="text-gray-500">· troco p/ R$ {parseFloat(order.changeFor).toFixed(2).replace(".",",")}</span>}
        {order.usedFreeDelivery && <span className="ml-1 text-green-400 font-semibold">· Entrega grátis</span>}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors">
          <Printer className="w-3.5 h-3.5"/> Imprimir
        </button>
        {action && (
          <button onClick={() => onMove(order.id, action.next)} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-colors text-white", action.color)}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function KanbanTab({ wsConnected }: { wsConnected: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data:orders=[], dataUpdatedAt:updatedAt } = useQuery<KOrder[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: () => api("/api/admin/orders"),
  });
  const { data:riderLocations=[] } = useQuery<RiderLocation[]>({
    queryKey: ["/api/rider-locations"],
    queryFn: () => api("/api/rider-locations"),
    refetchInterval: 5000,
  });

  const moveOrder = useMutation({
    mutationFn: ({ id, status }: { id:number; status:string }) => api(`/api/admin/orders/${id}/status`, "PATCH", { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/orders"] }),
    onError: (e:Error) => toast({ title:"Erro", description:e.message, variant:"destructive" }),
  });

  const grouped = KCOLS.reduce((acc,col) => {
    acc[col.key] = orders.filter(o => o.status === col.key || (col.key === "out_for_delivery" && o.status === "delivered"));
    return acc;
  }, {} as Record<string, KOrder[]>);

  const hasRiders = riderLocations.length > 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg">Pedidos — Kanban</h1>
          {wsConnected && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-[10px] font-semibold animate-pulse">
              ● AO VIVO
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {updatedAt>0 && <span className="text-gray-500 text-xs">Atualizado às {new Date(updatedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>}
          <button onClick={()=>qc.invalidateQueries({queryKey:["/api/admin/orders"]})} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/>Atualizar
          </button>
        </div>
      </div>

      {hasRiders && (
        <div className="bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-blue-400"/>
            <span className="text-blue-300 text-sm font-semibold">Motoqueiros em rota</span>
            <span className="flex items-center gap-1 text-blue-400 text-[10px] animate-pulse ml-auto">● AO VIVO</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {riderLocations.map(r => (
              <span key={r.riderId} className="bg-blue-900/60 text-blue-200 text-xs px-2 py-1 rounded-full">
                🏍️ {r.riderName}
              </span>
            ))}
          </div>
          <RiderMap locations={riderLocations} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {KCOLS.map(col => (
          <div key={col.key} className={cn("rounded-xl border border-gray-800 overflow-hidden", col.headerBg)}>
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2.5">
              <span className={cn("w-2 h-2 rounded-full shrink-0", col.dot, col.pulse && grouped[col.key].length>0 && "animate-pulse")}/>
              <span className="text-white font-semibold text-sm">{col.label}</span>
              <span className="ml-auto bg-gray-800 text-gray-300 text-xs font-bold px-2 py-0.5 rounded-full">{grouped[col.key].length}</span>
            </div>
            <div className="p-3 space-y-3 min-h-[120px] max-h-[70vh] overflow-y-auto">
              {grouped[col.key].length === 0
                ? <p className="text-gray-600 text-xs text-center py-6">Nenhum pedido aqui</p>
                : grouped[col.key].map(order => (
                    <OrderCard key={order.id} order={order} onMove={(id,status)=>moveOrder.mutate({id,status})} riderLocations={riderLocations} />
                  ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
