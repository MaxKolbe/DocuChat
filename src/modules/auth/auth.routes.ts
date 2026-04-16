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
 
/** 
 * @swagger 
 * /auth/register: 
 *   post: 
 *     summary: Register a new user 
 *     tags: [Authentication] 
 *     requestBody: 
 *       required: true 
 *       content: 
 *         application/json: 
 *           schema: 
 *             type: object 
 *             required: [email, password] 
 *             properties: 
 *               email: 
 *                 type: string 
 *                 format: email 
 *                 example: student@example.com 
 *               password: 
 *                 type: string 
 *                 minLength: 8 
 *                 example: MyPassword123 
 *     responses: 
 *       201: 
 *         description: User created successfully 
 *       400: 
 *         description: Validation error 
 *       409: 
 *         description: Email already registered 
 */ 
router.post("/register", validateRequest(registerSchema), registerController);
router.post("/login", validateRequest(loginSchema), loginController);
router.post("/refresh", validateRequest(refreshSchema), refreshController);
router.post("/logout", logoutController);

export default router;
