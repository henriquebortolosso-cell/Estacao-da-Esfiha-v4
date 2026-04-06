import type {
  Category, Product, Order, OrderItem, StoreSettings, Customer, WhatsappOrder, Coupon,
  InsertCategory, InsertProduct, InsertOrder, InsertOrderItem, InsertStoreSettings, InsertCustomer, InsertWhatsappOrder, InsertCoupon
} from "@shared/schema";

const CATS = [
  { id: 1, name: "PROMOÇÕES", sortOrder: 1 },
  { id: 2, name: "ESFIHAS ABERTAS", sortOrder: 2 },
  { id: 3, name: "ESFIHAS DOCES", sortOrder: 3 },
  { id: 4, name: "ESFIHAS FECHADAS", sortOrder: 4 },
  { id: 5, name: "SALGADOS", sortOrder: 5 },
  { id: 6, name: "PIZZAS", sortOrder: 6 },
  { id: 7, name: "PASTÉIS", sortOrder: 7 },
  { id: 8, name: "BEIRUTES", sortOrder: 8 },
  { id: 9, name: "LANCHES", sortOrder: 9 },
  { id: 10, name: "PORÇÕES", sortOrder: 10 },
  { id: 11, name: "SOBREMESAS", sortOrder: 11 },
  { id: 12, name: "REFRIGERANTES", sortOrder: 12 },
  { id: 13, name: "SUCOS", sortOrder: 13 },
] satisfies Category[];

let pid = 1;
function p(categoryId: number, name: string, description: string, price: string, imageUrl: string | null = null): Product {
  return { id: pid++, categoryId, name, description, price, imageUrl, active: true };
}

