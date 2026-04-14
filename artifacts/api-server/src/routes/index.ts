import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tokenRouter from "./token";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tokenRouter);

export default router;
