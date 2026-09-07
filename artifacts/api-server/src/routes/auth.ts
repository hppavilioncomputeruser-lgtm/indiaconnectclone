import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db, usersTable, sellerProfilesTable } from "@workspace/db";
import { isValidAadhaar, isValidGST } from "../lib/validation";
import { requireAuth } from "../middlewares/auth";
import { sendEmailVerificationCode } from "../lib/email";

const router: IRouter = Router();

const OTP_TTL_MS = 10 * 60 * 1000;

// OTPs are intentionally short-lived and removed after a successful verification.
const otpStore = new Map<string, { otp: string; expires: number }>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

function buildUserResponse(user: typeof usersTable.$inferSelect, sellerProfile?: typeof sellerProfilesTable.$inferSelect | null) {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role,
    created_at: user.created_at.toISOString(),
    seller_profile: sellerProfile
      ? {
          id: sellerProfile.id,
          user_id: sellerProfile.user_id,
          business_name: sellerProfile.business_name,
          business_description: sellerProfile.business_description ?? null,
          aadhaar_last4: sellerProfile.aadhaar_last4,
          gst_number: sellerProfile.gst_number,
          verification_status: sellerProfile.verification_status,
          rejection_reason: sellerProfile.rejection_reason ?? null,
          city: sellerProfile.city,
          state: sellerProfile.state,
          pincode: sellerProfile.pincode,
          created_at: sellerProfile.created_at.toISOString(),
        }
      : null,
  };
}

// POST /auth/register/buyer
router.post("/auth/register/buyer", async (req, res): Promise<void> => {
  const { name, auth_method, email, password, phone } = req.body;

  if (!name || !auth_method) {
    res.status(400).json({ error: "name and auth_method are required" });
    return;
  }

  if (auth_method === "email") {
    if (!email || !password) {
      res.status(400).json({ error: "email and password required for email auth" });
      return;
    }
    const normalizedEmail = normalizeEmail(email);
    // Verify email OTP
    const { otp } = req.body;
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      res.status(400).json({ error: "Enter the 6-digit verification code sent to your email." });
      return;
    }
    const storedOtp = otpStore.get(`email:${normalizedEmail}`);
    if (!storedOtp) {
      res.status(400).json({ error: "Verification code expired or was not requested. Request a new code." });
      return;
    }
    if (Date.now() > storedOtp.expires) {
      otpStore.delete(`email:${normalizedEmail}`);
      res.status(400).json({ error: "Verification code expired. Request a new code." });
      return;
    }
    if (storedOtp.otp !== otp) {
      res.status(400).json({ error: "Invalid verification code. Check the code and try again." });
      return;
    }
    otpStore.delete(`email:${normalizedEmail}`);
    // Check duplicate
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email: normalizedEmail, password_hash, role: "buyer" }).returning();
    req.session.userId = user.id;
    req.session.role = "buyer";
    res.status(201).json({ user: buildUserResponse(user, null), message: "Registered successfully" });
    return;
  }

  if (auth_method === "phone") {
    if (!phone) {
      res.status(400).json({ error: "phone required for phone auth" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
    if (existing.length > 0) {
      res.status(409).json({ error: "Phone already in use" });
      return;
    }
    const [user] = await db.insert(usersTable).values({ name, phone, role: "buyer" }).returning();
    req.session.userId = user.id;
    req.session.role = "buyer";
    res.status(201).json({ user: buildUserResponse(user, null), message: "Registered successfully" });
    return;
  }

  res.status(400).json({ error: "Invalid auth_method" });
});

// POST /auth/register/seller
router.post("/auth/register/seller", async (req, res): Promise<void> => {
  const {
    name, email, password, phone,
    business_name, business_description,
    aadhaar_number, gst_number,
    city, state, pincode,
  } = req.body;

  if (!name || !email || !password || !business_name || !aadhaar_number || !gst_number || !city || !state || !pincode) {
    res.status(400).json({ error: "All required fields must be provided" });
    return;
  }

  if (!isValidAadhaar(aadhaar_number)) {
    res.status(400).json({ error: "Invalid Aadhaar number. Must be exactly 12 digits." });
    return;
  }

  if (!isValidGST(gst_number)) {
    res.status(400).json({ error: "Invalid GST number. Must be 15-character GSTIN format (e.g. 22AAAAA0000A1Z5)." });
    return;
  }

  // Check duplicates
  const existingUser = await db.select().from(usersTable).where(
    or(eq(usersTable.email, email), ...(phone ? [eq(usersTable.phone, phone)] : []))
  );
  if (existingUser.length > 0) {
    res.status(409).json({ error: "Email or phone already in use" });
    return;
  }

  const existingGst = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.gst_number, gst_number.toUpperCase()));
  if (existingGst.length > 0) {
    res.status(409).json({ error: "GST number already registered" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, phone: phone || null, password_hash, role: "seller" }).returning();

  const [profile] = await db.insert(sellerProfilesTable).values({
    user_id: user.id,
    business_name,
    business_description: business_description || null,
    aadhaar_last4: aadhaar_number.slice(-4),
    gst_number: gst_number.toUpperCase(),
    verification_status: "pending",
    city,
    state,
    pincode,
  }).returning();

  req.session.userId = user.id;
  req.session.role = "seller";

  res.status(201).json({
    user: buildUserResponse(user, profile),
    message: "Seller registered. Pending admin approval.",
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !user.password_hash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  let profile = null;
  if (user.role === "seller") {
    const [p] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, user.id));
    profile = p ?? null;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ user: buildUserResponse(user, profile), message: "Logged in" });
});

