import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StoreSettings } from "@shared/schema";

export function AnalyticsScripts() {
  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!settings) return;

    if ((settings as any).ga4Id) {
      const id = (settings as any).ga4Id;
      if (document.getElementById("ga4-script")) return;
      const script1 = document.createElement("script");
      script1.id = "ga4-script";
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script1);
      const script2 = document.createElement("script");
      script2.id = "ga4-init";
      script2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;
      document.head.appendChild(script2);
    }

    if ((settings as any).facebookPixelId) {
      const pid = (settings as any).facebookPixelId;
      if (document.getElementById("fb-pixel")) return;
      const script = document.createElement("script");
      script.id = "fb-pixel";
      script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pid}');fbq('track','PageView');`;
      document.head.appendChild(script);
    }
  }, [settings]);

  return null;
}
