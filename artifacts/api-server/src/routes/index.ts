import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import rulesRouter from "./rules";
import formulasRouter from "./formulas";
import knowledgeRouter from "./knowledge";
import loshuRouter from "./loshu";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(rulesRouter);
router.use(formulasRouter);
router.use(knowledgeRouter);
router.use(loshuRouter);
router.use(reportsRouter);

export default router;
