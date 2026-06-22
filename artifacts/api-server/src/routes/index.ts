import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import rulesRouter from "./rules";
import formulasRouter from "./formulas";
import knowledgeRouter from "./knowledge";
import loshuRouter from "./loshu";
import reportsRouter from "./reports";
import numberMeaningsRouter from "./number-meanings";
import mappingsRouter from "./mappings";
import compatibilityRouter from "./compatibility";
import remediesRouter from "./remedies-route";
import categoriesTagsRouter from "./categories-tags-route";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(rulesRouter);
router.use(formulasRouter);
router.use(knowledgeRouter);
router.use(loshuRouter);
router.use(reportsRouter);
router.use(numberMeaningsRouter);
router.use(mappingsRouter);
router.use(compatibilityRouter);
router.use(remediesRouter);
router.use(categoriesTagsRouter);

export default router;
