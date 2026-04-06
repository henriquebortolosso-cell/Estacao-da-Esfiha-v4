import { useRoute, Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Clock, MapPin, Bike, Package, ChefHat, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useOrderRealtime } from "@/hooks/use-realtime";

interface TrackingStep { key: string; label: string; done: boolean; }
interface RiderLocation { riderId: number; riderName: string; lat: number; lng: number; }
interface TrackingData {
  id: number; customerName: string; status: string; statusLabel: string;
  deliveryAddress: string | null; total: string; createdAt: string | null;
  steps: TrackingStep[]; riderLocation?: RiderLocation | null;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:          <Clock className="w-6 h-6" />,
  preparing:        <ChefHat className="w-6 h-6" />,
  out_for_delivery: <Bike className="w-6 h-6" />,
  delivered:        <Bike className="w-6 h-6" />,
  completed:        <CheckCircle2 className="w-6 h-6" />,
};

const STEP_ICONS = [Package, ChefHat, Bike, CheckCircle2];

function MapView({ status, riderLocation }: { status: string; riderLocation?: RiderLocation | null }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  const isDelivering = status === "out_for_delivery" || status === "delivered";
  const showMap = status === "preparing" || isDelivering;

  useEffect(() => {
    if (!showMap || !mapRef.current) return;

    let L: any;
    const init = async () => {
      L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      if (mapInstance.current) return;

      const defaultCenter: [number, number] = [-23.5505, -46.6333];
      mapInstance.current = L.map(mapRef.current!).setView(defaultCenter, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance.current);

      L.marker(defaultCenter, {
        icon: L.divIcon({ className:"", html:`<div style="background:#D21033;color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:bold;white-space:nowrap">🏪 Loja</div>`, iconAnchor:[30,12] }),
      }).addTo(mapInstance.current);

      if (riderLocation) {
        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], {
          icon: L.divIcon({ className:"", html:`<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🏍️</div>`, iconAnchor:[14,14] }),
        }).addTo(mapInstance.current);
        mapInstance.current.setView([riderLocation.lat, riderLocation.lng], 14);
      }
    };

    init();
    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [showMap]);

  useEffect(() => {
    if (!mapInstance.current || !riderLocation) return;
    import("leaflet").then(L => {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng]);
      } else {
        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], {
          icon: L.divIcon({ className:"", html:`<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🏍️</div>`, iconAnchor:[14,14] }),
        }).addTo(mapInstance.current);
      }
      mapInstance.current.panTo([riderLocation.lat, riderLocation.lng]);
    });
  }, [riderLocation?.lat, riderLocation?.lng]);

  if (!showMap) return null;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className={cn("text-white px-4 py-2.5 flex items-center gap-2", status === "preparing" ? "bg-amber-500" : "bg-[#D21033]")}>
        {status === "preparing" ? <ChefHat className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
        <span className="font-bold text-sm">
          {status === "preparing"
            ? "Pedido em preparo na cozinha"
            : riderLocation
              ? `🏍️ ${riderLocation.riderName} — localização ao vivo`
              : "Motoboy em rota — rastreamento ao vivo"}
        </span>
        <span className={cn("ml-auto text-xs animate-pulse", status === "preparing" ? "text-amber-100" : "text-red-200")}>
          ● AO VIVO
        </span>
      </div>
      <div ref={mapRef} style={{ height: 280 }} />
    </div>
  );
}

