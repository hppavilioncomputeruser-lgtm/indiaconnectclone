import bcrypt from "bcryptjs";
import { db, usersTable, sellerProfilesTable, productsTable, servicesTable, inquiriesTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db.insert(usersTable).values({ name: "Admin", email: "admin@indiaconnect.in", password_hash: adminHash, role: "admin" }).onConflictDoNothing().returning();
  if (admin) console.log("Admin created:", admin.id);

  // Seller 1 - Metal Trades
  const s1Hash = await bcrypt.hash("seller123", 10);
  let [seller1User] = await db.select().from(usersTable).where(eq(usersTable.email, "rajesh@metaltrades.in"));
  if (!seller1User) {
    [seller1User] = await db.insert(usersTable).values({ name: "Rajesh Kumar", email: "rajesh@metaltrades.in", phone: "9876543210", password_hash: s1Hash, role: "seller" }).returning();
  }
  const [seller1Profile] = await db.insert(sellerProfilesTable).values({
    user_id: seller1User.id,
    business_name: "Metal Trades India Pvt Ltd",
    business_description: "Leading manufacturer of industrial metal components and machinery parts with 20+ years of experience.",
    aadhaar_last4: "8821",
    gst_number: "27AABCT3518Q1ZV",
    verification_status: "approved",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  }).onConflictDoNothing().returning();
  if (seller1Profile) console.log("Seller1 profile created:", seller1Profile.id);

  // Seller 2 - Textile
  const s2Hash = await bcrypt.hash("seller123", 10);
  let [seller2User] = await db.select().from(usersTable).where(eq(usersTable.email, "priya@cottonfabrics.in"));
  if (!seller2User) {
    [seller2User] = await db.insert(usersTable).values({ name: "Priya Sharma", email: "priya@cottonfabrics.in", phone: "9876543220", password_hash: s2Hash, role: "seller" }).returning();
  }
  const [seller2Profile] = await db.insert(sellerProfilesTable).values({
    user_id: seller2User.id,
    business_name: "Cotton Fabrics Exports",
    business_description: "Premium quality cotton fabrics and garments for B2B buyers, MOQ flexible, pan-India delivery.",
    aadhaar_last4: "4453",
    gst_number: "24AAACV8765B1ZK",
    verification_status: "approved",
    city: "Surat",
    state: "Gujarat",
    pincode: "395003",
  }).onConflictDoNothing().returning();
  if (seller2Profile) console.log("Seller2 profile created:", seller2Profile.id);

  // Seller 3 - IT Services (pending)
  const s3Hash = await bcrypt.hash("seller123", 10);
  let [seller3User] = await db.select().from(usersTable).where(eq(usersTable.email, "arjun@techsolutions.in"));
  if (!seller3User) {
    [seller3User] = await db.insert(usersTable).values({ name: "Arjun Singh", email: "arjun@techsolutions.in", phone: "9876543230", password_hash: s3Hash, role: "seller" }).returning();
  }
  const [seller3Profile] = await db.insert(sellerProfilesTable).values({
    user_id: seller3User.id,
    business_name: "TechSolutions India",
    business_description: "Custom software development, ERP implementation, and IT consulting for SMEs.",
    aadhaar_last4: "7762",
    gst_number: "07AADCS1234B1ZD",
    verification_status: "pending",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  }).onConflictDoNothing().returning();
  if (seller3Profile) console.log("Seller3 profile created (pending):", seller3Profile.id);

  // Buyer user
  const buyerHash = await bcrypt.hash("buyer123", 10);
  let [buyerUser] = await db.select().from(usersTable).where(eq(usersTable.email, "amit@example.com"));
  if (!buyerUser) {
    [buyerUser] = await db.insert(usersTable).values({ name: "Amit Verma", email: "amit@example.com", phone: "9876543240", password_hash: buyerHash, role: "buyer" }).returning();
  }

  // Get category IDs
  const [machineryCategory] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, "industrial-machinery"));
  const [textileCategory] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, "textile-apparel"));
  const [itCategory] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, "it-services-software"));
  const [constructionCategory] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, "construction-materials"));

  if (!machineryCategory || !textileCategory || !itCategory || !constructionCategory) {
    console.error("Categories not found! Run category seed first.");
    return;
  }

  // Products for Seller 1 (Metal Trades)
  const products1 = await db.insert(productsTable).values([
    {
      seller_id: seller1User.id,
      category_id: machineryCategory.id,
      title: "Industrial CNC Lathe Machine",
      description: "Heavy-duty CNC lathe machine with 2000mm turning diameter, suitable for large industrial components. Features automatic tool changer, high-precision spindle, and full warranty. Ideal for automotive, aerospace, and heavy engineering industries.",
      price_min: "250000",
      price_max: "850000",
      unit: "piece",
      images: [],
      status: "active",
      is_featured: true,
      tags: ["cnc", "lathe", "machine", "industrial"],
    },
    {
      seller_id: seller1User.id,
      category_id: machineryCategory.id,
      title: "Mild Steel Round Bars",
      description: "IS 2062 grade mild steel round bars available in diameters 8mm to 100mm. Bulk orders available with competitive pricing. Pan India delivery within 7 days. Minimum order quantity 1 metric tonne.",
      price_min: "52000",
      price_max: "58000",
      unit: "metric tonne",
      images: [],
      status: "active",
      is_featured: true,
      tags: ["steel", "round bar", "ms bar", "metal"],
    },
    {
      seller_id: seller1User.id,
      category_id: constructionCategory.id,
      title: "Industrial Bolts and Fasteners Set",
      description: "High-tensile structural bolts, nuts, and washers. Grade 8.8 and 10.9 available. Various sizes from M6 to M48. ISO certified manufacturing. Used in construction, bridges, and heavy structures.",
      price_min: "80",
      price_max: "500",
      unit: "kg",
      images: [],
      status: "active",
      is_featured: false,
      tags: ["bolts", "fasteners", "hardware", "construction"],
    },
  ]).onConflictDoNothing().returning();
  console.log("Products for seller1:", products1.length);

  // Products for Seller 2 (Cotton Fabrics)
  const products2 = await db.insert(productsTable).values([
    {
      seller_id: seller2User.id,
      category_id: textileCategory.id,
      title: "Premium Egyptian Cotton Fabric",
      description: "100% pure Egyptian long-staple cotton fabric, 200 thread count, suitable for high-end garment manufacturing. Available in 58 inch width, natural and bleached options. GST invoice provided.",
      price_min: "120",
      price_max: "180",
      unit: "metre",
      images: [],
      status: "active",
      is_featured: true,
      tags: ["cotton", "fabric", "textile", "garment"],
    },
    {
      seller_id: seller2User.id,
      category_id: textileCategory.id,
      title: "Ready-Made Cotton T-Shirts (Bulk)",
      description: "Round neck, half sleeve cotton t-shirts for bulk buyers. Sizes S, M, L, XL, XXL. Can be customized with branding/logo printing. MOQ: 100 pieces per colour. BIS certified.",
      price_min: "65",
      price_max: "120",
      unit: "piece",
      images: [],
      status: "active",
      is_featured: true,
      tags: ["t-shirt", "cotton", "bulk", "garment"],
    },
  ]).onConflictDoNothing().returning();
  console.log("Products for seller2:", products2.length);

  // Services for Seller 1
  const services1 = await db.insert(servicesTable).values([
    {
      seller_id: seller1User.id,
      category_id: machineryCategory.id,
      title: "CNC Machining & Fabrication Service",
      description: "Custom CNC machining services for metal components. Capabilities: turning, milling, drilling, grinding. Materials: steel, aluminium, brass, titanium. ISO 9001:2015 certified. 3-day turnaround for standard components.",
      price_min: "500",
      price_max: "50000",
      price_unit: "per_project",
      images: [],
      status: "active",
      is_featured: true,
      tags: ["cnc", "machining", "fabrication"],
    },
  ]).onConflictDoNothing().returning();
  console.log("Services for seller1:", services1.length);

  // Services for Seller 3 (IT - pending, so won't appear in public listings)
  const services3 = await db.insert(servicesTable).values([
    {
      seller_id: seller3User.id,
      category_id: itCategory.id,
      title: "Custom ERP Development & Implementation",
      description: "End-to-end ERP solutions for manufacturing and trading companies. Modules: inventory, accounts, HR, production planning. Cloud or on-premise deployment. 6-month free support post-launch.",
      price_min: "150000",
      price_max: "1000000",
      price_unit: "per_project",
      images: [],
      status: "active",
      is_featured: false,
      tags: ["erp", "software", "development", "it"],
    },
  ]).onConflictDoNothing().returning();
  console.log("Services for seller3:", services3.length);

  // Sample inquiries from buyer
  if (products1.length > 0) {
    await db.insert(inquiriesTable).values([
      {
        buyer_id: buyerUser.id,
        buyer_name: "Amit Verma",
        buyer_email: "amit@example.com",
        seller_id: seller1User.id,
        product_id: products1[0]?.id ?? null,
        listing_title: "Industrial CNC Lathe Machine",
        listing_type: "product",
        message: "We are interested in purchasing 2 units of the CNC Lathe machine for our workshop in Pune. Please share detailed specifications, installation support availability, and best bulk price. Also confirm lead time.",
        quantity: "2",
        budget: "1200000",
        status: "pending",
      },
      {
        buyer_id: buyerUser.id,
        buyer_name: "Amit Verma",
        buyer_email: "amit@example.com",
        seller_id: seller2User.id,
        product_id: products2[0]?.id ?? null,
        listing_title: "Premium Egyptian Cotton Fabric",
        listing_type: "product",
        message: "Looking to source 500 metres of Egyptian cotton fabric monthly. Can you provide samples and confirm if you can do custom dyeing as per Pantone shades?",
        quantity: "500",
        budget: "75000",
        status: "responded",
        seller_response: "Thank you for your inquiry! Yes, we can supply 500 metres monthly with custom dyeing. Sample will be dispatched within 3 days. Our pricing for 500m+ orders is Rs 115/metre. Please share your Pantone codes.",
      },
    ]).onConflictDoNothing();
    console.log("Inquiries seeded");
  }

  console.log("\n=== SEED COMPLETE ===");
  console.log("Accounts created:");
  console.log("  Admin:  admin@indiaconnect.in / admin123");
  console.log("  Seller: rajesh@metaltrades.in / seller123 (approved)");
  console.log("  Seller: priya@cottonfabrics.in / seller123 (approved)");
  console.log("  Seller: arjun@techsolutions.in / seller123 (pending)");
  console.log("  Buyer:  amit@example.com / buyer123");

  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
