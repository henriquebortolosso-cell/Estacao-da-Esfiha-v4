import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Plus, Minus, MapPin, CreditCard, User, FileText, CheckCircle2, ShoppingBag, Star, Gift, Trophy, MessageCircle, Tag, X } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { useCart } from "@/lib/cart";
import { formatCurrency, parseDecimal, cn } from "@/lib/utils";
import { useCreateOrder } from "@/hooks/use-orders";
import type { StoreSettings } from "@shared/schema";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  street: z.string().min(2, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  zip: z.string().min(8, "CEP inválido"),
  paymentMethod: z.enum(["dinheiro", "cartao_credito", "cartao_debito", "pix"]),
  changeFor: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface LoyaltyStatus {
  found: boolean;
  name?: string;
  paidDeliveryOrders: number;
  freeDeliveriesUsed: number;
  freeDeliveriesAvailable: number;
  ordersUntilFree: number;
  progress: number;
}

const paymentIcons: Record<string, string> = {
  pix: "💠", cartao_credito: "💳", cartao_debito: "💳", dinheiro: "💵",
};
const paymentLabels: Record<string, string> = {
  pix: "Pix", cartao_credito: "Cartão de Crédito", cartao_debito: "Cartão de Débito", dinheiro: "Dinheiro",
};

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const createOrder = useCreateOrder();

  const { data: settings } = useQuery<StoreSettings>({ queryKey: ["/api/settings"] });
  const deliveryFeeFromSettings = parseFloat(String(settings?.deliveryFee ?? "5.00"));

  const [loyaltyData, setLoyaltyData] = useState<LoyaltyStatus | null>(null);
  const [usingFreeDelivery, setUsingFreeDelivery] = useState(false);
  const loyaltyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isWhatsappPending, setIsWhatsappPending] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponPending, setCouponPending] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "pix" }
  });

  const selectedPayment = watch("paymentMethod");
  const phoneValue = watch("customerPhone");

  // Lookup loyalty whenever phone changes (debounced)
  useEffect(() => {
    if (loyaltyTimerRef.current) clearTimeout(loyaltyTimerRef.current);
    const digits = (phoneValue || "").replace(/\D/g, "");
    if (digits.length < 10) {
      setLoyaltyData(null);
      setUsingFreeDelivery(false);
      return;
    }
    loyaltyTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/loyalty/${digits}`, { credentials: "include" });
        if (res.ok) {
          const data: LoyaltyStatus = await res.json();
          setLoyaltyData(data);
          if (data.freeDeliveriesAvailable <= 0) setUsingFreeDelivery(false);
        }
      } catch {
        setLoyaltyData(null);
      }
    }, 600);
    return () => { if (loyaltyTimerRef.current) clearTimeout(loyaltyTimerRef.current); };
  }, [phoneValue]);

  // Effective delivery fee
  const effectiveDeliveryFee = usingFreeDelivery ? 0 : deliveryFeeFromSettings;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = subtotal > 0 ? Math.max(0, subtotal - discount + effectiveDeliveryFee) : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponPending(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.message || "Cupom inválido");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.discountAmount,
          type: data.coupon.type,
          value: parseFloat(data.coupon.value),
        });
        setCouponError("");
      }
    } catch {
      setCouponError("Erro ao validar cupom");
    } finally {
      setCouponPending(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F6F6]">
        <Header />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-black flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase text-gray-900 mb-2">Carrinho vazio</h2>
          <p className="text-gray-500 mb-8">Volte ao cardápio e adicione algumas delícias!</p>
          <button
            onClick={() => setLocation("/")}
            className="px-8 py-3 bg-[#D21033] text-white font-black uppercase tracking-wide"
            data-testid="button-go-menu"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    );
  }

  const buildOrderPayload = (data: CheckoutFormData) => {
    const fullAddress = `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''} - ${data.neighborhood}, ${data.city} - ${data.state}, CEP: ${data.zip}`;
    return {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryAddress: fullAddress,
      paymentMethod: data.paymentMethod,
      changeFor: data.paymentMethod === 'dinheiro' && data.changeFor ? parseDecimal(data.changeFor.replace(',', '.')) : null,
      total: parseDecimal(String(total)),
      useFreeDelivery: usingFreeDelivery,
      couponCode: appliedCoupon?.code || null,
      discountAmount: appliedCoupon?.discountAmount ?? null,
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: typeof item.product.price === 'string' ? item.product.price : parseDecimal(item.product.price),
        notes: item.notes || null
      }))
    };
  };

  const onSubmit = (data: CheckoutFormData) => {
    createOrder.mutate(buildOrderPayload(data), {
      onSuccess: (result) => {
        clearCart();
        setLocation(`/order/${result.id}`);
      }
    });
  };

  const onSubmitWhatsapp = async (data: CheckoutFormData) => {
    const storePhone = settings?.whatsappNumber;
    const fullAddress = `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''} - ${data.neighborhood}, ${data.city} - ${data.state}, CEP: ${data.zip}`;

    setIsWhatsappPending(true);
    try {
      // Record the WhatsApp order in DB
      const itemsJson = JSON.stringify(items.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        unitPrice: parseFloat(String(i.product.price)),
        notes: i.notes || null,
      })));

      await fetch("/api/whatsapp-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.customerName,
          customerPhone: data.customerPhone.replace(/\D/g, ""),
          deliveryAddress: fullAddress,
          itemsJson,
          paymentMethod: data.paymentMethod,
          total: String(total),
          status: "pendente",
        }),
      });
    } catch {
      // Non-critical — continue to WhatsApp even if recording fails
    }

    // Format WhatsApp message
    const lines: string[] = [];
    lines.push("🍕 *ESTAÇÃO DA ESFIHA*");
    lines.push("*Novo Pedido* 🛒");
    lines.push("");
    lines.push("📦 *Itens:*");
    items.forEach(item => {
      const price = parseFloat(String(item.product.price));
      lines.push(`• ${item.quantity}× ${item.product.name} - ${formatCurrency(price * item.quantity)}`);
      if (item.notes) lines.push(`  ↳ ${item.notes}`);
    });
    lines.push("");
    lines.push("📍 *Endereço de entrega:*");
    lines.push(fullAddress);
    lines.push("");
    lines.push(`💳 *Pagamento:* ${paymentLabels[data.paymentMethod]}`);
    if (data.paymentMethod === "dinheiro" && data.changeFor) lines.push(`💵 Troco para: R$ ${data.changeFor}`);
    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━");
    lines.push(`💰 Subtotal: ${formatCurrency(subtotal)}`);
    if (appliedCoupon) lines.push(`🎟 Cupom (${appliedCoupon.code}): -${formatCurrency(appliedCoupon.discountAmount)}`);
    lines.push(`🛵 Entrega: ${usingFreeDelivery ? "GRÁTIS 🎉" : formatCurrency(effectiveDeliveryFee)}`);
    lines.push(`✅ *Total: ${formatCurrency(total)}*`);
    lines.push("━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(`👤 *Cliente:* ${data.customerName}`);
    lines.push(`📱 ${data.customerPhone}`);

    const message = encodeURIComponent(lines.join("\n"));
    const waNumber = storePhone ? `55${storePhone.replace(/\D/g, "")}` : "";
    const waUrl = `https://wa.me/${waNumber}?text=${message}`;

    setIsWhatsappPending(false);
    clearCart();
    window.open(waUrl, "_blank");
  };

  const inputClass = (hasError?: boolean) => cn(
    "w-full px-3 py-2.5 bg-white border text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D21033]/20 focus:border-[#D21033] transition-all",
    hasError ? "border-red-400 focus:border-red-400" : "border-gray-200"
  );

  return (
    <div className="min-h-screen bg-[#F6F6F6] pb-12">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-1 h-7 bg-[#D21033] inline-block" />
          Finalizar Pedido
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Formulário - coluna esquerda */}
          <div className="lg:col-span-7 space-y-4">

            {/* Dados Pessoais */}
            <section className="bg-white p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <User className="w-4 h-4 text-[#D21033]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Dados Pessoais</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Nome Completo</label>
                  <input
                    {...register("customerName")}
                    className={inputClass(!!errors.customerName)}
                    placeholder="Ex: João da Silva"
                    data-testid="input-name"
                  />
                  {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">WhatsApp / Telefone</label>
                  <input
                    {...register("customerPhone")}
                    type="tel"
                    inputMode="numeric"
                    className={inputClass(!!errors.customerPhone)}
                    placeholder="(11) 98765-4321"
                    data-testid="input-phone"
                  />
                  {errors.customerPhone && <p className="text-xs text-red-500">{errors.customerPhone.message}</p>}
                </div>
              </div>
            </section>

            {/* Loyalty Card */}
            {loyaltyData && (
              <section
                data-testid="section-loyalty"
                className={cn(
                  "p-5 border-l-4 transition-all",
                  loyaltyData.freeDeliveriesAvailable > 0
                    ? "bg-green-50 border-green-500"
                    : "bg-gray-900 border-[#D21033]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 flex items-center justify-center shrink-0",
                      loyaltyData.freeDeliveriesAvailable > 0 ? "bg-green-500" : "bg-[#D21033]"
                    )}>
                      {loyaltyData.freeDeliveriesAvailable > 0
                        ? <Gift className="w-5 h-5 text-white" />
                        : <Trophy className="w-5 h-5 text-white" />
                      }
                    </div>
                    <div>
                      <p className={cn("text-xs font-black uppercase tracking-wide",
                        loyaltyData.freeDeliveriesAvailable > 0 ? "text-green-800" : "text-white"
                      )}>
                        Programa de Fidelidade
                      </p>
                      {loyaltyData.freeDeliveriesAvailable > 0 ? (
                        <p className="text-green-700 font-bold text-sm">
                          🎉 Você ganhou frete grátis!
                        </p>
                      ) : (
                        <p className="text-gray-300 text-sm font-medium">
                          {loyaltyData.ordersUntilFree === 1
                            ? "Mais 1 pedido para frete grátis!"
                            : `${loyaltyData.ordersUntilFree} pedidos para o próximo frete grátis`}
                        </p>
                      )}
                    </div>
                  </div>

                  {loyaltyData.freeDeliveriesAvailable > 0 && (
                    <button
                      type="button"
                      onClick={() => setUsingFreeDelivery(!usingFreeDelivery)}
                      data-testid="button-use-free-delivery"
                      className={cn(
                        "text-xs font-black uppercase tracking-wide px-3 py-2 shrink-0 transition-all",
                        usingFreeDelivery
                          ? "bg-green-600 text-white"
                          : "bg-white border-2 border-green-500 text-green-700 hover:bg-green-50"
                      )}
                    >
                      {usingFreeDelivery ? "✓ Aplicado" : "Usar"}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {loyaltyData.freeDeliveriesAvailable === 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{loyaltyData.progress} pedidos pagos</span>
                      <span>10 para frete grátis</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2">
                      <div
                        className="h-2 bg-[#D21033] transition-all"
                        style={{ width: `${(loyaltyData.progress / 10) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-1",
                            i < loyaltyData.progress ? "bg-[#D21033]" : "bg-gray-700"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Endereço */}
            <section className="bg-white p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-[#D21033]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Endereço de Entrega</h2>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-700">Rua/Avenida</label>
                    <input {...register("street")} className={inputClass(!!errors.street)} placeholder="Ex: Rua das Flores" data-testid="input-street" />
                    {errors.street && <p className="text-xs text-red-500">{errors.street.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Número</label>
                    <input {...register("number")} className={inputClass(!!errors.number)} placeholder="123" data-testid="input-number" />
                    {errors.number && <p className="text-xs text-red-500">{errors.number.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Complemento <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input {...register("complement")} className={inputClass()} placeholder="Apto, Bloco, etc." data-testid="input-complement" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Bairro</label>
                    <input {...register("neighborhood")} className={inputClass(!!errors.neighborhood)} placeholder="Ex: Centro" data-testid="input-neighborhood" />
                    {errors.neighborhood && <p className="text-xs text-red-500">{errors.neighborhood.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">CEP</label>
                    <input {...register("zip")} type="text" inputMode="numeric" className={inputClass(!!errors.zip)} placeholder="12345-678" data-testid="input-zip" />
                    {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-700">Cidade</label>
                    <input {...register("city")} className={inputClass(!!errors.city)} placeholder="Ex: São Paulo" data-testid="input-city" />
                    {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">UF</label>
                    <input {...register("state")} placeholder="SP" maxLength={2} className={cn(inputClass(!!errors.state), "uppercase")} data-testid="input-state" />
                    {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Pagamento */}
            <section className="bg-white p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <CreditCard className="w-4 h-4 text-[#D21033]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Pagamento <span className="text-gray-400 font-normal">(na entrega)</span></h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["pix", "cartao_credito", "cartao_debito", "dinheiro"] as const).map((method) => (
                  <label
                    key={method}
                    className={cn(
                      "flex items-center gap-2 p-3 border-2 cursor-pointer transition-all text-sm font-bold",
                      selectedPayment === method
                        ? "border-[#D21033] bg-[#D21033]/5 text-[#D21033]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                    data-testid={`label-payment-${method}`}
                  >
                    <input type="radio" value={method} {...register("paymentMethod")} className="sr-only" />
                    <span>{paymentIcons[method]}</span>
                    <span>{paymentLabels[method]}</span>
                  </label>
                ))}
              </div>

              {selectedPayment === 'pix' && settings?.pixKey && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 space-y-2">
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Chave PIX para pagamento</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-mono text-gray-800 bg-white border border-blue-200 px-3 py-1.5 rounded select-all" data-testid="text-pix-key">
                      {settings.pixKey}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.pixKey!);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors"
                      data-testid="button-copy-pix"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-[10px] text-blue-600">Realize o pagamento e informe o comprovante para o entregador.</p>
                </div>
              )}

              {selectedPayment === 'dinheiro' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 space-y-1.5">
                  <label className="text-sm font-bold text-gray-900">Troco para quanto? <span className="text-gray-500 font-normal">(opcional)</span></label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-bold">R$</span>
                    <input {...register("changeFor")} placeholder="50,00" inputMode="decimal" className={inputClass(!!errors.changeFor)} data-testid="input-change-for" />
                  </div>
                  {errors.changeFor && <p className="text-xs text-red-500">{errors.changeFor.message}</p>}
                </div>
              )}
            </section>
          </div>

          {/* Resumo - coluna direita */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-100 sticky top-24 overflow-hidden">

              <div className="px-4 py-3 border-b border-gray-100 bg-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D21033]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Resumo do Pedido</h2>
              </div>

              {/* Itens */}
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {items.map((item) => {
                  const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
                  return (
                    <div key={item.product.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.product.name}</p>
                        {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
                        <p className="text-xs text-[#D21033] font-black mt-0.5">{formatCurrency(price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => item.quantity === 1 ? removeItem(item.product.id) : updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          data-testid={`button-decrease-checkout-${item.product.id}`}
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-sm font-black w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          data-testid={`button-increase-checkout-${item.product.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cupom de desconto */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5 text-[#D21033]" />
                  <span className="text-xs font-black uppercase tracking-wide text-gray-700">Cupom de desconto</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-green-700 uppercase tracking-wide">{appliedCoupon.code}</span>
                      <span className="text-xs text-green-600">-{formatCurrency(appliedCoupon.discountAmount)}</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-red-500 transition-colors" data-testid="button-remove-coupon">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="CÓDIGO DO CUPOM"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-xs uppercase font-bold tracking-wide focus:outline-none focus:border-[#D21033] transition-all placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                      data-testid="input-coupon"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponPending || !couponCode.trim()}
                      className="px-3 py-2 bg-black text-white text-xs font-black uppercase hover:bg-[#D21033] transition-colors disabled:opacity-50"
                      data-testid="button-apply-coupon"
                    >
                      {couponPending ? "..." : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
              </div>

              {/* Totais */}
              <div className="px-4 py-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 font-bold">
                    <span>🎟 Cupom ({appliedCoupon.code})</span>
                    <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className={usingFreeDelivery ? "text-green-600 font-bold" : "text-gray-500"}>
                    Taxa de Entrega {usingFreeDelivery && "🎉"}
                  </span>
                  <span className={usingFreeDelivery ? "text-green-600 font-black" : "text-gray-500"}>
                    {usingFreeDelivery ? "GRÁTIS" : formatCurrency(deliveryFeeFromSettings)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="font-black text-gray-900 uppercase text-sm">Total</span>
                  <span className="text-xl font-black text-[#D21033]">{formatCurrency(total)}</span>
                </div>

                {/* Info fidelidade */}
                {!loyaltyData && (phoneValue || "").replace(/\D/g, "").length < 10 && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-dashed border-gray-200 mt-1">
                    <Star className="w-3.5 h-3.5 text-[#D21033] shrink-0" />
                    <p className="text-xs text-gray-500">
                      <strong>Fidelidade:</strong> a cada 10 pedidos, frete grátis!
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createOrder.isPending || isWhatsappPending}
                  className="w-full mt-2 py-4 bg-[#D21033] hover:bg-[#b01029] text-white font-black uppercase tracking-wide flex justify-center items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  data-testid="button-confirm-order"
                >
                  {createOrder.isPending ? (
                    <span className="animate-pulse">Processando...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar Pedido
                    </>
                  )}
                </button>

                <div className="relative flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">ou</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit(onSubmitWhatsapp)}
                  disabled={createOrder.isPending || isWhatsappPending}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black uppercase tracking-wide flex justify-center items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  data-testid="button-whatsapp-order"
                >
                  {isWhatsappPending ? (
                    <span className="animate-pulse">Preparando...</span>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Pedir pelo WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}