const PRODUCTS: Product[] = [
  p(1, "Esf.Carne", "Esfiha aberta de carne moída temperada com tomate e cebola", "4.00", "https://cdn.neemo.com.br/uploads/item/photo/406563/esfiha_de_carne_1.jpg"),
  p(1, "Esf. Queijo", "Esfiha aberta com queijo mussarela derretido", "5.75", "https://cdn.neemo.com.br/uploads/item/photo/406562/esfiha_de_queijo.jpg"),
  p(2, "Esf.Carne", "Esfiha aberta de carne moída temperada com tomate e cebola", "4.00", "https://cdn.neemo.com.br/uploads/item/photo/406563/esfiha_de_carne_1.jpg"),
  p(2, "Esf. Queijo", "Esfiha aberta com queijo mussarela derretido", "5.75", "https://cdn.neemo.com.br/uploads/item/photo/406562/esfiha_de_queijo.jpg"),
  p(2, "Esf. Calabresa", "Esfiha aberta com calabresa e cebola", "5.75", "https://cdn.neemo.com.br/uploads/item/photo/406561/esfiha_de_calabreza.jpg"),
  p(2, "Esf. Frango", "Esfiha aberta de frango desfiado temperado", "5.20", "https://cdn.neemo.com.br/uploads/item/photo/406560/esfiha_de_frango.jpg"),
  p(2, "Esfiha Tomate Seco", "Esfiha aberta com tomate seco e queijo", "7.50"),
  p(3, "Esfiha Mineira", "Esfiha doce especial ao estilo mineiro", "9.99"),
  p(3, "Esf.Chocolate", "Esfiha doce recheada com chocolate ao leite", "8.00", "https://cdn.neemo.com.br/uploads/item/photo/406534/semfoto1.jpg"),
  p(3, "Esf.Chocolate Branco", "Esfiha doce recheada com chocolate branco", "8.00", "https://cdn.neemo.com.br/uploads/item/photo/406533/semfoto1.jpg"),
  p(3, "Esf. Casadinho", "Esfiha doce com recheio casadinho (chocolate + coco)", "8.00", "https://cdn.neemo.com.br/uploads/item/photo/406532/semfoto1.jpg"),
  p(3, "Esf.Beijinho", "Esfiha doce recheada com beijinho de coco", "8.00", "https://cdn.neemo.com.br/uploads/item/photo/406529/semfoto1.jpg"),
  p(4, "Esfiha Fechada de Carne", "Esfiha fechada recheada com carne moída temperada", "5.50"),
  p(4, "Esfiha Fechada de Queijo", "Esfiha fechada com queijo mussarela", "6.00"),
  p(4, "Esfiha Fechada de Frango", "Esfiha fechada com frango desfiado e catupiry", "6.00"),
  p(5, "Coxinha de Frango", "Coxinha crocante recheada com frango desfiado", "5.00"),
  p(5, "Bolinha de Queijo", "Bolinha crocante de queijo mussarela", "5.00"),
  p(5, "Enroladinho de Salsicha", "Enroladinho de massa folhada com salsicha", "4.50"),
  p(6, "Espanhola", "Mussarela, atum, cebola e orégano", "36.99"),
  p(6, "Pizza Quitauna", "Hambúrguer picado, mussarella, cream cheese, bacon e batata palha", "46.00"),
  p(6, "Pizza Batata Especial", "Batata Frita, cheddar, mussarela e bacon", "46.00"),
  p(6, "Pizza Frango Especial", "Frango, cream cheese, mussarela e batata palha", "46.00"),
  p(6, "Carne Seca Com", "Carne Seca com: Queijo, cheddar ou catupiry", "56.00"),
  p(7, "Pastel de Carne", "Pastel crocante recheado com carne moída", "8.00"),
  p(7, "Pastel de Queijo", "Pastel crocante recheado com queijo mussarela", "8.00"),
  p(7, "Pastel de Frango", "Pastel crocante recheado com frango e catupiry", "9.00"),
  p(8, "Beirute de Queijo", "Pão pita grelhado com queijo mussarela e presunto", "15.00"),
  p(8, "Beirute de Frango", "Pão pita grelhado com frango e molho especial", "17.00"),
  p(9, "X-Burguer", "Maionese, Queijo e Hambúrguer 130g", "21.00", "https://cdn.neemo.com.br/uploads/item/photo/406496/burger1_360.jpg"),
  p(9, "X-Salada", "Maionese, Queijo Cheddar, Hambúrguer 130g e Salada", "23.00", "https://cdn.neemo.com.br/uploads/item/photo/406495/burger5.jpg"),
  p(9, "X-Egg", "Maionese, Ovo, Queijo e Hambúrguer 130g", "25.00", "https://cdn.neemo.com.br/uploads/item/photo/406493/burger1_360.jpg"),
  p(9, "Americano", "Maionese, Presunto, Salada, Ovo e Queijo", "19.00", "https://cdn.neemo.com.br/uploads/item/photo/406494/burger1_360.jpg"),
  p(9, "X-Bacon", "Maionese, Hambúrguer 130g, Bacon e Queijo", "25.00", "https://cdn.neemo.com.br/uploads/item/photo/406492/burger1_360.jpg"),
  p(10, "Batata Frita", "Porção de batata frita crocante com molho", "22.00"),
  p(10, "Batata com Cheddar e Bacon", "Porção de batata frita com cheddar derretido e bacon", "32.00"),
  p(10, "Frango Frito", "Porção de frango frito crocante", "28.00"),
  p(11, "Brownie de Chocolate", "Brownie caseiro com calda de chocolate", "12.00"),
  p(11, "Pudim", "Pudim caseiro com calda de caramelo", "10.00"),
  p(12, "Energético Redbull", "Energético Redbull original 250ml", "16.00"),
  p(12, "Coca-cola 1L", "Garrafa de Coca-Cola 1 litro gelada", "15.00", "https://cdn.neemo.com.br/uploads/item/photo/406470/COCA_1L.jpg"),
  p(12, "Dolly Guaraná 2L", "Guaraná Dolly 2 litros", "12.49", "https://cdn.neemo.com.br/uploads/item/photo/406469/refrigerante-dolly-guarana-2000-ml-1.jpg"),
  p(12, "Refrigerantes 220ml", "Latinha 220ml - Coca, Guaraná, Fanta", "5.00", "https://cdn.neemo.com.br/uploads/item/photo/406468/Lata_refri_220ml_2.jpg"),
  p(12, "Cerveja Lata", "Cerveja lata 350ml gelada", "8.00", "https://cdn.neemo.com.br/uploads/item/photo/406467/Cerveja_Lata_2.jpg"),
  p(13, "Suco de Laranja", "Suco natural de laranja 300ml", "8.00"),
  p(13, "Suco de Limão", "Suco natural de limão 300ml", "8.00"),
  p(13, "Vitamina de Frutas", "Vitamina de frutas da estação 400ml", "12.00"),
];

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  isOpen: true,
  openTime: "10:00",
  closeTime: "23:00",
  estimatedTimeMin: 10,
  estimatedTimeMax: 60,
  deliveryFee: "5.00",
  minOrder: "15.00",
  storeName: "Estação da Esfiha",
  storeDescription: null,
  heroImageUrl: null,
  bannerImageUrl: null,
  bannerLink: null,
  bannerTitle: null,
  storyTitle: null,
  storyText: null,
  whatsappNumber: null,
  pixKey: null,
};

