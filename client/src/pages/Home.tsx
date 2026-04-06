import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { FloatingCartBar } from "@/components/cart/FloatingCartBar";
import { useQuery } from "@tanstack/react-query";
import { Clock, Bike, ChevronRight, ChevronLeft, Star, MapPin, Flame, X, Plus } from "lucide-react";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { cn, formatCurrency } from "@/lib/utils";
import type { StoreSettings, Product } from "@shared/schema";
import heroFallback from "@assets/ogImage.jpg";
import { useCart } from "@/lib/cart";

const SALGADO_KEYWORDS = ["PROMO", "ABERTAS", "FECHADAS", "SALGADO", "PIZZA", "PASTEL", "BEIRUTE", "LANCHE", "PORÇÃO", "PORCAO"];
const DOCE_KEYWORDS = ["DOCE", "SOBREMESA"];
const DRINK_KEYWORDS = ["REFRIGERANTE", "SUCO", "BEBIDA"];

function isSalgadoCategory(name: string) {
  const upper = name.toUpperCase();
  return SALGADO_KEYWORDS.some(k => upper.includes(k));
}

function UpsellModal({ suggestions, onClose }: { suggestions: Product[]; onClose: () => void }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState<number | null>(null);

  const handleAdd = (product: Product) => {
    addItem(product, 1, "");
    setAdded(product.id);
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#D21033] to-red-600 px-5 py-4 flex items-start justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Que tal acrescentar?</p>
            <h2 className="text-white font-black text-lg leading-tight mt-0.5">Complete seu pedido 🍬</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 mt-0.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2">
          {suggestions.map(product => (
            <div key={product.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {product.imageUrl
                  ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-gray-900 uppercase leading-tight truncate">{product.name}</p>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{product.description}</p>
                <p className="font-black text-[#D21033] text-sm mt-1">{formatCurrency(product.price)}</p>
              </div>
              <button
                onClick={() => handleAdd(product)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all font-black",
                  added === product.id
                    ? "bg-green-500 text-white scale-90"
                    : "bg-[#D21033] text-white hover:bg-[#b01029]"
                )}
              >
                {added === product.id ? "✓" : <Plus className="w-4 h-4" />}
              </button>
            </div>
          ))}
          <button onClick={onClose} className="w-full py-2.5 text-gray-400 text-sm hover:text-gray-600 transition-colors">
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}

const ADMIN_TRIGGER = "ADMesfiha";

export default function Home() {
  const [, navigate] = useLocation();
  const { data: products, isLoading } = useQuery({ queryKey: ["/api/products"] });
  const { data: categories } = useQuery({ queryKey: ["/api/categories"] });
  const { data: settings } = useQuery<StoreSettings>({ queryKey: ["/api/settings"] });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [upsellSuggestions, setUpsellSuggestions] = useState<Product[]>([]);
  const upsellShownFor = useRef<Set<number>>(new Set());

  const handleProductAdded = useCallback((product: Product, catName: string) => {
    if (!isSalgadoCategory(catName)) return;
    if (upsellShownFor.current.has(product.id)) return;
    const allProducts = (products as Product[] | undefined) ?? [];
    const allCats = (categories as any[] | undefined) ?? [];

    const doceCatIds = allCats.filter((c: any) => DOCE_KEYWORDS.some(k => c.name.toUpperCase().includes(k))).map((c: any) => c.id);
    const drinkCatIds = allCats.filter((c: any) => DRINK_KEYWORDS.some(k => c.name.toUpperCase().includes(k))).map((c: any) => c.id);

    const doceProduct = allProducts.find(p => doceCatIds.includes(p.categoryId) && p.active);
    const drinkProduct = allProducts.find(p => drinkCatIds.includes(p.categoryId) && p.active && p.imageUrl);

    const suggestions = [doceProduct, drinkProduct].filter(Boolean) as Product[];
    if (suggestions.length === 0) return;

    upsellShownFor.current.add(product.id);
    setUpsellSuggestions(suggestions);
  }, [products, categories]);

  useEffect(() => {
    if (searchQuery === ADMIN_TRIGGER) {
      setSearchQuery("");
      navigate("/painel/login");
    }
  }, [searchQuery]);

  const categoryRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const navRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoriesWithProducts = useMemo(() => {
    if (!products || !categories) return [];
    return (categories as any[])
      .map((cat: any) => ({
        ...cat,
        products: (products as any[]).filter((p: any) => {
          const matchesCat = p.categoryId === cat.id;
          const matchesSearch = searchQuery === "" ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCat && matchesSearch;
        }),
      }))
      .filter((cat: any) => cat.products.length > 0);
  }, [products, categories, searchQuery]);

  const scrollToCategory = (categoryId: number) => {
    setActiveCategory(categoryId);
    const el = categoryRefs.current[categoryId];
    if (el) {
      isProgrammaticScroll.current = true;
      if (programmaticScrollTimer.current) clearTimeout(programmaticScrollTimer.current);
      programmaticScrollTimer.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 1000);
      const OFFSET = 124;
      const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const scrollRow = (catId: number, dir: "left" | "right") => {
    const row = rowRefs.current[catId];
    if (row) row.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      const offset = 124;
      for (const cat of categoriesWithProducts) {
        const el = categoryRefs.current[cat.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveCategory(cat.id);
            const navEl = navRef.current;
            if (navEl) {
              const btn = navEl.querySelector(`[data-cat-id="${cat.id}"]`) as HTMLElement;
              if (btn) {
                const navRect = navEl.getBoundingClientRect();
                const btnRect = btn.getBoundingClientRect();
                if (btnRect.left < navRect.left || btnRect.right > navRect.right) {
                  btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                }
              }
            }
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoriesWithProducts]);

  const isOpen = settings?.isOpen ?? true;
  const estimatedMin = settings?.estimatedTimeMin ?? 10;
  const estimatedMax = settings?.estimatedTimeMax ?? 60;
  const deliveryFee = settings?.deliveryFee ?? "5.00";
  const heroImage = settings?.heroImageUrl || heroFallback;
  const hasBanner = settings?.bannerImageUrl;
  const ratingScore = (settings as any)?.ratingScore;
  const ratingText = (settings as any)?.ratingText;
  const address = (settings as any)?.address;

  return (
    <div className="min-h-screen bg-[#F6F6F6] pb-28">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative w-full h-[360px] sm:h-[460px] overflow-hidden bg-black">
        <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 max-w-6xl mx-auto">
          <div className="inline-block bg-[#D21033] px-3 py-1 mb-3 w-fit">
            <span className="text-white text-xs font-black uppercase tracking-widest">
              {isOpen ? "🟢 Aberto agora" : "🔴 Fechado"}
            </span>
          </div>
          <h1 className="text-white font-black text-4xl sm:text-6xl uppercase leading-none tracking-tight">
            {settings?.storeName || "Estação da Esfiha"}
          </h1>
          {settings?.storeDescription && (
            <p className="text-white/70 text-sm sm:text-base mt-2 max-w-md font-medium">
              {settings.storeDescription}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-[#D21033]" />
              {estimatedMin}–{estimatedMax} min
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
              <Bike className="w-3.5 h-3.5 text-[#D21033]" />
              {Number(deliveryFee) === 0 ? "Entrega grátis" : `Taxa R$ ${Number(deliveryFee).toFixed(2).replace(".", ",")}`}
            </div>
            {ratingScore && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 text-xs font-bold tracking-wide">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                {ratingScore}{ratingText ? ` · ${ratingText}` : ""}
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 text-xs font-medium tracking-wide max-w-xs">
                <MapPin className="w-3.5 h-3.5 text-[#D21033] shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Banner clicável ──────────────────────────── */}
      {hasBanner && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          {settings?.bannerLink ? (
            <a href={settings.bannerLink} target="_blank" rel="noopener noreferrer" data-testid="link-banner">
              <div className="relative overflow-hidden group border-l-4 border-[#D21033]">
                <img src={settings.bannerImageUrl!} alt={settings?.bannerTitle || "Promoção"} className="w-full h-40 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
                {settings?.bannerTitle && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 flex items-center justify-between">
                    <span className="text-white font-black uppercase text-sm tracking-wide">{settings.bannerTitle}</span>
                    <ChevronRight className="text-[#D21033] w-5 h-5" />
                  </div>
                )}
              </div>
            </a>
          ) : (
            <div className="relative overflow-hidden border-l-4 border-[#D21033]">
              <img src={settings?.bannerImageUrl!} alt={settings?.bannerTitle || "Banner"} className="w-full h-40 sm:h-56 object-cover" />
              {settings?.bannerTitle && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
                  <span className="text-white font-black uppercase text-sm tracking-wide">{settings.bannerTitle}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Category Nav ─────────────────────────────── */}
      {categoriesWithProducts.length > 0 && (
        <div className="sticky top-16 z-40 bg-black border-b border-white/10">
          <div ref={navRef} className="max-w-6xl mx-auto flex gap-0 overflow-x-auto no-scrollbar">
            {categoriesWithProducts.map((cat: any) => (
              <button
                key={cat.id}
                data-cat-id={cat.id}
                data-testid={`button-category-${cat.id}`}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "shrink-0 px-4 py-3.5 text-xs font-black uppercase tracking-wide transition-all border-b-2 whitespace-nowrap",
                  activeCategory === cat.id || (activeCategory === null && categoriesWithProducts[0]?.id === cat.id)
                    ? "text-white border-[#D21033]"
                    : "text-white/50 border-transparent hover:text-white/80 hover:border-white/20"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Products ─────────────────────────────────── */}
      <main className="mt-8 space-y-10 pb-4">
        {isLoading ? (
          <div className="px-4 max-w-6xl mx-auto flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white animate-pulse h-52 w-40 shrink-0" />
            ))}
          </div>
        ) : categoriesWithProducts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-2xl font-black text-gray-800 uppercase">Nenhum resultado</p>
            <p className="text-gray-500 mt-2 text-sm">Tente buscar por outro termo</p>
          </div>
        ) : (
          categoriesWithProducts.map((cat: any) => (
            <div
              key={cat.id}
              ref={el => { categoryRefs.current[cat.id] = el; }}
              data-testid={`section-category-${cat.id}`}
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-4 max-w-6xl mx-auto mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-7 shrink-0 ${cat.name.toUpperCase().includes("PROMO") ? "bg-gradient-to-b from-[#D21033] to-orange-500" : "bg-[#D21033]"}`} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      {cat.name.toUpperCase().includes("PROMO") && (
                        <Flame className="w-4 h-4 text-[#D21033]" />
                      )}
                      <h2 className="font-black text-lg uppercase tracking-tight text-gray-900 leading-none">{cat.name}</h2>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">{cat.products.length} {cat.products.length === 1 ? "item" : "itens"}</p>
                  </div>
                </div>
                {/* Scroll arrows (desktop) */}
                <div className="hidden sm:flex gap-1">
                  <button
                    onClick={() => scrollRow(cat.id, "left")}
                    className="w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-[#D21033] transition-colors"
                    aria-label="Rolar esquerda"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollRow(cat.id, "right")}
                    className="w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-[#D21033] transition-colors"
                    aria-label="Rolar direita"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal scroll row */}
              <div
                ref={el => { rowRefs.current[cat.id] = el; }}
                className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 scroll-smooth"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {/* Left padding sentinel */}
                <div className="shrink-0 w-0 max-w-6xl mx-auto" />
                {cat.products.map((product: any) => (
                  <div
                    key={product.id}
                    className="shrink-0 w-[190px] sm:w-[220px]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <ProductCard
                      product={product}
                      isPromo={cat.name.toUpperCase().includes("PROMO")}
                      categoryName={cat.name}
                      onAdded={handleProductAdded}
                    />
                  </div>
                ))}
                {/* Right padding */}
                <div className="shrink-0 w-2" />
              </div>
            </div>
          ))
        )}
      </main>

      {upsellSuggestions.length > 0 && (
        <UpsellModal
          suggestions={upsellSuggestions}
          onClose={() => setUpsellSuggestions([])}
        />
      )}
      <FloatingCartBar />
      <WhatsAppButton />

      {/* ── Footer ── */}
      <footer className="mt-10 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-black text-xs">E</span>
                </div>
                <div>
                  <p className="font-black text-gray-900 leading-tight text-sm">Estação da</p>
                  <p className="font-black text-primary leading-tight text-sm">Esfiha</p>
                </div>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                As melhores esfihas da cidade, feitas com ingredientes frescos e muito carinho. Delivery rápido e saboroso para você.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-3">Navegação</p>
              <ul className="space-y-2">
                {[
                  { label: "Cardápio", href: "/" },
                  { label: "Nossa História", href: "/nossa-historia" },
                  { label: "Entrar / Criar conta", href: "/login" },
                  { label: "Painel Administrativo", href: "/painel" },
                ].map(l => (
                  <li key={l.href}>
                    <a href={l.href} className="text-gray-500 hover:text-primary text-xs transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-3">Informações</p>
              <ul className="space-y-2">
                {[
                  { label: "Termos de Uso", href: "#" },
                  { label: "Política de Privacidade", href: "#" },
                  { label: "Política de Cookies", href: "#" },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-gray-500 hover:text-primary text-xs transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-gray-400 text-[11px]">
              © {new Date().getFullYear()} Estação da Esfiha. Todos os direitos reservados.
            </p>
            <a
              href="https://rickflow.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Desenvolvido por
              <span className="font-bold text-gray-600">RickFlow</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
