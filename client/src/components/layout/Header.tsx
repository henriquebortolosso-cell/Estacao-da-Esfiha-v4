import { useState, useRef, useEffect } from "react";
import { ShoppingBag, Search, X, MapPin, Clock, CreditCard, Banknote, QrCode, Menu, MessageCircle, Download, BookOpen, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logoUrl from "/logo.webp";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
}

const DEFAULT_SCHEDULE = [
  { day: "Segunda-feira", hours: "11:00 às 23:59" },
  { day: "Terça-feira", hours: "00:00 às 04:00" },
  { day: "Quarta-feira", hours: "11:00 às 23:59" },
  { day: "Quinta-feira", hours: "11:00 às 23:59" },
  { day: "Sexta-feira", hours: "11:00 às 23:59" },
  { day: "Sábado", hours: "11:02 às 23:58" },
  { day: "Domingo", hours: "11:00 às 23:59" },
];

const DEFAULT_PAYMENT = ["Dinheiro", "Cartão de Crédito", "Cartão de Débito"];

const PAYMENT_ICONS: Record<string, any> = {
  "Dinheiro": Banknote,
  "Cartão de Crédito": CreditCard,
  "Cartão de Débito": CreditCard,
  "Pix": QrCode,
};

type InfoTab = "sobre" | "horario" | "pagamentos";

