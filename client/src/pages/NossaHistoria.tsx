import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Quote } from "lucide-react";
import { Link } from "wouter";
import type { StoreSettings } from "@shared/schema";
import heroFallback from "@assets/ogImage.jpg";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export default function NossaHistoria() {
  const { data: settings, isLoading } = useQuery<StoreSettings>({ queryKey: ["/api/settings"] });

  const storyTitle = settings?.storyTitle || "Nossa História";
  const storyText = settings?.storyText || "";
  const storyBgUrl = (settings as any)?.storyBgUrl;
  const storeName = settings?.storeName || "Estação da Esfiha";

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* ── Header simples ─────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-black border-b-4 border-[#D21033]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            data-testid="link-back-home"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Voltar</span>
          </Link>

          <div className="ml-auto">
            <p className="text-white/40 text-xs font-black uppercase tracking-widest">{storeName}</p>
          </div>
        </div>
      </header>

      {/* ── Story Hero ─────────────────────────────── */}
      <section className="relative flex-1 w-full min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
        {/* Background image or solid */}
        {storyBgUrl ? (
          <img
            src={storyBgUrl}
            alt="Nossa História"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img
            src={heroFallback}
            alt="Nossa História"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/75" />

        {/* Red accent strip on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#D21033]" />

        {/* Decorative circles */}
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-[#D21033]/8 pointer-events-none" />
        <div className="absolute -right-16 -bottom-24 w-64 h-64 rounded-full bg-[#D21033]/5 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-8 sm:px-16 py-20">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-white/10 w-32 rounded" />
              <div className="h-12 bg-white/10 w-64 rounded" />
              <div className="h-1 bg-white/10 w-16 rounded" />
              <div className="space-y-2 mt-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-white/10 rounded" style={{ width: `${75 + Math.random() * 25}%` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4 mb-6">
                <Quote className="w-10 h-10 sm:w-14 sm:h-14 text-[#D21033] shrink-0 mt-1" />
                <div>
                  <p className="text-[#D21033] text-xs font-black uppercase tracking-[0.4em] mb-3">
                    Conheça a gente
                  </p>
                  <h1 className="text-white font-black text-4xl sm:text-6xl uppercase leading-tight tracking-tight">
                    {storyTitle}
                  </h1>
                </div>
              </div>

              <div className="w-16 h-1 bg-[#D21033] mb-10 ml-14 sm:ml-18" />

              <div className="ml-14 sm:ml-18">
                {storyText ? (
                  <p className="text-white/85 text-base sm:text-xl leading-relaxed font-medium whitespace-pre-line max-w-2xl">
                    {storyText}
                  </p>
                ) : (
                  <p className="text-white/40 text-base italic">
                    Nenhuma história cadastrada ainda. Acesse o painel admin para adicionar.
                  </p>
                )}
              </div>

              <div className="mt-14 ml-14 sm:ml-18">
                <Link
                  href="/"
                  data-testid="link-back-bottom"
                  className="inline-flex items-center gap-2 bg-[#D21033] hover:bg-[#b01029] text-white px-6 py-3 font-black uppercase tracking-wide text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Ver cardápio
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      <WhatsAppButton />
    </div>
  );
}
