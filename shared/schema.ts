import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  paymentMethod: text("payment_method").notNull(),
  changeFor: decimal("change_for", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  usedFreeDelivery: boolean("used_free_delivery").notNull().default(false),
  couponCode: text("coupon_code"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  platform: text("platform").notNull().default("web"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  isOpen: boolean("is_open").notNull().default(true),
  openTime: text("open_time").notNull().default("10:00"),
  closeTime: text("close_time").notNull().default("23:00"),
  estimatedTimeMin: integer("estimated_time_min").notNull().default(10),
  estimatedTimeMax: integer("estimated_time_max").notNull().default(60),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("5.00"),
  minOrder: decimal("min_order", { precision: 10, scale: 2 }).notNull().default("15.00"),
  freeShippingAbove: decimal("free_shipping_above", { precision: 10, scale: 2 }),
  deliveryZones: text("delivery_zones"),
  loyaltyOrdersRequired: integer("loyalty_orders_required").notNull().default(10),
  bannerImageUrl: text("banner_image_url"),
  bannerLink: text("banner_link"),
  bannerTitle: text("banner_title"),
  storeName: text("store_name").notNull().default("Estação da Esfiha"),
  storeDescription: text("store_description"),
  heroImageUrl: text("hero_image_url"),
  storyTitle: text("story_title"),
  storyText: text("story_text"),
  storyBgUrl: text("story_bg_url"),
  address: text("address"),
  weeklySchedule: text("weekly_schedule"),
  paymentMethods: text("payment_methods"),
  whatsappNumber: text("whatsapp_number"),
  ratingScore: text("rating_score"),
  ratingText: text("rating_text"),
  pixKey: text("pix_key"),
  ga4Id: text("ga4_id"),
  facebookPixelId: text("facebook_pixel_id"),
  storeLatitude: text("store_latitude"),
  storeLongitude: text("store_longitude"),
});

export const riders = pgTable("riders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  pin: text("pin").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  paidDeliveryOrders: integer("paid_delivery_orders").notNull().default(0),
  freeDeliveriesUsed: integer("free_deliveries_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappOrders = pgTable("whatsapp_orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  itemsJson: text("items_json").notNull(),
  paymentMethod: text("payment_method").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pendente"),
  platform: text("platform").notNull().default("whatsapp"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrder: decimal("min_order", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertWhatsappOrderSchema = createInsertSchema(whatsappOrders).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, usedCount: true });

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type StoreSettings = typeof storeSettings.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type WhatsappOrder = typeof whatsappOrders.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Account = typeof accounts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertWhatsappOrder = z.infer<typeof insertWhatsappOrderSchema>;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