export function Header({ searchQuery, onSearchChange, showSearch }: HeaderProps) {
  const { itemCount, total } = useCart();
  const [location, navigate] = useLocation();
  const isCheckout = location === "/checkout";
  const isSuccess = location.startsWith("/order/");

  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });

  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InfoTab>("sobre");
  const [menuOpen, setMenuOpen] = useState(false);
  const [appModalOpen, setAppModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const schedule: { day: string; hours: string }[] = (() => {
    try {
      return JSON.parse(settings?.weeklySchedule || "") || DEFAULT_SCHEDULE;
    } catch {
      return DEFAULT_SCHEDULE;
    }
  })();

  const paymentMethods: string[] = (() => {
    try {
      return JSON.parse(settings?.paymentMethods || "") || DEFAULT_PAYMENT;
    } catch {
      return DEFAULT_PAYMENT;
    }
  })();

  const isOpen = settings?.isOpen ?? true;
  const storeName = settings?.storeName || "Estação da Esfiha";
  const address = settings?.address || "Avenida dos Autonomistas, 6250, KM 18 - Osasco, SP";
  const openTime = settings?.openTime || "10:00";
  const closeTime = settings?.closeTime || "23:00";
  const whatsapp = settings?.whatsappNumber || "";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black border-b-4 border-[#D21033]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">

          {/* Logo → abre modal de informações */}
          <button
            onClick={() => { setInfoOpen(true); setActiveTab("sobre"); }}
            data-testid="button-logo-info"
            className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Informações da loja"
          >
            <img src={logoUrl} alt="Estação da Esfiha" className="h-9 w-9 rounded-lg object-cover" />
            <div className="hidden sm:block leading-none text-left">
              <p className="text-white font-black text-sm uppercase tracking-wide">Estação da</p>
              <p className="text-[#D21033] font-black text-sm uppercase tracking-wide">Esfiha</p>
            </div>
          </button>

          {/* Search */}
          {showSearch && onSearchChange && (
            <div className="flex-1 max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Buscar no cardápio..."
                data-testid="input-search"
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 pl-9 pr-9 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D21033]/60 focus:border-[#D21033]/60 transition-all"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Right: Cart + Hamburger */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {!isCheckout && !isSuccess && (
              <Link href="/checkout" data-testid="link-cart"
                className="flex items-center gap-2.5 bg-[#D21033] hover:bg-[#b01029] text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-[#D21033] text-[9px] font-black h-4 min-w-[16px] px-0.5 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">
                  {itemCount > 0 ? `R$ ${Number(total).toFixed(2).replace(".", ",")}` : "Carrinho"}
                </span>
              </Link>
            )}

            {/* Hamburger menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                data-testid="button-hamburger"
                className="flex items-center justify-center w-10 h-10 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-52 bg-gray-950 border border-white/10 shadow-2xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/nossa-historia"); }}
                    data-testid="menu-item-historia"
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm font-semibold text-left"
                  >
                    <BookOpen className="w-4 h-4 text-[#D21033] shrink-0" />
                    Nossa História
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/30" />
                  </button>
                  <div className="h-px bg-white/5" />
                  <a
                    href={whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, "")}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    data-testid="menu-item-atendimento"
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm font-semibold"
                  >
                    <MessageCircle className="w-4 h-4 text-[#D21033] shrink-0" />
                    Atendimento
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/30" />
                  </a>
                  <div className="h-px bg-white/5" />
                  <button
                    onClick={() => { setMenuOpen(false); setAppModalOpen(true); }}
                    data-testid="menu-item-app"
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-sm font-semibold text-left"
                  >
                    <Download className="w-4 h-4 text-[#D21033] shrink-0" />
                    Baixar App
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/30" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Modal "Sobre o estabelecimento" ─────────── */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          onClick={() => setInfoOpen(false)}
        >
          {/* Backdrop semi-transparente */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full sm:max-w-sm bg-gray-950/95 border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-black text-sm uppercase tracking-wide">Sobre o estabelecimento</h2>
              <button
                onClick={() => setInfoOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
                data-testid="button-close-info"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(["sobre", "horario", "pagamentos"] as InfoTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  data-testid={`tab-${tab}`}
                  className={cn(
                    "flex-1 py-3 text-xs font-black uppercase tracking-wide transition-all border-b-2",
                    activeTab === tab
                      ? "text-white border-[#D21033]"
                      : "text-white/40 border-transparent hover:text-white/70"
                  )}
                >
                  {tab === "sobre" ? "Sobre" : tab === "horario" ? "Horário" : "Pagamentos"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* ── Sobre ── */}
              {activeTab === "sobre" && (
                <div className="p-5 flex flex-col items-center gap-5">
                  <img src={logoUrl} alt={storeName} className="w-24 h-24 rounded-full object-cover border-4 border-[#D21033]" />
                  <div className="text-center">
                    <p className="text-white font-black text-lg uppercase tracking-tight">{storeName}</p>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2",
                      isOpen ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-green-400" : "bg-red-400")} />
                      {isOpen ? `Aberto até ${closeTime}` : "Fechado agora"}
                    </div>
                  </div>
                  <div className="w-full border-t border-white/10 pt-4 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#D21033] shrink-0 mt-0.5" />
                    <p className="text-white/70 text-sm leading-relaxed">{address}</p>
                  </div>
                </div>
              )}

              {/* ── Horário ── */}
              {activeTab === "horario" && (
                <div className="divide-y divide-white/5">
                  {schedule.map(({ day, hours }) => (
                    <div key={day} className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-white/70 text-sm font-medium">{day}</span>
                      <span className="text-white text-sm font-bold">{hours}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Pagamentos ── */}
              {activeTab === "pagamentos" && (
                <div className="divide-y divide-white/5">
                  {paymentMethods.map(method => {
                    const Icon = PAYMENT_ICONS[method] || CreditCard;
                    return (
                      <div key={method} className="flex items-center gap-3 px-5 py-4">
                        <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-white/70" />
                        </div>
                        <span className="text-white/80 text-sm font-medium">{method}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Ok button */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setInfoOpen(false)}
                data-testid="button-info-ok"
                className="w-full bg-black hover:bg-white/5 text-white font-black uppercase tracking-wide py-3 text-sm transition-colors border border-white/10"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal "Baixar App" ─────────────────────── */}
      {appModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setAppModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-xs bg-gray-950/95 border border-white/10 shadow-2xl p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-12 h-12 text-[#D21033] mx-auto mb-4" />
            <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2">Nosso App</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Em breve — nosso aplicativo está a caminho. Fique ligado!
            </p>
            <button
              onClick={() => setAppModalOpen(false)}
              data-testid="button-app-close"
              className="w-full bg-[#D21033] hover:bg-[#b01029] text-white font-black uppercase tracking-wide py-3 text-sm transition-colors"
            >
              Ok, entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
