import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { categories, products, storeSettings, orders, customers, accounts, whatsappOrders, riders } from "@shared/schema";
import bcrypt from "bcryptjs";
import { setupWebSocket, broadcast, getRiderLocations } from "./ws";

async function seedDatabase() {
  try {
    const existingCats = await storage.getCategories();
    if (existingCats.length === 0) {
      const [promocoes] = await db.insert(categories).values({ name: "PROMOÇÕES", sortOrder: 1 }).returning();
      const [esfihasAbertas] = await db.insert(categories).values({ name: "ESFIHAS ABERTAS", sortOrder: 2 }).returning();
      const [esfihasDoces] = await db.insert(categories).values({ name: "ESFIHAS DOCES", sortOrder: 3 }).returning();
      const [esfihasFechadas] = await db.insert(categories).values({ name: "ESFIHAS FECHADAS", sortOrder: 4 }).returning();
      const [salgados] = await db.insert(categories).values({ name: "SALGADOS", sortOrder: 5 }).returning();
      const [pizzas] = await db.insert(categories).values({ name: "PIZZAS", sortOrder: 6 }).returning();
      const [pasteis] = await db.insert(categories).values({ name: "PASTÉIS", sortOrder: 7 }).returning();
      const [beirutes] = await db.insert(categories).values({ name: "BEIRUTES", sortOrder: 8 }).returning();
      const [lanches] = await db.insert(categories).values({ name: "LANCHES", sortOrder: 9 }).returning();
      const [porcoes] = await db.insert(categories).values({ name: "PORÇÕES", sortOrder: 10 }).returning();
      const [sobremesas] = await db.insert(categories).values({ name: "SOBREMESAS", sortOrder: 11 }).returning();
      const [refrigerantes] = await db.insert(categories).values({ name: "REFRIGERANTES", sortOrder: 12 }).returning();
      const [sucos] = await db.insert(categories).values({ name: "SUCOS", sortOrder: 13 }).returning();

      await db.insert(products).values([
        { categoryId: promocoes.id, name: "Esf.Carne", description: "Esfiha aberta de carne moída temperada com tomate e cebola", price: "4.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406563/esfiha_de_carne_1.jpg", active: true },
        { categoryId: promocoes.id, name: "Esf. Queijo", description: "Esfiha aberta com queijo mussarela derretido", price: "5.75", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406562/esfiha_de_queijo.jpg", active: true },
        { categoryId: esfihasAbertas.id, name: "Esf.Carne", description: "Esfiha aberta de carne moída temperada com tomate e cebola", price: "4.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406563/esfiha_de_carne_1.jpg", active: true },
        { categoryId: esfihasAbertas.id, name: "Esf- Queijo", description: "Esfiha aberta com queijo mussarela derretido", price: "5.75", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406562/esfiha_de_queijo.jpg", active: true },
        { categoryId: esfihasAbertas.id, name: "Esf. Calabresa", description: "Esfiha aberta com calabresa e cebola", price: "5.75", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406561/esfiha_de_calabreza.jpg", active: true },
        { categoryId: esfihasAbertas.id, name: "Esf. Frango", description: "Esfiha aberta de frango desfiado temperado", price: "5.20", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406560/esfiha_de_frango.jpg", active: true },
        { categoryId: esfihasAbertas.id, name: "Esfiha Tomate Seco", description: "Esfiha aberta com tomate seco e queijo", price: "7.50", imageUrl: null, active: true },
        { categoryId: esfihasDoces.id, name: "Esfiha Mineira", description: "Esfiha doce especial ao estilo mineiro", price: "9.99", imageUrl: null, active: true },
        { categoryId: esfihasDoces.id, name: "Esf.Chocolate", description: "Esfiha doce recheada com chocolate ao leite", price: "8.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406534/semfoto1.jpg", active: true },
        { categoryId: esfihasDoces.id, name: "Esf.Chocolate Branco", description: "Esfiha doce recheada com chocolate branco", price: "8.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406533/semfoto1.jpg", active: true },
        { categoryId: esfihasDoces.id, name: "Esf. Casadinho", description: "Esfiha doce com recheio casadinho (chocolate + coco)", price: "8.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406532/semfoto1.jpg", active: true },
        { categoryId: esfihasDoces.id, name: "Esf.Beijinho", description: "Esfiha doce recheada com beijinho de coco", price: "8.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406529/semfoto1.jpg", active: true },
        { categoryId: esfihasFechadas.id, name: "Esfiha Fechada de Carne", description: "Esfiha fechada recheada com carne moída temperada", price: "5.50", imageUrl: null, active: true },
        { categoryId: esfihasFechadas.id, name: "Esfiha Fechada de Queijo", description: "Esfiha fechada com queijo mussarela", price: "6.00", imageUrl: null, active: true },
        { categoryId: esfihasFechadas.id, name: "Esfiha Fechada de Frango", description: "Esfiha fechada com frango desfiado e catupiry", price: "6.00", imageUrl: null, active: true },
        { categoryId: salgados.id, name: "Coxinha de Frango", description: "Coxinha crocante recheada com frango desfiado", price: "5.00", imageUrl: null, active: true },
        { categoryId: salgados.id, name: "Bolinha de Queijo", description: "Bolinha crocante de queijo mussarela", price: "5.00", imageUrl: null, active: true },
        { categoryId: salgados.id, name: "Enroladinho de Salsicha", description: "Enroladinho de massa folhada com salsicha", price: "4.50", imageUrl: null, active: true },
        { categoryId: pizzas.id, name: "Espanhola", description: "Mussarela, atum, cebola e orégano", price: "36.99", imageUrl: null, active: true },
        { categoryId: pizzas.id, name: "Pizza Quitauna", description: "Hambúrguer picado, mussarella, cream cheese, bacon e batata palha", price: "46.00", imageUrl: null, active: true },
        { categoryId: pizzas.id, name: "Pizza Batata Especial", description: "Batata Frita, cheddar, mussarela e bacon", price: "46.00", imageUrl: null, active: true },
        { categoryId: pizzas.id, name: "Pizza Frango Especial", description: "Frango, cream cheese, mussarela e batata palha", price: "46.00", imageUrl: null, active: true },
        { categoryId: pizzas.id, name: "Carne Seca Com", description: "Carne Seca com: Queijo, cheddar ou catupiry", price: "56.00", imageUrl: null, active: true },
        { categoryId: pasteis.id, name: "Pastel de Carne", description: "Pastel crocante recheado com carne moída", price: "8.00", imageUrl: null, active: true },
        { categoryId: pasteis.id, name: "Pastel de Queijo", description: "Pastel crocante recheado com queijo mussarela", price: "8.00", imageUrl: null, active: true },
        { categoryId: pasteis.id, name: "Pastel de Frango", description: "Pastel crocante recheado com frango e catupiry", price: "9.00", imageUrl: null, active: true },
        { categoryId: beirutes.id, name: "Beirute de Queijo", description: "Pão pita grelhado com queijo mussarela e presunto", price: "15.00", imageUrl: null, active: true },
        { categoryId: beirutes.id, name: "Beirute de Frango", description: "Pão pita grelhado com frango e molho especial", price: "17.00", imageUrl: null, active: true },
        { categoryId: lanches.id, name: "X- Burguer", description: "Maionese, Queijo e Hambúrguer 130g", price: "21.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406496/burger1_360.jpg", active: true },
        { categoryId: lanches.id, name: "X-Salada", description: "Maionese, Queijo Cheddar, Hambúrguer 130g e Salada", price: "23.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406495/burger5.jpg", active: true },
        { categoryId: lanches.id, name: "X-Egg", description: "Maionese, Ovo, Queijo e Hambúrguer 130g", price: "25.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406493/burger1_360.jpg", active: true },
        { categoryId: lanches.id, name: "Americano", description: "Maionese, Presunto, Salada, Ovo e Queijo", price: "19.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406494/burger1_360.jpg", active: true },
        { categoryId: lanches.id, name: "X-Bacon", description: "Maionese, Hambúrguer 130g, Bacon e Queijo", price: "25.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406492/burger1_360.jpg", active: true },
        { categoryId: porcoes.id, name: "Batata Frita", description: "Porção de batata frita crocante com molho", price: "22.00", imageUrl: null, active: true },
        { categoryId: porcoes.id, name: "Batata com Cheddar e Bacon", description: "Porção de batata frita com cheddar derretido e bacon", price: "32.00", imageUrl: null, active: true },
        { categoryId: porcoes.id, name: "Frango Frito", description: "Porção de frango frito crocante", price: "28.00", imageUrl: null, active: true },
        { categoryId: sobremesas.id, name: "Brownie de Chocolate", description: "Brownie caseiro com calda de chocolate", price: "12.00", imageUrl: null, active: true },
        { categoryId: sobremesas.id, name: "Pudim", description: "Pudim caseiro com calda de caramelo", price: "10.00", imageUrl: null, active: true },
        { categoryId: refrigerantes.id, name: "Energético Redbull", description: "Energético Redbull original 250ml", price: "16.00", imageUrl: null, active: true },
        { categoryId: refrigerantes.id, name: "Coca-cola 1L", description: "Garrafa de Coca-Cola 1 litro gelada", price: "15.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406470/COCA_1L.jpg", active: true },
        { categoryId: refrigerantes.id, name: "Dolly Guaraná 2L", description: "Guaraná Dolly 2 litros", price: "12.49", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406469/refrigerante-dolly-guarana-2000-ml-1.jpg", active: true },
        { categoryId: refrigerantes.id, name: "Refrigerantes 220ml", description: "Latinha 220ml - Coca, Guaraná, Fanta", price: "5.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406468/Lata_refri_220ml_2.jpg", active: true },
        { categoryId: refrigerantes.id, name: "Cerveja Lata", description: "Cerveja lata 350ml gelada", price: "8.00", imageUrl: "https://cdn.neemo.com.br/uploads/item/photo/406467/Cerveja_Lata_2.jpg", active: true },
        { categoryId: sucos.id, name: "Suco de Laranja", description: "Suco natural de laranja 300ml", price: "8.00", imageUrl: null, active: true },
        { categoryId: sucos.id, name: "Suco de Limão", description: "Suco natural de limão 300ml", price: "8.00", imageUrl: null, active: true },
        { categoryId: sucos.id, name: "Vitamina de Frutas", description: "Vitamina de frutas da estação 400ml", price: "12.00", imageUrl: null, active: true },
      ]);

      console.log("[seed] Database seeded with real products!");
    }

    const existingSettings = await storage.getStoreSettings();
    if (!existingSettings) {
      await db.insert(storeSettings).values({
        isOpen: true,
        openTime: "10:00",
        closeTime: "23:00",
        estimatedTimeMin: 10,
        estimatedTimeMax: 60,
        deliveryFee: "5.00",
        minOrder: "15.00",
        storeName: "Estação da Esfiha",
      });
      console.log("[seed] Store settings seeded!");
    }
  } catch (error) {
    console.error("Failed to seed database", error);
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isAdmin) return res.status(401).json({ message: "Não autorizado" });
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupWebSocket(httpServer);

  // ── Public routes ─────────────────────────────────────
  app.get(api.categories.list.path, async (req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get(api.products.list.path, async (req, res) => {
    const prods = await storage.getProducts();
    res.json(prods);
  });

  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getStoreSettings();
    res.json(settings || {});
  });

  // ── Loyalty: public lookup by phone ──────────────────
  app.get("/api/loyalty/:phone", async (req, res) => {
    const customer = await storage.getCustomerByPhone(req.params.phone);
    if (!customer) {
      return res.json({
        found: false,
        paidDeliveryOrders: 0,
        freeDeliveriesUsed: 0,
        freeDeliveriesAvailable: 0,
        ordersUntilFree: 10,
        progress: 0,
      });
    }
    const freeEarned = Math.floor(customer.paidDeliveryOrders / 10);
    const freeAvailable = freeEarned - customer.freeDeliveriesUsed;
    const ordersInCurrentCycle = customer.paidDeliveryOrders % 10;
    const ordersUntilFree = freeAvailable > 0 ? 0 : 10 - ordersInCurrentCycle;
    return res.json({
      found: true,
      name: customer.name,
      paidDeliveryOrders: customer.paidDeliveryOrders,
      freeDeliveriesUsed: customer.freeDeliveriesUsed,
      freeDeliveriesAvailable: freeAvailable,
      ordersUntilFree,
      progress: ordersInCurrentCycle,
    });
  });

  // ── Coupons ───────────────────────────────────────────
  app.post("/api/coupons/validate", async (req, res) => {
    const { code, orderTotal, total } = req.body;
    const cartTotal = orderTotal ?? total;
    if (!code || typeof cartTotal !== "number") {
      return res.status(400).json({ message: "Código e total são obrigatórios" });
    }
    const result = await storage.validateCoupon(code, cartTotal);
    if (!result) {
      return res.status(400).json({ message: "Cupom inválido, expirado ou não aplicável para este pedido" });
    }
    res.json({ coupon: result.coupon, discountAmount: result.discountAmount });
  });

  // ── Orders ────────────────────────────────────────────
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const { useFreeDelivery, couponCode, discountAmount, ...rest } = req.body;
      const input = api.orders.create.input.parse({
        ...rest,
        usedFreeDelivery: !!useFreeDelivery,
        couponCode: couponCode || null,
        discountAmount: discountAmount ? String(discountAmount) : null,
      });
      const { items, ...orderData } = input;
      const order = await storage.createOrder(orderData as any, items as any);

      // Update loyalty
      if (orderData.customerPhone) {
        try {
          await storage.upsertCustomer(orderData.customerPhone, orderData.customerName);
          await storage.recordOrderForLoyalty(orderData.customerPhone, !!useFreeDelivery);
        } catch (e) {
          console.warn("[loyalty] Failed to update loyalty:", e);
        }
      }

      // Increment coupon use
      if (couponCode) {
        try {
          const validated = await storage.validateCoupon(couponCode, 0);
          if (validated) await storage.incrementCouponUse(validated.coupon.id);
        } catch (e) {
          console.warn("[coupon] Failed to increment coupon use:", e);
        }
      }

      broadcast({ type: "order:new" });
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
    res.json(order);
  });

  // ── Admin auth ────────────────────────────────────────
  app.post("/api/admin/access", (req, res) => {
    const { token } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "esfiha de chocolate";
    if (token && token === adminPassword) {
      req.session!.isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Link inválido" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "esfiha de chocolate";
    if (password && password === adminPassword) {
      req.session!.isAdmin = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Senha incorreta" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session!.isAdmin = false;
    res.json({ success: true });
  });

  app.get("/api/admin/check", requireAdmin, (req, res) => {
    res.json({ authenticated: true });
  });

  // ── Admin - Products ──────────────────────────────────
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    const prods = await (storage as any).getAllProducts();
    res.json(prods);
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { insertProductSchema } = await import("@shared/schema");
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Admin - Categories ────────────────────────────────
  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const { insertCategorySchema } = await import("@shared/schema");
      const data = insertCategorySchema.parse(req.body);
      const cat = await storage.createCategory(data);
      res.status(201).json(cat);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    const cat = await storage.updateCategory(Number(req.params.id), req.body);
    res.json(cat);
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Admin - Store Settings ────────────────────────────
  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    const settings = await storage.updateStoreSettings(req.body);
    res.json(settings);
  });

  // ── Admin - Loyalty Stats ─────────────────────────────
  app.get("/api/admin/loyalty", requireAdmin, async (req, res) => {
    const customers = await storage.getAllCustomers();
    const stats = await storage.getLoyaltyStats();
    res.json({ customers, stats });
  });

  // ── WhatsApp Orders ───────────────────────────────────
  app.post("/api/whatsapp-orders", async (req, res) => {
    try {
      const { insertWhatsappOrderSchema } = await import("@shared/schema");
      const data = insertWhatsappOrderSchema.parse(req.body);
      const order = await storage.createWhatsappOrder(data);
      broadcast({ type: "whatsapp:new" });
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get("/api/admin/whatsapp-orders", requireAdmin, async (req, res) => {
    const orders = await storage.getAllWhatsappOrders();
    const stats = await storage.getWhatsappOrderStats();
    res.json({ orders, stats });
  });

  app.patch("/api/admin/whatsapp-orders/:id/status", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!["pendente", "pago", "cancelado"].includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }
    const order = await storage.updateWhatsappOrderStatus(Number(req.params.id), status);
    broadcast({ type: "whatsapp:status", orderId: order.id, status });
    // When marked as paid, update loyalty for the customer
    if (status === "pago" && order.customerPhone) {
      try {
        await storage.upsertCustomer(order.customerPhone, order.customerName);
        await storage.recordOrderForLoyalty(order.customerPhone, false);
      } catch (e) {
        console.warn("[loyalty] Failed to update loyalty for WhatsApp order:", e);
      }
    }
    res.json(order);
  });

  // ── Admin - Coupons ───────────────────────────────────
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders);
  });

  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    const all = await storage.getAllCoupons();
    res.json(all);
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const { insertCouponSchema } = await import("@shared/schema");
      const data = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(data);
      res.status(201).json(coupon);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      if ((err as any)?.code === "23505") return res.status(400).json({ message: "Já existe um cupom com este código" });
      throw err;
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    await storage.deleteCoupon(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Admin - Order Status (Kanban) ─────────────────────
  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["pending", "preparing", "out_for_delivery", "completed", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }
    const order = await storage.updateOrderStatus(Number(req.params.id), status);
    broadcast({ type: "order:status", orderId: order.id, status: order.status });
    res.json(order);
  });

  // ── Order tracking (public) ───────────────────────────
  app.get("/api/orders/:id/tracking", async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Pedido não encontrado" });
    const statusLabels: Record<string, string> = {
      pending:          "Aguardando preparo",
      preparing:        "Em preparo",
      out_for_delivery: "Saiu para entrega",
      delivered:        "Saiu para entrega",
      completed:        "Entregue!",
      cancelled:        "Cancelado",
    };
    const isDelivering = order.status === "out_for_delivery" || order.status === "delivered";
    const isCompleted  = order.status === "completed";
    const steps = [
      { key: "pending",          label: "Pedido recebido",   done: true },
      { key: "preparing",        label: "Em preparo",         done: order.status !== "pending" },
      { key: "out_for_delivery", label: "Saiu para entrega",  done: isDelivering || isCompleted },
      { key: "completed",        label: "Entregue",           done: isCompleted },
    ];
    const riderLocs = getRiderLocations();
    const riderLocation = isDelivering && riderLocs.length > 0 ? riderLocs[0] : null;
    res.json({
      id: order.id,
      customerName: order.customerName,
      status: order.status,
      statusLabel: statusLabels[order.status] ?? order.status,
      deliveryAddress: order.deliveryAddress,
      total: order.total,
      createdAt: order.createdAt,
      steps,
      riderLocation,
    });
  });

  // ── Rider locations (public for tracking) ─────────────
  app.get("/api/rider-locations", async (_req, res) => {
    res.json(getRiderLocations());
  });

  // ── Rider Auth ─────────────────────────────────────────
  app.post("/api/rider/login", async (req, res) => {
    const { phone, pin } = req.body;
    if (!phone || !pin) return res.status(400).json({ message: "Telefone e PIN são obrigatórios" });
    const normalized = phone.replace(/\D/g, "");
    const [rider] = await db.select().from(riders).where(eq(riders.phone, normalized)).limit(1);
    if (!rider || !rider.active) return res.status(401).json({ message: "Motoqueiro não encontrado ou inativo" });
    if (rider.pin !== pin) return res.status(401).json({ message: "PIN incorreto" });
    res.json({ id: rider.id, name: rider.name, phone: rider.phone });
  });

  // ── Admin - Riders CRUD ────────────────────────────────
  app.get("/api/admin/riders", requireAdmin, async (_req, res) => {
    const all = await db.select().from(riders).orderBy(riders.name);
    res.json(all);
  });

  app.post("/api/admin/riders", requireAdmin, async (req, res) => {
    const { name, phone, pin } = req.body;
    if (!name || !phone || !pin) return res.status(400).json({ message: "Nome, telefone e PIN são obrigatórios" });
    if (String(pin).length < 4) return res.status(400).json({ message: "PIN deve ter ao menos 4 dígitos" });
    const normalized = phone.replace(/\D/g, "");
    const [rider] = await db.insert(riders).values({ name, phone: normalized, pin: String(pin) }).returning();
    res.status(201).json(rider);
  });

  app.patch("/api/admin/riders/:id", requireAdmin, async (req, res) => {
    const { active, name, pin } = req.body;
    const updates: Partial<typeof riders.$inferInsert> = {};
    if (typeof active === "boolean") updates.active = active;
    if (name) updates.name = name;
    if (pin) updates.pin = String(pin);
    const [rider] = await db.update(riders).set(updates).where(eq(riders.id, Number(req.params.id))).returning();
    if (!rider) return res.status(404).json({ message: "Motoqueiro não encontrado" });
    res.json(rider);
  });

  app.delete("/api/admin/riders/:id", requireAdmin, async (req, res) => {
    await db.delete(riders).where(eq(riders.id, Number(req.params.id)));
    res.json({ success: true });
  });

  // ── Admin - Customer orders history ───────────────────
  app.get("/api/admin/customers/:phone/orders", requireAdmin, async (req, res) => {
    const orders = await storage.getOrdersByPhone(req.params.phone);
    res.json(orders);
  });

  // ── Admin - Inactive customers ────────────────────────
  app.get("/api/admin/customers/inactive", requireAdmin, async (req, res) => {
    const days = parseInt(String(req.query.days ?? "30"), 10);
    const rows = await db.select({
      id: customers.id,
      phone: customers.phone,
      name: customers.name,
      email: customers.email,
      lastOrderAt: sql<string>`MAX(${orders.createdAt})`,
      orderCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.id} END) AS INTEGER)`,
      totalSpent: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric END), 0) AS FLOAT)`,
      daysSinceLastOrder: sql<number>`CAST(COALESCE(EXTRACT(DAY FROM NOW() - MAX(${orders.createdAt})), 9999) AS INTEGER)`,
    }).from(customers)
      .leftJoin(orders, eq(orders.customerPhone, customers.phone))
      .groupBy(customers.id)
      .having(sql`(MAX(${orders.createdAt}) IS NULL OR MAX(${orders.createdAt}) < NOW() - (${days} || ' days')::interval)`)
      .orderBy(sql`MAX(${orders.createdAt}) ASC NULLS FIRST`);
    res.json(rows);
  });

  // ── Admin - Analytics ─────────────────────────────────
  app.get("/api/admin/analytics/top-products", requireAdmin, async (req, res) => {
    const top = await storage.getTopProducts();
    res.json(top);
  });

  app.get("/api/admin/analytics/summary", requireAdmin, async (req, res) => {
    const [summary] = await db.select({
      todayRevenue: sql<number>`CAST(COALESCE(SUM(CASE WHEN DATE(${orders.createdAt}) = CURRENT_DATE THEN ${orders.total}::numeric END), 0) AS FLOAT)`,
      todayCount: sql<number>`CAST(COUNT(CASE WHEN DATE(${orders.createdAt}) = CURRENT_DATE THEN 1 END) AS INTEGER)`,
      weekRevenue: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('week', NOW()) THEN ${orders.total}::numeric END), 0) AS FLOAT)`,
      monthRevenue: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('month', NOW()) THEN ${orders.total}::numeric END), 0) AS FLOAT)`,
      monthCount: sql<number>`CAST(COUNT(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('month', NOW()) THEN 1 END) AS INTEGER)`,
      avgTicket: sql<number>`CAST(COALESCE(AVG(${orders.total}::numeric), 0) AS FLOAT)`,
      totalOrders: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    }).from(orders).where(sql`${orders.status} != 'cancelled'`);
    res.json(summary ?? {});
  });

  app.get("/api/admin/analytics/revenue-chart", requireAdmin, async (req, res) => {
    const days = parseInt(String(req.query.days ?? "30"), 10);
    const chart = await db.select({
      date: sql<string>`TO_CHAR(DATE(${orders.createdAt}), 'DD/MM')`,
      revenue: sql<number>`CAST(COALESCE(SUM(${orders.total}::numeric), 0) AS FLOAT)`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    }).from(orders)
      .where(sql`${orders.createdAt} >= NOW() - (${days} || ' days')::interval AND ${orders.status} != 'cancelled'`)
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);
    res.json(chart);
  });

  app.get("/api/admin/analytics/platform-breakdown", requireAdmin, async (req, res) => {
    const webOrders = await db.select({
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      revenue: sql<number>`CAST(COALESCE(SUM(${orders.total}::numeric), 0) AS FLOAT)`,
    }).from(orders).where(sql`${orders.status} != 'cancelled'`);

    const waOrders = await db.select({
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      revenue: sql<number>`CAST(COALESCE(SUM(${whatsappOrders.total}::numeric), 0) AS FLOAT)`,
    }).from(whatsappOrders).where(sql`${whatsappOrders.status} != 'cancelado'`);

    res.json([
      { platform: "Cardápio Online", count: webOrders[0]?.count ?? 0, revenue: webOrders[0]?.revenue ?? 0 },
      { platform: "WhatsApp",        count: waOrders[0]?.count ?? 0,  revenue: waOrders[0]?.revenue ?? 0 },
    ]);
  });

  app.get("/api/admin/analytics/return-rate", requireAdmin, async (req, res) => {
    const allCustomers = await db.select({
      phone: customers.phone,
      orderCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.id} END) AS INTEGER)`,
    }).from(customers)
      .leftJoin(orders, eq(orders.customerPhone, customers.phone))
      .groupBy(customers.phone);

    const totalCustomers = allCustomers.length;
    const returningCustomers = allCustomers.filter(c => c.orderCount > 1).length;
    const returnRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    res.json({ totalCustomers, returningCustomers, returnRate, newCustomers: totalCustomers - returningCustomers });
  });

  app.get("/api/admin/analytics/payment-methods", requireAdmin, async (req, res) => {
    const rows = await db.select({
      method: orders.paymentMethod,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      revenue: sql<number>`CAST(COALESCE(SUM(${orders.total}::numeric), 0) AS FLOAT)`,
    }).from(orders)
      .where(sql`${orders.status} != 'cancelled'`)
      .groupBy(orders.paymentMethod)
      .orderBy(sql`COUNT(*) DESC`);
    res.json(rows);
  });

  app.get("/api/admin/analytics/customers-stats", requireAdmin, async (req, res) => {
    const rows = await db.select({
      id: customers.id,
      phone: customers.phone,
      name: customers.name,
      email: customers.email,
      paidDeliveryOrders: customers.paidDeliveryOrders,
      freeDeliveriesUsed: customers.freeDeliveriesUsed,
      createdAt: customers.createdAt,
      totalSpent: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric END), 0) AS FLOAT)`,
      lastOrderAt: sql<string>`MAX(${orders.createdAt})`,
      orderCount: sql<number>`CAST(COUNT(DISTINCT CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.id} END) AS INTEGER)`,
    }).from(customers)
      .leftJoin(orders, eq(orders.customerPhone, customers.phone))
      .groupBy(customers.id)
      .orderBy(sql`CAST(COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total}::numeric END), 0) AS FLOAT) DESC`);
    res.json(rows);
  });

  app.patch("/api/admin/customers/:phone/email", requireAdmin, async (req, res) => {
    const { email } = req.body;
    const normalized = req.params.phone.replace(/\D/g, "");
    const [updated] = await db.update(customers)
      .set({ email: email || null })
      .where(eq(customers.phone, normalized))
      .returning();
    if (!updated) return res.status(404).json({ message: "Cliente não encontrado" });
    res.json(updated);
  });

  // ── Customer Auth ──────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ message: "Nome, telefone e senha são obrigatórios" });
    if (password.length < 6) return res.status(400).json({ message: "Senha deve ter no mínimo 6 caracteres" });
    const normalized = phone.replace(/\D/g, "");
    const existing = await db.select().from(accounts).where(eq(accounts.phone, normalized)).limit(1);
    if (existing.length > 0) return res.status(409).json({ message: "Já existe uma conta com este telefone" });
    const passwordHash = await bcrypt.hash(password, 10);
    const [account] = await db.insert(accounts).values({ name, phone: normalized, email: email || null, passwordHash }).returning();
    req.session.customerId = account.id;
    const { passwordHash: _, ...safe } = account;
    res.status(201).json(safe);
  });

  app.post("/api/auth/login", async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: "Telefone e senha são obrigatórios" });
    const normalized = phone.replace(/\D/g, "");
    const [account] = await db.select().from(accounts).where(eq(accounts.phone, normalized)).limit(1);
    if (!account) return res.status(401).json({ message: "Telefone ou senha incorretos" });
    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) return res.status(401).json({ message: "Telefone ou senha incorretos" });
    req.session.customerId = account.id;
    const { passwordHash: _, ...safe } = account;
    res.json(safe);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.customerId = undefined;
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Não autenticado" });
    const [account] = await db.select({ id: accounts.id, phone: accounts.phone, name: accounts.name, email: accounts.email, createdAt: accounts.createdAt })
      .from(accounts).where(eq(accounts.id, req.session.customerId)).limit(1);
    if (!account) { req.session.customerId = undefined; return res.status(401).json({ message: "Conta não encontrada" }); }
    res.json(account);
  });

  if (process.env.DATABASE_URL) seedDatabase();
  return httpServer;
}
