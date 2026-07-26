import { Router, type IRouter } from "express";
import { eq, sql, and, desc } from "drizzle-orm";
import { db, usersTable, sellerProfilesTable, productsTable, servicesTable, inquiriesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichInquiry(inq: typeof inquiriesTable.$inferSelect) {
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, inq.seller_id));
  const [profile] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, inq.seller_id));
  return {
    id: inq.id,
    buyer_id: inq.buyer_id ?? null,
    buyer_name: inq.buyer_name,
    buyer_email: inq.buyer_email ?? null,
    buyer_phone: inq.buyer_phone ?? null,
    seller_id: inq.seller_id,
    seller_name: profile?.business_name ?? seller?.name ?? "Unknown",
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

// GET /dashboard/seller
router.get("/dashboard/seller", requireAuth, async (req, res): Promise<void> => {
  if (req.session.role !== "seller" && req.session.role !== "admin") {
    res.status(403).json({ error: "Seller access required" }); return;
  }
  const userId = req.session.userId!;

  const [{ total_products }] = await db.select({ total_products: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.seller_id, userId));
  const [{ active_products }] = await db.select({ active_products: sql<number>`count(*)::int` }).from(productsTable).where(and(eq(productsTable.seller_id, userId), eq(productsTable.status, "active")));
  const [{ total_services }] = await db.select({ total_services: sql<number>`count(*)::int` }).from(servicesTable).where(eq(servicesTable.seller_id, userId));
  const [{ active_services }] = await db.select({ active_services: sql<number>`count(*)::int` }).from(servicesTable).where(and(eq(servicesTable.seller_id, userId), eq(servicesTable.status, "active")));
  const [{ total_inquiries }] = await db.select({ total_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(eq(inquiriesTable.seller_id, userId));
  const [{ pending_inquiries }] = await db.select({ pending_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(and(eq(inquiriesTable.seller_id, userId), eq(inquiriesTable.status, "pending")));

  const recentInquiriesRaw = await db.select().from(inquiriesTable).where(eq(inquiriesTable.seller_id, userId)).orderBy(desc(inquiriesTable.created_at)).limit(5);
  const recent_inquiries = await Promise.all(recentInquiriesRaw.map(enrichInquiry));

  res.json({ total_products, active_products, total_services, active_services, total_inquiries, pending_inquiries, recent_inquiries });
});

// GET /dashboard/buyer
router.get("/dashboard/buyer", requireAuth, async (req, res): Promise<void> => {
  if (req.session.role !== "buyer" && req.session.role !== "admin") {
    res.status(403).json({ error: "Buyer access required" }); return;
  }
  const userId = req.session.userId!;

  const [{ total_inquiries }] = await db.select({ total_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(eq(inquiriesTable.buyer_id, userId));
  const [{ pending_inquiries }] = await db.select({ pending_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(and(eq(inquiriesTable.buyer_id, userId), eq(inquiriesTable.status, "pending")));
  const [{ responded_inquiries }] = await db.select({ responded_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(and(eq(inquiriesTable.buyer_id, userId), eq(inquiriesTable.status, "responded")));
  const [{ closed_inquiries }] = await db.select({ closed_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(and(eq(inquiriesTable.buyer_id, userId), eq(inquiriesTable.status, "closed")));

  const recentInquiriesRaw = await db.select().from(inquiriesTable).where(eq(inquiriesTable.buyer_id, userId)).orderBy(desc(inquiriesTable.created_at)).limit(5);
  const recent_inquiries = await Promise.all(recentInquiriesRaw.map(enrichInquiry));

  res.json({ total_inquiries, pending_inquiries, responded_inquiries, closed_inquiries, recent_inquiries });
});

// GET /dashboard/admin
router.get("/dashboard/admin", requireAuth, async (req, res): Promise<void> => {
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Admin access required" }); return;
  }

  const [{ total_users }] = await db.select({ total_users: sql<number>`count(*)::int` }).from(usersTable);
  const [{ total_buyers }] = await db.select({ total_buyers: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "buyer"));
  const [{ total_sellers }] = await db.select({ total_sellers: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "seller"));
  const [{ pending_sellers }] = await db.select({ pending_sellers: sql<number>`count(*)::int` }).from(sellerProfilesTable).where(eq(sellerProfilesTable.verification_status, "pending"));
  const [{ approved_sellers }] = await db.select({ approved_sellers: sql<number>`count(*)::int` }).from(sellerProfilesTable).where(eq(sellerProfilesTable.verification_status, "approved"));
  const [{ rejected_sellers }] = await db.select({ rejected_sellers: sql<number>`count(*)::int` }).from(sellerProfilesTable).where(eq(sellerProfilesTable.verification_status, "rejected"));
  const [{ total_products }] = await db.select({ total_products: sql<number>`count(*)::int` }).from(productsTable);
  const [{ active_products }] = await db.select({ active_products: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.status, "active"));
  const [{ total_services }] = await db.select({ total_services: sql<number>`count(*)::int` }).from(servicesTable);
  const [{ active_services }] = await db.select({ active_services: sql<number>`count(*)::int` }).from(servicesTable).where(eq(servicesTable.status, "active"));
  const [{ total_inquiries }] = await db.select({ total_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable);
  const [{ pending_inquiries }] = await db.select({ pending_inquiries: sql<number>`count(*)::int` }).from(inquiriesTable).where(eq(inquiriesTable.status, "pending"));

  res.json({ total_users, total_buyers, total_sellers, pending_sellers, approved_sellers, rejected_sellers, total_products, active_products, total_services, active_services, total_inquiries, pending_inquiries });
});

export default router;
