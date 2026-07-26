import { Router, type IRouter } from "express";
import { eq, sql, and, desc } from "drizzle-orm";
import { db, inquiriesTable, usersTable, sellerProfilesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function buildInquiry(inq: typeof inquiriesTable.$inferSelect, sellerName?: string) {
  return {
    id: inq.id,
    buyer_id: inq.buyer_id ?? null,
    buyer_name: inq.buyer_name,
    buyer_email: inq.buyer_email ?? null,
    buyer_phone: inq.buyer_phone ?? null,
    seller_id: inq.seller_id,
    seller_name: sellerName ?? "Unknown",
    product_id: inq.product_id ?? null,
    service_id: inq.service_id ?? null,
    listing_title: inq.listing_title,
    listing_type: inq.listing_type,
    message: inq.message,
    quantity: inq.quantity !== null ? parseFloat(inq.quantity) : null,
    budget: inq.budget !== null ? parseFloat(inq.budget) : null,
    status: inq.status,
    seller_response: inq.seller_response ?? null,
    created_at: inq.created_at.toISOString(),
  };
}

async function enrichInquiry(inq: typeof inquiriesTable.$inferSelect) {
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, inq.seller_id));
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, inq.seller_id));
  const sellerName = profile?.business_name ?? seller?.name ?? "Unknown";
  return buildInquiry(inq, sellerName);
}

// GET /inquiries
router.get("/inquiries", requireAuth, async (req, res): Promise<void> => {
  const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;
  const userId = req.session.userId!;
  const role = req.session.role!;

  const conditions = [];
  if (role === "buyer") {
    conditions.push(eq(inquiriesTable.buyer_id, userId));
  } else if (role === "seller") {
    conditions.push(eq(inquiriesTable.seller_id, userId));
  }
  // admin sees all

  if (status) {
    conditions.push(eq(inquiriesTable.status, status as "pending" | "responded" | "closed"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(inquiriesTable).where(where);
  const inquiries = await db.select().from(inquiriesTable).where(where).orderBy(desc(inquiriesTable.created_at)).limit(limitNum).offset(offset);

  const items = await Promise.all(inquiries.map(enrichInquiry));
  res.json({ items, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) });
});

// POST /inquiries
router.post("/inquiries", async (req, res): Promise<void> => {
  const { seller_id, product_id, service_id, listing_title, listing_type, buyer_name, buyer_contact, message, quantity, budget } = req.body;

  if (!seller_id || !listing_title || !listing_type || !buyer_name || !buyer_contact || !message) {
    res.status(400).json({ error: "seller_id, listing_title, listing_type, buyer_name, buyer_contact, and message are required" });
    return;
  }

  // Detect if buyer_contact is email or phone
  const isEmail = buyer_contact.includes("@");
  const buyer_email = isEmail ? buyer_contact : null;
  const buyer_phone = !isEmail ? buyer_contact : null;
  const buyer_id = req.session.userId ?? null;

  const [inq] = await db.insert(inquiriesTable).values({
    buyer_id,
    buyer_name,
    buyer_email,
    buyer_phone,
    seller_id: parseInt(seller_id, 10),
    product_id: product_id ? parseInt(product_id, 10) : null,
    service_id: service_id ? parseInt(service_id, 10) : null,
    listing_title,
    listing_type: listing_type as "product" | "service",
    message,
    quantity: quantity != null ? String(quantity) : null,
    budget: budget != null ? String(budget) : null,
    status: "pending",
  }).returning();

  res.status(201).json(await enrichInquiry(inq));
});

// GET /inquiries/:id
router.get("/inquiries/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [inq] = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id));
  if (!inq) { res.status(404).json({ error: "Inquiry not found" }); return; }

  // Check access
  const userId = req.session.userId!;
  const role = req.session.role!;
  if (role !== "admin" && inq.buyer_id !== userId && inq.seller_id !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  res.json(await enrichInquiry(inq));
});

// PATCH /inquiries/:id
router.patch("/inquiries/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [inq] = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id));
  if (!inq) { res.status(404).json({ error: "Inquiry not found" }); return; }

  const userId = req.session.userId!;
  const role = req.session.role!;
  if (role !== "admin" && inq.buyer_id !== userId && inq.seller_id !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { status, seller_response } = req.body;
  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (seller_response !== undefined) updateData.seller_response = seller_response;

  const [updated] = await db.update(inquiriesTable).set(updateData).where(eq(inquiriesTable.id, id)).returning();
  res.json(await enrichInquiry(updated));
});

export default router;
