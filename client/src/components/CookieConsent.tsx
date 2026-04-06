import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "estacao_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem(STORAGE_KEY, type);
    setHiding(true);
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 transition-transform duration-400",
      hiding ? "translate-y-full" : "translate-y-0"
    )}>
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-0.5">Usamos cookies</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego.
              Ao continuar, você concorda com nossa{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => accept("essential")}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Só essenciais
          </button>
          <button
            onClick={() => accept("all")}
            className="flex-1 md:flex-none px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Aceitar todos
          </button>
          <button onClick={() => accept("essential")} className="text-gray-600 hover:text-gray-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
