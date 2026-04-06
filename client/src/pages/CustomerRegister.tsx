import { useState } from "react";
import { useLocation } from "wouter";
import { ChefHat, Phone, Lock, Eye, EyeOff, User, ArrowLeft, Mail } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

async function apiPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ message: "Erro desconhecido" }));
  if (!res.ok) throw new Error(data.message);
  return data;
}

export default function CustomerRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const fmtPhone = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n;
    if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  };

  const register = useMutation({
    mutationFn: () => {
      if (password !== confirm) throw new Error("As senhas não conferem");
      if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
      return apiPost("/api/auth/register", { name: name.trim(), phone: phone.replace(/\D/g,""), email: email||undefined, password });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Conta criada!", description: "Bem-vindo à Estação da Esfiha!" });
      navigate("/");
    },
    onError: (e: Error) => toast({ title: "Erro ao criar conta", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />Voltar ao cardápio
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-gray-400 text-sm mt-1">Peça mais rápido e acompanhe seus pedidos</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Telefone (WhatsApp)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="tel" value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">E-mail <span className="text-gray-600">(opcional)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
              <button onClick={() => setShowPw(v => !v)} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-medium mb-1.5">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showPw ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && register.mutate()}
                placeholder="Repita a senha"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
          </div>
          <button
            onClick={() => register.mutate()}
            disabled={register.isPending || !name || !phone || !password || !confirm}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {register.isPending ? "Criando conta..." : "Criar conta grátis"}
          </button>
          <p className="text-gray-600 text-[10px] text-center">
            Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
          </p>
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
