import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import type { Duplex } from "stream";

let wss: WebSocketServer | null = null;

export type WSEvent =
  | { type: "order:new" }
  | { type: "order:status"; orderId: number; status: string }
  | { type: "whatsapp:new" }
  | { type: "whatsapp:status"; orderId: number; status: string }
  | { type: "rider:location"; riderId: number; riderName: string; lat: number; lng: number }
  | { type: "ping" };

type RiderInfo = { riderId: number; riderName: string; lat: number; lng: number; ts: number };
const riderLocations = new Map<number, RiderInfo>();

export function getRiderLocations(): RiderInfo[] {
  const cutoff = Date.now() - 60000;
  return [...riderLocations.values()].filter(r => r.ts > cutoff);
}

const riderSockets = new Map<WebSocket, number>();

export function setupWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = req.url ?? "";
    if (url === "/ws" || url.startsWith("/ws?")) {
      wss!.handleUpgrade(req, socket, head, (ws) => {
        wss!.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (socket) => {
    socket.on("error", () => {});

    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "rider:auth" && msg.riderId && msg.riderName) {
          riderSockets.set(socket, msg.riderId);
        }
        if (msg.type === "rider:location" && typeof msg.lat === "number" && typeof msg.lng === "number") {
          const riderId = riderSockets.get(socket);
          if (!riderId) return;
          const info = riderLocations.get(riderId);
          const riderName = msg.riderName || info?.riderName || "Motoqueiro";
          const update: RiderInfo = { riderId, riderName, lat: msg.lat, lng: msg.lng, ts: Date.now() };
          riderLocations.set(riderId, update);
          broadcast({ type: "rider:location", riderId, riderName: update.riderName, lat: msg.lat, lng: msg.lng });
        }
      } catch {}
    });

    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    socket.on("close", () => {
      clearInterval(heartbeat);
      const riderId = riderSockets.get(socket);
      if (riderId) {
        riderLocations.delete(riderId);
        riderSockets.delete(socket);
      }
    });
  });

  return wss;
}

export function broadcast(event: WSEvent) {
  if (!wss) return;
  const msg = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}
