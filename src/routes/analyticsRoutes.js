import { Router } from "express";
const router = Router();
import AnalyticsController from "../controllers/analyticsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

/**
 * @swagger
 * /api/analytics/topic/{topic}:
 *   get:
 *     summary: Get topic-based analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves analytics based on a particular topic. This could include the number of interactions or engagement metrics related to a specific topic.
 *     parameters:
 *       - in: path
 *         name: topic
 *         required: true
 *         description: The topic for which analytics are being requested
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved topic analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topic:
 *                   type: string
 *                 engagements:
 *                   type: integer
 *                   description: Number of engagements related to the topic
 *       404:
 *         description: Topic not found or no data available
 */
router.get(
  "/topic/:topic",
  authMiddleware,
  AnalyticsController.getTopicAnalytics
);

/**
 * @swagger
 * /api/analytics/overall:
 *   get:
 *     summary: Get overall user analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves overall analytics for the platform, such as total users, clicks, and other global metrics.
 *     responses:
 *       200:
 *         description: Successfully retrieved overall analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   description: Total number of users on the platform
 *                 totalClicks:
 *                   type: integer
 *                   description: Total number of clicks across all URLs
 *                 activeUsers:
 *                   type: integer
 *                   description: Number of active users in the last 24 hours
 */
router.get("/overall", authMiddleware, AnalyticsController.getOverallAnalytics);

/**
 * @swagger
 * /api/analytics/{alias}:
 *   get:
 *     summary: Get analytics for a specific short URL
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves the analytics data (like click-throughs, user demographics, etc.) for a specific short URL.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         description: The alias of the short URL.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics for the specified URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clicks:
 *                   type: integer
 *                   description: Total number of clicks for the URL
 *                 userInfo:
 *                   type: object
 *                   properties:
 *                     country:
 *                       type: string
 *                     device:
 *                       type: string
 *       404:
 *         description: The specified URL alias does not exist
 */
router.get("/:alias", authMiddleware, AnalyticsController.getUrlAnalytics);

export default router;
