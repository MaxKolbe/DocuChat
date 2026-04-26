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
 *         description: User created successfully.
 *       400:
 *         description: Validation error.
 *       409:
 *         description: Email already registered.
 */
router.post("/register", validateRequest(registerSchema), registerController);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
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
 *       200:
 *         description: User logged in successfully.
 *       400:
 *         description: Invalid credentials.
 */
router.post("/login", validateRequest(loginSchema), loginController);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       201:
 *         description: New access token created.
 *       400:
 *         description: Request validation failed.
 *       401:
 *         description: Refresh token expired or revoked.
 */
router.post("/refresh", validateRequest(refreshSchema), refreshController);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out.
 */
router.post("/logout", logoutController);

export default router;
