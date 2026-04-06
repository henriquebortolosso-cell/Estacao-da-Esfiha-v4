import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const number = settings?.whatsappNumber;
  if (!number) return null;

  return (
    <a
      href={`https://wa.me/55${number.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="button-whatsapp"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-24 left-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" />
    </a>
  );
}
