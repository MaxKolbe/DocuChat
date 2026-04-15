import express from "express";
import { validateRequest } from "../../middleware/validate.js";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schemas.js";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from "./auth.controller.js";

const router = express.Router();

router.post("/register", validateRequest(registerSchema), registerController);
router.post("/login", validateRequest(loginSchema), loginController);
router.post("/refresh", validateRequest(refreshSchema), refreshController);
router.post("/logout", logoutController);

export default router;
