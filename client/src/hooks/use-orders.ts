import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateOrderInput = z.infer<typeof api.orders.create.input>;

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const validated = api.orders.create.input.parse(data);
      
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.orders.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Falha ao criar o pedido");
      }
      
      return api.orders.create.responses[201].parse(await res.json());
    },
    // No need to invalidate list since customers don't see a global order list in this flow
  });
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Falha ao buscar pedido");
      
      return api.orders.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
