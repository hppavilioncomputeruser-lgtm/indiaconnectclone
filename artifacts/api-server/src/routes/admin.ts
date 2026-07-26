import { Router, type IRouter } from "express";
import { eq, sql, and, desc } from "drizzle-orm";
import { db, usersTable, sellerProfilesTable, productsTable, servicesTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

async function buildSellerSummary(profile: typeof sellerProfilesTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.user_id));
  const [{ count: product_count }] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.seller_id, profile.user_id));
  const [{ count: service_count }] = await db.select({ count: sql<number>`count(*)::int` }).from(servicesTable).where(eq(servicesTable.seller_id, profile.user_id));
  return {
    id: profile.id,
    user_id: profile.user_id,
    user_name: user?.name ?? "Unknown",
    user_email: user?.email ?? null,
    business_name: profile.business_name,
    gst_number: profile.gst_number,
    verification_status: profile.verification_status,
    city: profile.city,
    state: profile.state,
    product_count,
    service_count,
    created_at: profile.created_at.toISOString(),
  };
}

// GET /admin/sellers
router.get("/admin/sellers", requireAdmin, async (req, res): Promise<void> => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (status) conditions.push(eq(sellerProfilesTable.verification_status, status as "pending" | "approved" | "rejected"));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(sellerProfilesTable).where(where);
  const profiles = await db.select().from(sellerProfilesTable).where(where).orderBy(desc(sellerProfilesTable.created_at)).limit(limitNum).offset(offset);

  const items = await Promise.all(profiles.map(buildSellerSummary));
  res.json({ items, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
});

// POST /admin/sellers/:id/approve
router.post("/admin/sellers/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.id, id));
  if (!profile) { res.status(404).json({ error: "Seller not found" }); return; }

  await db.update(sellerProfilesTable)
    .set({ verification_status: "approved", rejection_reason: null })
    .where(eq(sellerProfilesTable.id, id));

  res.json({ success: true, message: "Seller approved" });
});

// POST /admin/sellers/:id/reject
router.post("/admin/sellers/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { reason } = req.body;
  if (!reason) { res.status(400).json({ error: "reason is required" }); return; }

  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.id, id));
  if (!profile) { res.status(404).json({ error: "Seller not found" }); return; }

  await db.update(sellerProfilesTable)
    .set({ verification_status: "rejected", rejection_reason: reason })
    .where(eq(sellerProfilesTable.id, id));

  res.json({ success: true, message: "Seller rejected" });
});

// POST /admin/products/:id/toggle
router.post("/admin/products/:id/toggle", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const newStatus = product.status === "active" ? "inactive" : "active";
  const [updated] = await db.update(productsTable).set({ status: newStatus }).where(eq(productsTable.id, id)).returning();

  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, updated.seller_id));
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, updated.seller_id));
  const [category] = await db.select({ name: sellerProfilesTable.business_name }).from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, updated.seller_id));

  res.json({
    id: updated.id,
    seller_id: updated.seller_id,
    seller_name: profile?.business_name ?? seller?.name ?? "Unknown",
    seller_city: profile?.city ?? "",
    category_id: updated.category_id,
    category_name: "",
    title: updated.title,
    description: updated.description,
    price_min: updated.price_min !== null ? parseFloat(updated.price_min) : null,
    price_max: updated.price_max !== null ? parseFloat(updated.price_max) : null,
    unit: updated.unit,
    images: updated.images ?? [],
    status: updated.status,
    is_featured: updated.is_featured,
    tags: updated.tags ?? [],
    created_at: updated.created_at.toISOString(),
  });
});

// POST /admin/services/:id/toggle
router.post("/admin/services/:id/toggle", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }

  const newStatus = service.status === "active" ? "inactive" : "active";
  const [updated] = await db.update(servicesTable).set({ status: newStatus }).where(eq(servicesTable.id, id)).returning();

  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, updated.seller_id));
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, updated.seller_id));

  res.json({
    id: updated.id,
    seller_id: updated.seller_id,
    seller_name: profile?.business_name ?? seller?.name ?? "Unknown",
    seller_city: profile?.city ?? "",
    category_id: updated.category_id,
    category_name: "",
    title: updated.title,
    description: updated.description,
    price_min: updated.price_min !== null ? parseFloat(updated.price_min) : null,
    price_max: updated.price_max !== null ? parseFloat(updated.price_max) : null,
    price_unit: updated.price_unit,
    images: updated.images ?? [],
    status: updated.status as "active" | "inactive",
    is_featured: updated.is_featured,
    tags: updated.tags ?? [],
    created_at: updated.created_at.toISOString(),
  });
});

export default router;
