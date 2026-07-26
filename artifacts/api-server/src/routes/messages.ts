import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, messagesTable, inquiriesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// GET /inquiries/:id/messages
router.get("/inquiries/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [inq] = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id));
  if (!inq) { res.status(404).json({ error: "Inquiry not found" }); return; }

  const userId = req.session.userId!;
  const role = req.session.role!;
  if (role !== "admin" && inq.buyer_id !== userId && inq.seller_id !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.inquiry_id, id)).orderBy(asc(messagesTable.created_at));
  res.json(msgs.map(m => ({
    id: m.id,
    inquiry_id: m.inquiry_id,
    sender_id: m.sender_id,
    sender_role: m.sender_role,
    body: m.body,
    created_at: m.created_at.toISOString(),
  })));
});

// POST /inquiries/:id/messages
router.post("/inquiries/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [inq] = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id));
  if (!inq) { res.status(404).json({ error: "Inquiry not found" }); return; }

  const userId = req.session.userId!;
  const role = req.session.role! as "buyer" | "seller" | "admin";
  if (role !== "admin" && inq.buyer_id !== userId && inq.seller_id !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const { body } = req.body;
  if (!body?.trim()) { res.status(400).json({ error: "body is required" }); return; }

  const senderRole: "buyer" | "seller" = inq.seller_id === userId ? "seller" : "buyer";

  const [msg] = await db.insert(messagesTable).values({
    inquiry_id: id,
    sender_id: userId,
    sender_role: senderRole,
    body: body.trim(),
  }).returning();

  // Update inquiry status when seller replies
  if (senderRole === "seller" && inq.status === "pending") {
    await db.update(inquiriesTable).set({ status: "responded", seller_response: body.trim() }).where(eq(inquiriesTable.id, id));
  }

  res.status(201).json({
    id: msg.id,
    inquiry_id: msg.inquiry_id,
    sender_id: msg.sender_id,
    sender_role: msg.sender_role,
    body: msg.body,
    created_at: msg.created_at.toISOString(),
  });
});

export default router;
