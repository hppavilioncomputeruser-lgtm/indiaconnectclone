import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import servicesRouter from "./services";
import inquiriesRouter from "./inquiries";
import sellersRouter from "./sellers";
import adminRouter from "./admin";
import dashboardRouter from "./dashboard";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(servicesRouter);
router.use(inquiriesRouter);
router.use(sellersRouter);
router.use(adminRouter);
router.use(dashboardRouter);

export default router;
