import { Router } from "express";
import userRoutes from "./user";
import businessRoutes from "./business";

const rootRouter: Router = Router();

rootRouter.use("/user", userRoutes);

rootRouter.use("/business", businessRoutes);

export default rootRouter;