// POST /auth/request-email-otp  (for email signup verification)
router.post("/auth/request-email-otp", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  const otp = generateOtp();

  if (process.env.NODE_ENV === "production") {
    try {
      await sendEmailVerificationCode(normalizedEmail, otp);
    } catch (error) {
      req.log.error({ err: error }, "Failed to deliver email verification code");
      res.status(502).json({ error: "We could not deliver your verification email. Please try again." });
      return;
    }
  }

  otpStore.set(`email:${normalizedEmail}`, { otp, expires: Date.now() + OTP_TTL_MS });

  res.json(
    process.env.NODE_ENV === "production"
      ? { message: "Verification code sent. Check your email." }
      : { message: "OTP sent to your email (simulated)", dev_otp: otp },
  );
});

// POST /auth/verify-email-otp
router.post("/auth/verify-email-otp", async (req, res): Promise<void> => {
  const { email, otp } = req.body;
  if (typeof email !== "string" || !email.trim() || typeof otp !== "string") {
    res.status(400).json({ error: "email and verification code are required" });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const storedOtp = otpStore.get(`email:${normalizedEmail}`);
  if (!storedOtp) {
    res.status(400).json({ error: "Verification code expired or was not requested. Request a new code." });
    return;
  }
  if (Date.now() > storedOtp.expires) {
    otpStore.delete(`email:${normalizedEmail}`);
    res.status(400).json({ error: "Verification code expired. Request a new code." });
    return;
  }
  if (!/^\d{6}$/.test(otp) || storedOtp.otp !== otp) {
    res.status(400).json({ error: "Invalid verification code. Check the code and try again." });
    return;
  }

  res.json({ message: "Email verified. You can now create your account." });
});

// POST /auth/request-otp
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: "phone is required" });
    return;
  }

  // Generate a 6-digit OTP
  const otp = generateOtp();
  otpStore.set(phone, { otp, expires: Date.now() + OTP_TTL_MS }); // 10 min

  req.log.info({ phone }, "OTP generated (simulated)");

  res.json({
    message: "OTP sent to your phone (simulated)",
    dev_otp: process.env.NODE_ENV !== "production" ? otp : null,
  });
});

// POST /auth/verify-otp
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: "phone and otp are required" });
    return;
  }

  const stored = otpStore.get(phone);
  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  otpStore.delete(phone);

  // Find or create user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    const [newUser] = await db.insert(usersTable).values({ name: "User", phone, role: "buyer" }).returning();
    user = newUser;
  }

  let profile = null;
  if (user.role === "seller") {
    const [p] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, user.id));
    profile = p ?? null;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ user: buildUserResponse(user, profile), message: "Logged in" });
});

// POST /auth/logout
router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  let profile = null;
  if (user.role === "seller") {
    const [p] = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.user_id, user.id));
    profile = p ?? null;
  }

  res.json(buildUserResponse(user, profile));
});

export default router;
