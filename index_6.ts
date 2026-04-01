import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import newsRouter from "./news.js";
import searchRouter from "./search.js";
import blogsRouter from "./blogs.js";
import adminRouter from "./admin.js";
import settingsRouter from "./settings.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(newsRouter);
router.use(searchRouter);
router.use(blogsRouter);
router.use(adminRouter);
router.use(settingsRouter);

export default router;
