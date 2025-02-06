import { Router } from "express";
const router = Router();
import AuthController from "../controllers/authController.js";

// Google Sign-In Route
/**
 * @swagger
 * /api/auth/google-signin:
 *   post:
 *     summary: Google Sign-In or Register
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credential:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login or registration
 *       500:
 *         description: Server error
 */
router.post("/google-signin", AuthController.googleSignInOrRegister);

export default router;
