import { useState, useEffect, useRef, useCallback } from "react";
import { Bike, MapPin, LogOut, Wifi, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiderInfo {
  id: number;
  name: string;
  phone: string;
}

const STORAGE_KEY = "rider_session";

function useRiderWS(rider: RiderInfo | null, active: boolean) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const watchRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!rider || !active) return;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "rider:auth", riderId: rider.id, riderName: rider.name }));
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "rider:location",
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              riderName: rider.name,
            }));
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    };

    ws.onclose = () => {
      setConnected(false);
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      if (active) setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [rider, active]);

  useEffect(() => {
    if (active && rider) {
      connect();
    } else {
      wsRef.current?.close();
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      setConnected(false);
    }
    return () => {
      wsRef.current?.close();
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    };
  }, [active, rider?.id]);

  return connected;
}

function LoginScreen({ onLogin }: { onLogin: (r: RiderInfo) => void }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/rider/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      onLogin(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
            <Bike className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-white">Portal do Motoqueiro</h1>
          <p className="text-gray-400 text-sm">Estação da Esfiha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="11 99999-8888"
              required
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">PIN de acesso</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="••••"
              required
              maxLength={8}
              inputMode="numeric"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0"/>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-base transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ rider, onLogout }: { rider: RiderInfo; onLogout: () => void }) {
  const [active, setActive] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const connected = useRiderWS(rider, active);
  const watchRef = useRef<number | null>(null);

  const handleToggle = async () => {
    if (active) {
      setActive(false);
      if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      return;
    }
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Seu dispositivo não suporta GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setActive(true);
        watchRef.current = navigator.geolocation.watchPosition(
          p => setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      },
      () => setGeoError("Permita o acesso à localização nas configurações do navegador."),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bike className="w-5 h-5 text-primary"/>
          </div>
          <div>
            <p className="text-white font-bold text-sm">{rider.name}</p>
            <p className="text-gray-400 text-xs">{rider.phone}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
          <LogOut className="w-5 h-5"/>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className={cn(
          "w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 border-4 transition-all duration-500 cursor-pointer select-none",
          active
            ? "bg-blue-600 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            : "bg-gray-800 border-gray-600"
        )} onClick={handleToggle}>
          <Bike className={cn("w-16 h-16", active ? "text-white" : "text-gray-500")}/>
          <span className={cn("font-black text-base", active ? "text-white" : "text-gray-500")}>
            {active ? "EM ROTA" : "OFFLINE"}
          </span>
          {active && <span className="text-blue-200 text-xs animate-pulse">● compartilhando</span>}
        </div>

        <p className="text-gray-400 text-sm text-center">
          {active ? "Sua localização está sendo compartilhada em tempo real com o admin." : "Toque para ativar o compartilhamento de localização."}
        </p>

        {geoError && (
          <div className="w-full max-w-xs flex items-start gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>
            <p className="text-red-300 text-sm">{geoError}</p>
          </div>
        )}

        <div className="w-full max-w-xs space-y-2">
          <div className={cn("flex items-center gap-3 p-3 rounded-xl border", connected ? "bg-green-900/20 border-green-700/40" : "bg-gray-800/50 border-gray-700")}>
            {connected ? <Wifi className="w-4 h-4 text-green-400"/> : <WifiOff className="w-4 h-4 text-gray-500"/>}
            <span className={cn("text-sm font-medium", connected ? "text-green-300" : "text-gray-500")}>
              {connected ? "Conectado ao servidor" : "Desconectado"}
            </span>
          </div>

          {currentPos && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-800/50 border-gray-700">
              <MapPin className="w-4 h-4 text-blue-400"/>
              <div>
                <p className="text-gray-300 text-xs">Localização atual</p>
                <p className="text-gray-400 text-[10px]">{currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto"/>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 text-center">
        <p className="text-gray-600 text-xs">Estação da Esfiha · Portal do Motoqueiro</p>
      </div>
    </div>
  );
}

export default function RiderPortal() {
  const [rider, setRider] = useState<RiderInfo | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  });

  const handleLogin = (r: RiderInfo) => setRider(r);
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRider(null);
  };

  if (!rider) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard rider={rider} onLogout={handleLogout} />;
}