export class DemoStorage implements IStorage {
  private _categories: Category[] = [...CATS];
  private _products: Product[] = [...PRODUCTS];
  private _orders: Order[] = [];
  private _orderItems: OrderItem[] = [];
  private _settings: StoreSettings = { ...DEFAULT_SETTINGS };
  private _customers: Customer[] = [];
  private _whatsappOrders: WhatsappOrder[] = [];
  private _coupons: Coupon[] = [];
  private _orderId = 1;
  private _orderItemId = 1;
  private _customerId = 1;
  private _waOrderId = 1;
  private _couponId = 1;
  private _catId = 14;
  private _productId = pid;

  async getCategories(): Promise<Category[]> {
    return [...this._categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getProducts(): Promise<Product[]> {
    return this._products.filter(p => p.active);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this._orders.find(o => o.id === id);
  }

  async createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order> {
    const newOrder: Order = { ...order, id: this._orderId++, createdAt: new Date() } as Order;
    this._orders.push(newOrder);
    items.forEach(item => {
      this._orderItems.push({ ...item, id: this._orderItemId++, orderId: newOrder.id } as OrderItem);
    });
    return newOrder;
  }

  async getStoreSettings(): Promise<StoreSettings | undefined> {
    return { ...this._settings };
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const normalized = phone.replace(/\D/g, "");
    return this._customers.find(c => c.phone === normalized);
  }

  async upsertCustomer(phone: string, name: string): Promise<Customer> {
    const normalized = phone.replace(/\D/g, "");
    const existing = this._customers.find(c => c.phone === normalized);
    if (existing) {
      existing.name = name;
      return { ...existing };
    }
    const created: Customer = { id: this._customerId++, phone: normalized, name, paidDeliveryOrders: 0, freeDeliveriesUsed: 0, createdAt: new Date() };
    this._customers.push(created);
    return { ...created };
  }

  async recordOrderForLoyalty(phone: string, usedFreeDelivery: boolean): Promise<Customer> {
    const normalized = phone.replace(/\D/g, "");
    const customer = this._customers.find(c => c.phone === normalized);
    if (!customer) throw new Error("Customer not found");
    if (usedFreeDelivery) customer.freeDeliveriesUsed++;
    else customer.paidDeliveryOrders++;
    return { ...customer };
  }

  async createCategory(cat: InsertCategory): Promise<Category> {
    const newCat: Category = { ...cat, id: this._catId++ };
    this._categories.push(newCat);
    return { ...newCat };
  }

  async updateCategory(id: number, cat: Partial<InsertCategory>): Promise<Category> {
    const idx = this._categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    this._categories[idx] = { ...this._categories[idx], ...cat };
    return { ...this._categories[idx] };
  }

  async deleteCategory(id: number): Promise<void> {
    this._categories = this._categories.filter(c => c.id !== id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = { ...product, id: this._productId++, active: product.active ?? true, imageUrl: product.imageUrl ?? null };
    this._products.push(newProduct);
    return { ...newProduct };
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const idx = this._products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    this._products[idx] = { ...this._products[idx], ...product };
    return { ...this._products[idx] };
  }

  async deleteProduct(id: number): Promise<void> {
    this._products = this._products.filter(p => p.id !== id);
  }

  async updateStoreSettings(settings: Partial<InsertStoreSettings>): Promise<StoreSettings> {
    this._settings = { ...this._settings, ...settings };
    return { ...this._settings };
  }

  async getAllCustomers(): Promise<Customer[]> {
    return [...this._customers].sort((a, b) => b.paidDeliveryOrders - a.paidDeliveryOrders);
  }

  async getLoyaltyStats() {
    const totalPaidOrders = this._customers.reduce((s, c) => s + c.paidDeliveryOrders, 0);
    const totalFreeDeliveries = this._customers.reduce((s, c) => s + c.freeDeliveriesUsed, 0);
    return { totalPaidOrders, totalFreeDeliveries, totalCustomers: this._customers.length };
  }

  async createWhatsappOrder(order: InsertWhatsappOrder): Promise<WhatsappOrder> {
    const created: WhatsappOrder = { ...order, id: this._waOrderId++, createdAt: new Date(), status: order.status ?? "pendente" } as WhatsappOrder;
    this._whatsappOrders.push(created);
    return { ...created };
  }

  async getAllWhatsappOrders(): Promise<WhatsappOrder[]> {
    return [...this._whatsappOrders].reverse();
  }

  async updateWhatsappOrderStatus(id: number, status: string): Promise<WhatsappOrder> {
    const order = this._whatsappOrders.find(o => o.id === id);
    if (!order) throw new Error("Order not found");
    order.status = status;
    return { ...order };
  }

  async getWhatsappOrderStats() {
    const pendente = this._whatsappOrders.filter(o => o.status === "pendente").length;
    const pago = this._whatsappOrders.filter(o => o.status === "pago").length;
    return { total: this._whatsappOrders.length, pendente, pago };
  }

  async validateCoupon(code: string, orderTotal: number) {
    const coupon = this._coupons.find(c => c.code === code.toUpperCase().trim());
    if (!coupon || !coupon.active) return null;
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return null;
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return null;
    if (coupon.minOrder !== null && orderTotal < parseFloat(String(coupon.minOrder))) return null;
    const value = parseFloat(String(coupon.value));
    const discountAmount = coupon.type === "percent"
      ? Math.min(orderTotal, (orderTotal * value) / 100)
      : Math.min(orderTotal, value);
    return { coupon, discountAmount: Math.round(discountAmount * 100) / 100 };
  }

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    const created: Coupon = { ...data, id: this._couponId++, code: String(data.code).toUpperCase().trim(), usedCount: 0, createdAt: new Date(), active: data.active ?? true, expiresAt: data.expiresAt ?? null, maxUses: data.maxUses ?? null, minOrder: data.minOrder ?? null };
    this._coupons.push(created);
    return { ...created };
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return [...this._coupons].reverse();
  }

  async deleteCoupon(id: number): Promise<void> {
    this._coupons = this._coupons.filter(c => c.id !== id);
  }

  async incrementCouponUse(id: number): Promise<void> {
    const coupon = this._coupons.find(c => c.id === id);
    if (coupon) coupon.usedCount++;
  }

  async getAllOrders() {
    return this._orders.map(order => ({
      ...order,
      items: this._orderItems
        .filter(i => i.orderId === order.id)
        .map(i => ({
          ...i,
          productName: this._products.find(p => p.id === i.productId)?.name ?? "Produto",
        })),
    }));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this._orders.find(o => o.id === id);
    if (!order) throw new Error("Order not found");
    order.status = status;
    return { ...order };
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    const normalized = phone.replace(/\D/g, "");
    return this._orders.filter(o => o.customerPhone === normalized).slice(-20).reverse();
  }

  async getTopProducts() {
    const counts: Record<number, number> = {};
    this._orderItems.forEach(i => {
      counts[i.productId] = (counts[i.productId] || 0) + i.quantity;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, totalSold]) => ({
        productId: Number(productId),
        name: this._products.find(p => p.id === Number(productId))?.name ?? "Produto",
        totalSold,
      }));
  }
}
