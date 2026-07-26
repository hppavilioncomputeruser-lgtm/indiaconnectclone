import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable, servicesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /categories
router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  const result = await Promise.all(
    categories.map(async (cat) => {
      const [{ count: product_count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(productsTable)
        .where(eq(productsTable.category_id, cat.id));
      const [{ count: service_count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(servicesTable)
        .where(eq(servicesTable.category_id, cat.id));
      return { ...cat, product_count, service_count };
    })
  );

  res.json(result);
});

// GET /categories/:id
router.get("/categories/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [{ count: product_count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.category_id, id));

  const [{ count: service_count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(servicesTable)
    .where(eq(servicesTable.category_id, id));

  res.json({ ...cat, product_count, service_count });
});

export default router;
