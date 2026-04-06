import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";

export function FloatingCartBar() {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <Link
          href="/checkout"
          data-testid="link-floating-cart"
          className="w-full bg-black text-white py-4 px-5 flex items-center justify-between shadow-2xl hover:bg-gray-900 transition-colors border-t-4 border-[#D21033]"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute -top-2 -right-2 bg-[#D21033] text-white text-[9px] font-black h-4 min-w-[16px] px-0.5 flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="text-white/60 text-xs leading-none mb-0.5 uppercase tracking-wide font-bold">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </p>
              <p className="text-white font-black text-sm leading-none">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#D21033] px-4 py-2">
            <span className="text-white font-black uppercase text-xs tracking-wide">Ver carrinho</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </Link>
      </div>
    </div>
  );
}
