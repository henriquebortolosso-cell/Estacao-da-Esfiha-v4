import { useState } from "react";
import { Plus, Minus, X, UtensilsCrossed } from "lucide-react";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart";

interface ProductCardProps {
  product: Product;
  isPromo?: boolean;
  categoryName?: string;
  onAdded?: (product: Product, categoryName: string) => void;
}

export function ProductCard({ product, isPromo, categoryName, onAdded }: ProductCardProps) {
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState("");

  const cartItem = items.find(i => i.product.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    addItem(product, 1, notes);
    setNotes("");
    setShowModal(false);
    if (onAdded && categoryName) {
      onAdded(product, categoryName);
    }
  };

  return (
    <>
      <div
        data-testid={`card-product-${product.id}`}
        onClick={() => setShowModal(true)}
        className="bg-white hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col group border border-gray-100"
        style={isPromo ? { borderBottom: "3px solid #D21033" } : undefined}
      >
        {/* Image */}
        <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gray-50">
              <UtensilsCrossed className="w-7 h-7 text-gray-300" />
            </div>
          )}

          {/* Promo badge */}
          {isPromo && (
            <div className="absolute top-2 right-2 bg-[#D21033] text-white text-[10px] font-black px-2 py-0.5 flex items-center gap-0.5 shadow-md">
              🔥 PROMO
            </div>
          )}

          {quantity > 0 && (
            <div className="absolute top-0 left-0 bg-[#D21033] text-white text-xs font-black px-2 py-0.5">
              {quantity}×
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col p-3 gap-1">
          <h3 className="font-black text-sm text-gray-900 uppercase leading-snug">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="font-black text-sm text-gray-900">{formatCurrency(product.price)}</span>

            {quantity === 0 ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                className="bg-[#D21033] text-white p-1.5 flex items-center justify-center hover:bg-[#b01029] transition-colors shrink-0"
                data-testid={`button-add-${product.id}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <div
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 border-2 border-[#D21033]"
              >
                <button
                  onClick={() => quantity === 1 ? removeItem(product.id) : updateQuantity(product.id, quantity - 1)}
                  className="text-[#D21033] px-1.5 py-0.5"
                  data-testid={`button-decrease-${product.id}`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[#D21033] text-xs font-black w-4 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="text-[#D21033] px-1.5 py-0.5"
                  data-testid={`button-increase-${product.id}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => { setShowModal(false); setNotes(""); }}
        >
          <div
            className="bg-white w-full sm:max-w-md overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-72 bg-gray-100">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {isPromo && (
                <div className="absolute top-4 right-4 bg-[#D21033] text-white text-xs font-black px-3 py-1">
                  🔥 PROMOÇÃO
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-12">
                <h3 className="text-white font-black text-2xl uppercase leading-tight">{product.name}</h3>
              </div>
              <button
                onClick={() => { setShowModal(false); setNotes(""); }}
                className="absolute top-3 right-3 bg-black text-white p-2 hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              )}

              <div>
                <label className="text-xs font-black text-gray-900 uppercase tracking-wide block mb-2">Observação</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: sem cebola, bem passado..."
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D21033]/20 focus:border-[#D21033] transition-all"
                />
              </div>

              <button
                onClick={handleAdd}
                data-testid={`button-confirm-add-${product.id}`}
                className="w-full py-4 bg-[#D21033] hover:bg-[#b01029] text-white font-black uppercase tracking-wide flex items-center justify-between px-5 transition-colors"
              >
                <span className="text-sm">Adicionar</span>
                <span className="text-base">{formatCurrency(product.price)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
