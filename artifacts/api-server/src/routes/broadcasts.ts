import { Router, type IRouter } from "express";
import { eq, sql, and, desc } from "drizzle-orm";
import { db, broadcastsTable, broadcastResponsesTable, usersTable, sellerProfilesTable, categoriesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function buildBroadcast(b: typeof broadcastsTable.$inferSelect, includeResponses = false) {
  const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, b.buyer_id));
  const [category] = b.category_id ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, b.category_id)) : [null];

  const out: Record<string, unknown> = {
    id: b.id,
    buyer_id: b.buyer_id,
    buyer_name: b.buyer_name,
    buyer_email: b.buyer_email ?? null,
    category_id: b.category_id ?? null,
    category_name: category?.name ?? null,
    title: b.title,
    description: b.description,
    quantity: b.quantity ?? null,
    unit: b.unit ?? null,
    budget: b.budget !== null ? parseFloat(b.budget as string) : null,
    deadline: b.deadline ?? null,
    status: b.status,
    created_at: b.created_at.toISOString(),
  };

  if (includeResponses) {
    const responses = await db.select().from(broadcastResponsesTable).where(eq(broadcastResponsesTable.broadcast_id, b.id)).orderBy(desc(broadcastResponsesTable.created_at));
    out.responses = responses.map(r => ({
      id: r.id,
      broadcast_id: r.broadcast_id,
      seller_id: r.seller_id,
      seller_business_name: r.seller_business_name,
      message: r.message,
      price_offer: r.price_offer !== null ? parseFloat(r.price_offer as string) : null,
      created_at: r.created_at.toISOString(),
    }));
    const [{ count: response_count }] = await db.select({ count: sql<number>`count(*)::int` }).from(broadcastResponsesTable).where(eq(broadcastResponsesTable.broadcast_id, b.id));
    out.response_count = response_count;
  } else {
    const [{ count: response_count }] = await db.select({ count: sql<number>`count(*)::int` }).from(broadcastResponsesTable).where(eq(broadcastResponsesTable.broadcast_id, b.id));
    out.response_count = response_count;
  }

  return out;
}

// GET /broadcasts
router.get("/broadcasts", async (req, res): Promise<void> => {
  const { category_id, status = "open", page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(broadcastsTable.status, status as "open" | "closed")];
  if (category_id) conditions.push(eq(broadcastsTable.category_id, parseInt(category_id, 10)));

  const where = and(...conditions);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(broadcastsTable).where(where);
  const rows = await db.select().from(broadcastsTable).where(where).orderBy(desc(broadcastsTable.created_at)).limit(limitNum).offset(offset);
  const items = await Promise.all(rows.map(b => buildBroadcast(b, false)));
  res.json({ items, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
});

// POST /broadcasts  (buyer only)
router.post("/broadcasts", requireAuth, async (req, res): Promise<void> => {
  if (req.session.role !== "buyer") { res.status(403).json({ error: "Only buyers can post requirements" }); return; }

  const { title, description, category_id, quantity, unit, budget, deadline } = req.body;
  if (!title?.trim() || !description?.trim()) {
    res.status(400).json({ error: "title and description are required" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [b] = await db.insert(broadcastsTable).values({
    buyer_id: req.session.userId!,
    buyer_name: user.name,
    buyer_email: user.email ?? null,
    category_id: category_id ? parseInt(category_id, 10) : null,
    title: title.trim(),
    description: description.trim(),
    quantity: quantity ?? null,
    unit: unit ?? null,
    budget: budget != null ? String(budget) : null,
    deadline: deadline ?? null,
    status: "open",
  }).returning();

  res.status(201).json(await buildBroadcast(b, false));
});

// GET /broadcasts/:id
router.get("/broadcasts/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [b] = await db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id));
  if (!b) { res.status(404).json({ error: "Broadcast not found" }); return; }

  res.json(await buildBroadcast(b, true));
});

// POST /broadcasts/:id/respond  (seller only)
router.post("/broadcasts/:id/respond", requireAuth, async (req, res): Promise<void> => {
  if (req.session.role !== "seller") { res.status(403).json({ error: "Only sellers can respond to broadcasts" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [b] = await db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id));
  if (!b) { res.status(404).json({ error: "Broadcast not found" }); return; }
  if (b.status === "closed") { res.status(400).json({ error: "This broadcast requirement is closed" }); return; }

  const { message, price_offer } = req.body;
  if (!message?.trim()) { res.status(400).json({ error: "message is required" }); return; }

  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, req.session.userId!));
  if (!profile || profile.verification_status !== "approved") {
    res.status(403).json({ error: "Your seller account must be approved to respond" }); return;
  }

  const [r] = await db.insert(broadcastResponsesTable).values({
    broadcast_id: id,
    seller_id: req.session.userId!,
    seller_business_name: profile.business_name,
    message: message.trim(),
    price_offer: price_offer != null ? String(price_offer) : null,
  }).returning();

  res.status(201).json({
    id: r.id,
    broadcast_id: r.broadcast_id,
    seller_id: r.seller_id,
    seller_business_name: r.seller_business_name,
    message: r.message,
    price_offer: r.price_offer !== null ? parseFloat(r.price_offer as string) : null,
    created_at: r.created_at.toISOString(),
  });
});

// PATCH /broadcasts/:id/close  (buyer only, own broadcast)
router.patch("/broadcasts/:id/close", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [b] = await db.select().from(broadcastsTable).where(eq(broadcastsTable.id, id));
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  if (b.buyer_id !== req.session.userId && req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [updated] = await db.update(broadcastsTable).set({ status: "closed" }).where(eq(broadcastsTable.id, id)).returning();
  res.json(await buildBroadcast(updated, false));
});

export default router;
