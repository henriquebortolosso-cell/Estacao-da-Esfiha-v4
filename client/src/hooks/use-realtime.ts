import { useEffect, useRef, useCallback } from "react";

type WSEvent =
  | { type: "order:new" }
  | { type: "order:status"; orderId: number; status: string }
  | { type: "whatsapp:new" }
  | { type: "whatsapp:status"; orderId: number; status: string }
  | { type: "ping" };

type Handler = (event: WSEvent) => void;

function getWsUrl() {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws`;
}

export function useRealtime(onEvent: Handler) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef<Handler>(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    socketRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent;
        onEventRef.current(event);
      } catch {}
    };

    ws.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);
}

export function useOrderRealtime(
  orderId: number | null,
  onStatusChange: (status: string) => void
) {
  useRealtime((event) => {
    if (
      event.type === "order:status" &&
      orderId !== null &&
      event.orderId === orderId
    ) {
      onStatusChange(event.status);
    }
  });
}
