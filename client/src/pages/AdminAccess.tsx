import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";

export default function AdminAccess() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"checking" | "error">("checking");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("/api/admin/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token }),
          credentials: "include",
        });
        if (res.ok) {
          setLocation("/painel");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    if (params.token) verify();
  }, [params.token]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#1C1917] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1917] flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-white font-bold text-xl mb-2">Link inválido</h1>
        <p className="text-white/50 text-sm">Este link de acesso não é válido.</p>
      </div>
    </div>
  );
}