export default function OrderTracking() {
  const [, params] = useRoute("/acompanhar/:id");
  const orderId = params ? parseInt(params.id, 10) : null;
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [liveUpdate, setLiveUpdate] = useState(false);

  const fetchTracking = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking`);
      if (!res.ok) throw new Error("Pedido não encontrado");
      setData(await res.json());
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  useOrderRealtime(orderId, (status) => {
    setData(prev => {
      if (!prev) return prev;
      const statusLabels: Record<string,string> = {
        pending:"Aguardando preparo", preparing:"Em preparo",
        out_for_delivery:"Saiu para entrega", delivered:"Saiu para entrega",
        completed:"Entregue!", cancelled:"Cancelado",
      };
      const isDelivering = status === "out_for_delivery" || status === "delivered";
      const isCompleted = status === "completed";
      const steps = [
        { key:"pending",          label:"Pedido recebido",  done:true },
        { key:"preparing",        label:"Em preparo",        done:status !== "pending" },
        { key:"out_for_delivery", label:"Saiu para entrega", done:isDelivering || isCompleted },
        { key:"completed",        label:"Entregue",          done:isCompleted },
      ];
      return { ...prev, status, statusLabel: statusLabels[status] ?? status, steps };
    });
    setLastRefresh(new Date());
    setLiveUpdate(true);
    setTimeout(() => setLiveUpdate(false), 3000);
  });

  const currentStep = data?.steps.filter(s => s.done).length ?? 0;

  const headerColor =
    data?.status === "completed"        ? "bg-gradient-to-br from-green-600 to-green-500" :
    data?.status === "out_for_delivery" ? "bg-gradient-to-br from-blue-600 to-blue-500" :
    data?.status === "delivered"        ? "bg-gradient-to-br from-blue-600 to-blue-500" :
    data?.status === "preparing"        ? "bg-gradient-to-br from-amber-500 to-orange-500" :
    data?.status === "cancelled"        ? "bg-gradient-to-br from-gray-600 to-gray-500" :
    "bg-gradient-to-br from-[#D21033] to-red-600";

  if (loading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-xl font-bold mb-4 text-foreground">{error || "Pedido não encontrado"}</p>
        <Link href="/" className="text-primary hover:underline font-medium">Voltar ao início</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        <div className="flex items-center gap-2 mb-2">
          <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Início
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 text-sm font-semibold">Rastrear pedido #{data.id}</span>
        </div>

        <div className={cn("rounded-xl p-5 text-white", headerColor)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Pedido #{data.id}</p>
              <h1 className="text-xl font-black leading-tight">{data.statusLabel}</h1>
              <p className="text-white/80 text-sm mt-1">Olá, {data.customerName.split(" ")[0]}!</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {STATUS_ICONS[data.status] ?? <Clock className="w-6 h-6" />}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-white/70 text-xs">Total: <span className="text-white font-bold">{formatCurrency(data.total)}</span></span>
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <span className={cn("w-1.5 h-1.5 rounded-full bg-white", liveUpdate ? "animate-ping" : "animate-pulse")} />
              {liveUpdate ? "Atualizado agora!" : "Tempo real"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4 text-sm">Progresso do pedido</h2>
          <div className="space-y-0">
            {data.steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? CheckCircle2;
              const isActive = i === currentStep - 1 && data.status !== "cancelled";
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all", step.done ? "bg-primary text-white" : "bg-gray-100 text-gray-300")}>
                      <Icon className={cn("w-4 h-4", isActive && step.done && "animate-pulse")} />
                    </div>
                    {i < data.steps.length - 1 && (
                      <div className={cn("w-0.5 h-8 mt-1", step.done && data.steps[i+1]?.done ? "bg-primary" : "bg-gray-100")} />
                    )}
                  </div>
                  <div className="pb-8 pt-1">
                    <p className={cn("text-sm font-semibold", step.done ? "text-foreground" : "text-gray-400")}>
                      {step.label}
                      {isActive && step.done && <span className="ml-2 text-xs text-primary font-normal animate-pulse">● em andamento</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <MapView status={data.status} riderLocation={data.riderLocation} />

        {data.deliveryAddress && (
          <div className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">Endereço de entrega</p>
              <p className="text-sm text-muted-foreground mt-0.5">{data.deliveryAddress}</p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Última atualização: {lastRefresh.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit", second:"2-digit" })} · Conectado em tempo real
        </p>

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
            Fazer novo pedido
          </Link>
        </div>

      </main>
    </div>
  );
}
