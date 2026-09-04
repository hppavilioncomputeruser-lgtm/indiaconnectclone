import { Router, type IRouter } from "express";
import { eq, sql, and, ilike, desc } from "drizzle-orm";
import { db, servicesTable, usersTable, sellerProfilesTable, categoriesTable } from "@workspace/db";
import { requireAuth, requireSeller } from "../middlewares/auth";

const router: IRouter = Router();

async function buildService(service: typeof servicesTable.$inferSelect) {
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, service.seller_id));
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, service.seller_id));
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, service.category_id));
  return {
    id: service.id,
    seller_id: service.seller_id,
    seller_profile_id: profile?.id ?? null,
    seller_name: profile?.business_name ?? seller?.name ?? "Unknown",
    seller_city: profile?.city ?? "",
    category_id: service.category_id,
    category_name: category?.name ?? "Unknown",
    title: service.title,
    description: service.description,
    price_min: service.price_min !== null ? parseFloat(service.price_min) : null,
    price_max: service.price_max !== null ? parseFloat(service.price_max) : null,
    price_unit: service.price_unit,
    images: service.images ?? [],
    status: service.status as "active" | "inactive",
    is_featured: service.is_featured,
    tags: service.tags ?? [],
    created_at: service.created_at.toISOString(),
  };
}

// GET /services
router.get("/services", async (req, res): Promise<void> => {
  const { q, category_id, seller_id, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(servicesTable.status, "active")];
  if (q) conditions.push(ilike(servicesTable.title, `%${q}%`));
  if (category_id) conditions.push(eq(servicesTable.category_id, parseInt(category_id, 10)));
  if (seller_id) conditions.push(eq(servicesTable.seller_id, parseInt(seller_id, 10)));

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(servicesTable).where(where);
  const services = await db.select().from(servicesTable).where(where).orderBy(desc(servicesTable.created_at)).limit(limitNum).offset(offset);

  const items = await Promise.all(services.map(buildService));
  res.json({ items, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
});

// GET /services/featured
router.get("/services/featured", async (req, res): Promise<void> => {
  const { limit = "12" } = req.query as Record<string, string>;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const services = await db.select().from(servicesTable)
    .where(and(eq(servicesTable.status, "active"), eq(servicesTable.is_featured, true)))
    .orderBy(desc(servicesTable.created_at))
    .limit(limitNum);

  let result = services;
  if (result.length < limitNum) {
    const more = await db.select().from(servicesTable)
      .where(eq(servicesTable.status, "active"))
      .orderBy(desc(servicesTable.created_at))
      .limit(limitNum);
    const ids = new Set(result.map(s => s.id));
    result = [...result, ...more.filter(s => !ids.has(s.id))].slice(0, limitNum);
  }

  const items = await Promise.all(result.map(buildService));
  res.json(items);
});

// POST /services
router.post("/services", requireSeller, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, userId));
  if (!profile || profile.verification_status !== "approved") {
    res.status(403).json({ error: "Your seller account must be approved before creating listings" });
    return;
  }

  const { category_id, title, description, price_min, price_max, price_unit, images, tags, is_featured } = req.body;
  if (!category_id || !title || !description || !price_unit) {
    res.status(400).json({ error: "category_id, title, description, and price_unit are required" });
    return;
  }

  const [service] = await db.insert(servicesTable).values({
    seller_id: userId,
    category_id: parseInt(category_id, 10),
    title,
    description,
    price_min: price_min != null ? String(price_min) : null,
    price_max: price_max != null ? String(price_max) : null,
    price_unit: price_unit ?? "negotiable",
    images: images ?? [],
    tags: tags ?? [],
    is_featured: is_featured ?? false,
    status: "active",
  }).returning();

  res.status(201).json(await buildService(service));
});

// GET /services/:id
router.get("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }

  res.json(await buildService(service));
});

// PATCH /services/:id
router.patch("/services/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }

  if (service.seller_id !== req.session.userId && req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { category_id, title, description, price_min, price_max, price_unit, images, tags, status, is_featured } = req.body;
  const updateData: Record<string, unknown> = {};
  if (category_id !== undefined) updateData.category_id = parseInt(category_id, 10);
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (price_min !== undefined) updateData.price_min = price_min != null ? String(price_min) : null;
  if (price_max !== undefined) updateData.price_max = price_max != null ? String(price_max) : null;
  if (price_unit !== undefined) updateData.price_unit = price_unit;
  if (images !== undefined) updateData.images = images;
  if (tags !== undefined) updateData.tags = tags;
  if (status !== undefined) updateData.status = status;
  if (is_featured !== undefined) updateData.is_featured = is_featured;

  const [updated] = await db.update(servicesTable).set(updateData).where(eq(servicesTable.id, id)).returning();
  res.json(await buildService(updated));
});

// DELETE /services/:id
router.delete("/services/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }

  if (service.seller_id !== req.session.userId && req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.json({ success: true, message: "Service deleted" });
});

export default router;
