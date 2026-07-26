import { Router, type IRouter } from "express";
import { eq, sql, and, ilike, gte, lte, desc } from "drizzle-orm";
import { db, productsTable, usersTable, sellerProfilesTable, categoriesTable } from "@workspace/db";
import { requireAuth, requireSeller } from "../middlewares/auth";

const router: IRouter = Router();

async function buildProduct(product: typeof productsTable.$inferSelect) {
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, product.seller_id));
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, product.seller_id));
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.category_id));
  return {
    id: product.id,
    seller_id: product.seller_id,
    seller_name: profile?.business_name ?? seller?.name ?? "Unknown",
    seller_city: profile?.city ?? "",
    category_id: product.category_id,
    category_name: category?.name ?? "Unknown",
    title: product.title,
    description: product.description,
    price_min: product.price_min !== null ? parseFloat(product.price_min) : null,
    price_max: product.price_max !== null ? parseFloat(product.price_max) : null,
    unit: product.unit,
    images: product.images ?? [],
    status: product.status,
    is_featured: product.is_featured,
    tags: product.tags ?? [],
    created_at: product.created_at.toISOString(),
  };
}

// GET /products
router.get("/products", async (req, res): Promise<void> => {
  const { q, category_id, min_price, max_price, seller_id, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(productsTable.status, "active")];
  if (q) conditions.push(ilike(productsTable.title, `%${q}%`));
  if (category_id) conditions.push(eq(productsTable.category_id, parseInt(category_id, 10)));
  if (seller_id) conditions.push(eq(productsTable.seller_id, parseInt(seller_id, 10)));
  if (min_price) conditions.push(gte(productsTable.price_min, min_price));
  if (max_price) conditions.push(lte(productsTable.price_max, max_price));

  const where = and(...conditions);

  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(productsTable).where(where);
  const products = await db.select().from(productsTable).where(where).orderBy(desc(productsTable.created_at)).limit(limitNum).offset(offset);

  const items = await Promise.all(products.map(buildProduct));
  res.json({ items, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
});

// GET /products/featured
router.get("/products/featured", async (req, res): Promise<void> => {
  const { limit = "12" } = req.query as Record<string, string>;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const products = await db.select().from(productsTable)
    .where(and(eq(productsTable.status, "active"), eq(productsTable.is_featured, true)))
    .orderBy(desc(productsTable.created_at))
    .limit(limitNum);

  // If not enough featured, pad with recent active
  let result = products;
  if (result.length < limitNum) {
    const more = await db.select().from(productsTable)
      .where(eq(productsTable.status, "active"))
      .orderBy(desc(productsTable.created_at))
      .limit(limitNum);
    const ids = new Set(result.map(p => p.id));
    result = [...result, ...more.filter(p => !ids.has(p.id))].slice(0, limitNum);
  }

  const items = await Promise.all(result.map(buildProduct));
  res.json(items);
});

// POST /products
router.post("/products", requireSeller, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  // Check seller is approved
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, userId));
  if (!profile || profile.verification_status !== "approved") {
    res.status(403).json({ error: "Your seller account must be approved before creating listings" });
    return;
  }

  const { category_id, title, description, price_min, price_max, unit, images, tags, is_featured } = req.body;
  if (!category_id || !title || !description || !unit) {
    res.status(400).json({ error: "category_id, title, description, and unit are required" });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    seller_id: userId,
    category_id: parseInt(category_id, 10),
    title,
    description,
    price_min: price_min != null ? String(price_min) : null,
    price_max: price_max != null ? String(price_max) : null,
    unit,
    images: images ?? [],
    tags: tags ?? [],
    is_featured: is_featured ?? false,
    status: "active",
  }).returning();

  res.status(201).json(await buildProduct(product));
});

// GET /products/:id
router.get("/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  res.json(await buildProduct(product));
});

// PATCH /products/:id
router.patch("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  if (product.seller_id !== req.session.userId && req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { category_id, title, description, price_min, price_max, unit, images, tags, status, is_featured } = req.body;
  const updateData: Record<string, unknown> = {};
  if (category_id !== undefined) updateData.category_id = parseInt(category_id, 10);
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (price_min !== undefined) updateData.price_min = price_min != null ? String(price_min) : null;
  if (price_max !== undefined) updateData.price_max = price_max != null ? String(price_max) : null;
  if (unit !== undefined) updateData.unit = unit;
  if (images !== undefined) updateData.images = images;
  if (tags !== undefined) updateData.tags = tags;
  if (status !== undefined) updateData.status = status;
  if (is_featured !== undefined) updateData.is_featured = is_featured;

  const [updated] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
  res.json(await buildProduct(updated));
});

// DELETE /products/:id
router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  if (product.seller_id !== req.session.userId && req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Product deleted" });
});

export default router;
