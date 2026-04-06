import { useRoute, Link } from "wouter";
import { CheckCircle2, MapPin, Receipt, Clock, ChevronRight, Phone, Bike } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useOrder } from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/utils";

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  dinheiro: "Dinheiro",
};

export default function OrderSuccess() {
  const [, params] = useRoute("/order/:id");
  const orderId = params ? parseInt(params.id, 10) : null;
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Pedido não encontrado</h2>
          <Link href="/" className="text-primary hover:underline font-medium text-sm">Voltar ao Início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />

      <main className="max-w-lg mx-auto px-4 pt-8">

        {/* Sucesso */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-1">Pedido Confirmado!</h1>
          <p className="text-muted-foreground text-sm">
            Olá, <strong className="text-foreground">{order.customerName.split(' ')[0]}</strong>! Seu pedido <strong className="text-foreground">#{order.id}</strong> foi recebido.
          </p>
        </div>

        <div className="space-y-3">

          {/* Status */}
          <div className="bg-white rounded-xl p-4 border border-border flex items-start gap-3">
            <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-0.5">Preparando seu pedido</h3>
              <p className="text-sm text-muted-foreground">
                Seu pedido está sendo preparado com carinho. Previsão: <strong>40–50 min</strong>
              </p>
            </div>
          </div>

          {/* Entrega */}
          <div className="bg-white rounded-xl p-4 border border-border flex items-start gap-3">
            <div className="bg-muted p-2.5 rounded-full shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-0.5">Endereço de Entrega</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{order.deliveryAddress}</p>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white rounded-xl p-4 border border-border flex items-start gap-3">
            <div className="bg-muted p-2.5 rounded-full shrink-0">
              <Phone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-0.5">Contato</h3>
              <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
            </div>
          </div>

          {/* Pagamento + Total */}
          <div className="bg-white rounded-xl p-4 border border-border flex items-start gap-3">
            <div className="bg-muted p-2.5 rounded-full shrink-0">
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-foreground mb-0.5">Pagamento na Entrega</h3>
                <p className="text-sm text-muted-foreground">
                  {paymentLabels[order.paymentMethod] || order.paymentMethod}
                  {order.changeFor && ` · Troco para ${formatCurrency(order.changeFor)}`}
                </p>
              </div>
              <div className="text-right">
                <span className="block text-xs text-muted-foreground">Total</span>
                <span className="font-black text-lg text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={`/acompanhar/${order.id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg text-sm w-full max-w-xs"
          >
            <Bike className="w-4 h-4" />
            Rastrear meu pedido
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-bold rounded-lg text-sm w-full max-w-xs hover:bg-muted transition-colors"
            data-testid="link-new-order"
          >
            Fazer novo pedido
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </main>
    </div>
  );
}
