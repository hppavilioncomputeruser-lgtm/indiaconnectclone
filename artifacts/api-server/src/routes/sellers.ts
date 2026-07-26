import { Router, type IRouter } from "express";
import { eq, sql, and, ilike, desc } from "drizzle-orm";
import { db, usersTable, sellerProfilesTable, productsTable, servicesTable } from "@workspace/db";

const router: IRouter = Router();

async function buildSellerSummary(profile: typeof sellerProfilesTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.user_id));
  const [{ count: product_count }] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(and(eq(productsTable.seller_id, profile.user_id), eq(productsTable.status, "active")));
  const [{ count: service_count }] = await db.select({ count: sql<number>`count(*)::int` }).from(servicesTable).where(and(eq(servicesTable.seller_id, profile.user_id), eq(servicesTable.status, "active")));
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

// GET /sellers
router.get("/sellers", async (req, res): Promise<void> => {
  const { q, city, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(sellerProfilesTable.verification_status, "approved")];
  if (q) conditions.push(ilike(sellerProfilesTable.business_name, `%${q}%`));
  if (city) conditions.push(ilike(sellerProfilesTable.city, `%${city}%`));

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(sellerProfilesTable).where(where);
  const profiles = await db.select().from(sellerProfilesTable).where(where).orderBy(desc(sellerProfilesTable.created_at)).limit(limitNum).offset(offset);

  const items = await Promise.all(profiles.map(buildSellerSummary));
  res.json({ items, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
});

// GET /sellers/:id
router.get("/sellers/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Try by seller profile ID first, then by user_id (products link via user_id)
  let profile = (await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.id, id)))[0];
  if (!profile) {
    profile = (await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, id)))[0];
  }
  if (!profile) { res.status(404).json({ error: "Seller not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.user_id));

  const products = await db.select().from(productsTable).where(and(eq(productsTable.seller_id, profile.user_id), eq(productsTable.status, "active"))).orderBy(desc(productsTable.created_at)).limit(20);
  const services = await db.select().from(servicesTable).where(and(eq(servicesTable.seller_id, profile.user_id), eq(servicesTable.status, "active"))).orderBy(desc(servicesTable.created_at)).limit(20);

  // Build product/service items with seller fields populated from the profile we already have
  const buildItem = (item: typeof productsTable.$inferSelect | typeof servicesTable.$inferSelect, isProduct: boolean) => {
    const base = {
      seller_id: profile.user_id,
      seller_name: profile.business_name,
      seller_city: profile.city,
    };
    if (isProduct) {
      const p = item as typeof productsTable.$inferSelect;
      return { ...base, id: p.id, category_id: p.category_id, category_name: "", title: p.title, description: p.description, price_min: p.price_min !== null ? parseFloat(p.price_min) : null, price_max: p.price_max !== null ? parseFloat(p.price_max) : null, unit: p.unit, images: p.images ?? [], status: p.status, is_featured: p.is_featured, tags: p.tags ?? [], created_at: p.created_at.toISOString() };
    } else {
      const s = item as typeof servicesTable.$inferSelect;
      return { ...base, id: s.id, category_id: s.category_id, category_name: "", title: s.title, description: s.description, price_min: s.price_min !== null ? parseFloat(s.price_min) : null, price_max: s.price_max !== null ? parseFloat(s.price_max) : null, price_unit: s.price_unit, images: s.images ?? [], status: s.status as "active" | "inactive", is_featured: s.is_featured, tags: s.tags ?? [], created_at: s.created_at.toISOString() };
    }
  };

  res.json({
    id: profile.id,
    user_id: profile.user_id,
    user_name: user?.name ?? "Unknown",
    business_name: profile.business_name,
    business_description: profile.business_description ?? null,
    gst_number: profile.gst_number,
    city: profile.city,
    state: profile.state,
    products: products.map(p => buildItem(p, true)),
    services: services.map(s => buildItem(s, false)),
    created_at: profile.created_at.toISOString(),
  });
});

export default router;
