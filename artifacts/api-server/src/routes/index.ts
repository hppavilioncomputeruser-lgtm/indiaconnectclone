import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import servicesRouter from "./services";
import inquiriesRouter from "./inquiries";
import messagesRouter from "./messages";
import sellersRouter from "./sellers";
import adminRouter from "./admin";
import dashboardRouter from "./dashboard";
import broadcastsRouter from "./broadcasts";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(servicesRouter);
router.use(inquiriesRouter);
router.use(messagesRouter);
router.use(sellersRouter);
router.use(adminRouter);
router.use(dashboardRouter);
router.use(broadcastsRouter);

export default router;
