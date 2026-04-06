export type Tab = "overview"|"orders"|"products"|"categories"|"customers"|"analytics"|"marketing"|"whatsapp"|"settings";

export const PAY: Record<string,string> = { pix:"Pix", cartao_credito:"Crédito", cartao_debito:"Débito", dinheiro:"Dinheiro" };

export type KOrderItem = { id:number; productId:number; quantity:number; unitPrice:string; notes:string|null; productName:string };
export type KOrder = { id:number; customerName:string; customerPhone:string; deliveryAddress:string|null; paymentMethod:string; changeFor:string|null; status:string; total:string; usedFreeDelivery:boolean; couponCode:string|null; discountAmount:string|null; createdAt:string|null; items:KOrderItem[] };
export type WaOrder = { id:number; customerName:string; customerPhone:string; deliveryAddress:string|null; itemsJson:string; paymentMethod:string; total:string; status:string; createdAt:string|null };
export type Customer = { id:number; phone:string; name:string; paidDeliveryOrders:number; freeDeliveriesUsed:number; createdAt:string };
export type LoyaltyStats = { totalPaidOrders:number; totalFreeDeliveries:number; totalCustomers:number };
export type Coupon = { id:number; code:string; type:string; value:string; minOrder:string|null; maxUses:number|null; usedCount:number; expiresAt:string|null; active:boolean; createdAt:string|null };
export type AnalyticsSummary = { todayRevenue:number; todayCount:number; weekRevenue:number; monthRevenue:number; monthCount:number; avgTicket:number; totalOrders:number };
export type ChartDay = { date:string; revenue:number; count:number };
export type PayMethod = { method:string; count:number; revenue:number };
export type CustStat = { id:number; phone:string; name:string; email:string|null; paidDeliveryOrders:number; freeDeliveriesUsed:number; createdAt:string; totalSpent:number; lastOrderAt:string|null; orderCount:number };
export type PlatformStat = { platform:string; count:number; revenue:number };
export type ReturnRate = { returnRate:number; returningCustomers:number; totalCustomers:number };
export type InactiveCustomer = { id:number; phone:string; name:string; email:string|null; orderCount:number; totalSpent:number; lastOrderAt:string|null; daysSinceLastOrder:number };

export const KCOLS = [
  { key:"pending",          label:"Novos",           color:"border-red-500",   headerBg:"bg-red-500/10",   dot:"bg-red-500",   pulse:true  },
  { key:"preparing",        label:"Em Preparo",       color:"border-amber-400", headerBg:"bg-amber-400/10", dot:"bg-amber-400", pulse:true  },
  { key:"out_for_delivery", label:"Saiu p/ Entrega",  color:"border-blue-400",  headerBg:"bg-blue-400/10",  dot:"bg-blue-400",  pulse:true  },
  { key:"completed",        label:"Concluídos",       color:"border-green-500", headerBg:"bg-green-500/10", dot:"bg-green-500", pulse:false },
];

export type RiderLocation = { riderId: number; riderName: string; lat: number; lng: number; ts: number };

export async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(e.message);
  }
  return res.json();
}
