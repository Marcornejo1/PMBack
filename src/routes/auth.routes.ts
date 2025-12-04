import express from "express";
import authController from "../controllers/auth.controller";

const authRouter: any = express.Router();

authRouter.post("/", authController.login);
authRouter.post("/refresh", authController.refresh);

export default authRouter;