import { Router } from "express";
const router = Router();
import UrlController from "../controllers/urlController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";

// Create short URL (authenticated & rate-limited)
/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create short URL
 *     tags: [URL]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               longUrl:
 *                 type: string
 *               customAlias:
 *                 type: string
 *               topic:
 *                 type: string
 *     responses:
 *       201:
 *         description: Short URL created
 *       400:
 *         description: Invalid URL format
 *       500:
 *         description: Server error
 */
router.post(
  "/api/shorten",
  authMiddleware,
  rateLimitMiddleware,
  UrlController.createShortUrl
);

// Redirect short URL (public route)
/**
 * @swagger
 * /{alias}:
 *   get:
 *     summary: Redirect short URL
 *     tags: [URL]
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: Short URL alias
 *     responses:
 *       302:
 *         description: Redirect to long URL
 *       404:
 *         description: Short URL not found
 *       500:
 *         description: Server error
 */
router.get("/:alias", UrlController.redirectUrl);

export default router;
