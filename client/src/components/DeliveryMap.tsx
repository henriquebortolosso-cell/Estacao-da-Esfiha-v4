import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Zone = { label: string; maxKm: number; fee: string };

interface DeliveryMapProps {
  latitude?: number;
  longitude?: number;
  zones?: Zone[];
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  className?: string;
}

const ZONE_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"];

export function DeliveryMap({ latitude, longitude, zones = [], onLocationSelect, interactive = false, className = "h-64 rounded-xl overflow-hidden" }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const markerRef = useRef<any>(null);

  const defaultLat = latitude || -23.55;
  const defaultLng = longitude || -46.63;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      if (latitude && longitude) {
        map.setView([latitude, longitude], 13);
        markerRef.current = L.marker([latitude, longitude]).addTo(map).bindPopup("Estação da Esfiha").openPopup();
      } else {
        map.setView([defaultLat, defaultLng], 12);
      }

      if (zones.length > 0 && latitude && longitude) {
        zones.forEach((zone, i) => {
          const color = ZONE_COLORS[i % ZONE_COLORS.length];
          const circle = L.circle([latitude, longitude], {
            radius: zone.maxKm * 1000,
            color,
            fillColor: color,
            fillOpacity: 0.06,
            weight: 2,
          }).addTo(map).bindPopup(`${zone.label} — R$ ${zone.fee}`);
          circlesRef.current.push(circle);
        });
        if (zones.length > 0) {
          const maxKm = Math.max(...zones.map(z => z.maxKm));
          map.fitBounds([[latitude - maxKm/111, longitude - maxKm/111], [latitude + maxKm/111, longitude + maxKm/111]]);
        }
      }

      if (interactive && onLocationSelect) {
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          else markerRef.current = L.marker([lat, lng]).addTo(map);
          onLocationSelect(lat, lng);
        });
        map.getContainer().style.cursor = "crosshair";
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        circlesRef.current = [];
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then(L => {
      circlesRef.current.forEach(c => c.remove());
      circlesRef.current = [];
      if (!latitude || !longitude) return;
      if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
      else markerRef.current = L.marker([latitude, longitude]).addTo(mapInstanceRef.current).bindPopup("Estação da Esfiha");
      mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom() || 13);
      zones.forEach((zone, i) => {
        const color = ZONE_COLORS[i % ZONE_COLORS.length];
        const circle = L.circle([latitude, longitude], {
          radius: zone.maxKm * 1000, color, fillColor: color, fillOpacity: 0.06, weight: 2,
        }).addTo(mapInstanceRef.current).bindPopup(`${zone.label} — R$ ${zone.fee}`);
        circlesRef.current.push(circle);
      });
    });
  }, [latitude, longitude, JSON.stringify(zones)]);

  return <div ref={mapRef} className={className}/>;
}
