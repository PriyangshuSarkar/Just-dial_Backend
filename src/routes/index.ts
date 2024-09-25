import { Router } from "express";
import userRoutes from "./user";

const rootRouter: Router = Router();

rootRouter.use("/user", userRoutes);

export default rootRouter;
