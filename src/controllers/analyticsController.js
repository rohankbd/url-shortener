import db from "../config/database.js";
import redisClient from "../config/redis.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";

class AnalyticsController {
  // Helper method to process analytics data
  static processAnalyticsData(result) {
    // Process daily clicks
    const clicksByDate = result.daily_clicks
      ? result.daily_clicks.split(",").reduce((acc, pair, index, array) => {
          if (index % 2 === 0) {
            acc.push({
              date: array[index],
              clicks: parseInt(array[index + 1]),
            });
          }
          return acc;
        }, [])
      : [];

    // Process OS stats
    const osType = result.os_stats
      ? result.os_stats.split(",").reduce((acc, value, index, array) => {
          if (index % 3 === 0) {
            acc.push({
              osName: array[index],
              uniqueClicks: parseInt(array[index + 1]),
              uniqueUsers: parseInt(array[index + 2]),
            });
          }
          return acc;
        }, [])
      : [];

    // Process device stats
    const deviceType = result.device_stats
      ? result.device_stats.split(",").reduce((acc, value, index, array) => {
          if (index % 3 === 0) {
            acc.push({
              deviceName: array[index],
              uniqueClicks: parseInt(array[index + 1]),
              uniqueUsers: parseInt(array[index + 2]),
            });
          }
          return acc;
        }, [])
      : [];

    return { clicksByDate, osType, deviceType };
  }

  static async getUrlAnalytics(req, res, next) {
    try {
      const { alias } = req.params;
      const shortUrl = `${process.env.BASE_URL}/${alias}`;
      const cacheKey = `urlAnalytics:${shortUrl}`;

      // Check cache first
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      const query = `
        WITH daily_stats AS (
          SELECT 
            DATE(a.created_at) as click_date,
            COUNT(*) as daily_count
          FROM analytics a
          JOIN urls u ON u.id = a.url_id
          WHERE u.short_url = ?
          GROUP BY DATE(a.created_at)
          ORDER BY click_date DESC
        ),
        os_stats AS (
          SELECT 
            a.os_type as osName,
            COUNT(*) as unique_clicks,
            COUNT(DISTINCT a.ip_address) as unique_users
          FROM analytics a
          JOIN urls u ON u.id = a.url_id
          WHERE u.short_url = ?
          GROUP BY a.os_type
        ),
        device_stats AS (
          SELECT 
            a.device_type as deviceName,
            COUNT(*) as unique_clicks,
            COUNT(DISTINCT a.ip_address) as unique_users
          FROM analytics a
          JOIN urls u ON u.id = a.url_id
          WHERE u.short_url = ?
          GROUP BY a.device_type
        ),
        url_stats AS (
          SELECT 
            u.id as url_id,
            u.short_url,
            u.long_url,
            COUNT(a.id) as unique_clicks,
            COUNT(DISTINCT a.ip_address) as unique_users
          FROM urls u
          LEFT JOIN analytics a ON u.id = a.url_id
          WHERE u.short_url = ?
          GROUP BY u.id
        )
        SELECT 
          url_stats.*,
          GROUP_CONCAT(DISTINCT daily_stats.click_date || ',' || daily_stats.daily_count) as daily_clicks,
          GROUP_CONCAT(DISTINCT os_stats.osName || ',' || os_stats.unique_clicks || ',' || os_stats.unique_users) as os_stats,
          GROUP_CONCAT(DISTINCT device_stats.deviceName || ',' || device_stats.unique_clicks || ',' || device_stats.unique_users) as device_stats
        FROM url_stats
        LEFT JOIN daily_stats
        LEFT JOIN os_stats
        LEFT JOIN device_stats;
      `;

      const result = await db.get(query, [
        shortUrl,
        shortUrl,
        shortUrl,
        shortUrl,
      ]);

      if (!result) {
        return next(ErrorHandler.createError("URL not found", 404));
      }

      const { clicksByDate, osType, deviceType } =
        AnalyticsController.processAnalyticsData(result);

      const analytics = {
        totalClicks: result.unique_clicks || 0,
        uniqueUsers: result.unique_users || 0,
        clicksByDate,
        osType,
        deviceType,
      };

      // Cache the result only if there is data
      if (analytics.totalClicks > 0 || analytics.uniqueUsers > 0) {
        await redisClient.set(cacheKey, JSON.stringify(analytics), "EX", 3600); // Cache for 1 hour
      }

      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }

  // Get topic-based analytics
  static async getTopicAnalytics(req, res, next) {
    try {
      const { topic } = req.params;
      const userId = req.user?.id;
      const cacheKey = `topicAnalytics:${topic}:${userId}`;

      // Check cache first
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      const query = `
        WITH topic_totals AS (
          SELECT 
            COUNT(a.id) as overall_unique_clicks,
            COUNT(DISTINCT a.ip_address) as overall_unique_users
          FROM urls u
          LEFT JOIN analytics a ON u.id = a.url_id
          WHERE u.topic = ? AND u.user_id = ?
        ),
        daily_stats AS (
          SELECT 
            DATE(a.created_at) as click_date,
            COUNT(*) as daily_count
          FROM urls u
          JOIN analytics a ON u.id = a.url_id
          WHERE u.topic = ? AND u.user_id = ?
          GROUP BY DATE(a.created_at)
        ),
        url_stats AS (
          SELECT 
            u.short_url,
            u.long_url,
            COUNT(a.id) as unique_clicks,
            COUNT(DISTINCT a.ip_address) as unique_users
          FROM urls u
          LEFT JOIN analytics a ON u.id = a.url_id
          WHERE u.topic = ? AND u.user_id = ?
          GROUP BY u.id, u.short_url, u.long_url
        )
        SELECT 
          url_stats.*,
          topic_totals.overall_unique_clicks,
          topic_totals.overall_unique_users,
          GROUP_CONCAT(daily_stats.click_date || ',' || daily_stats.daily_count) as daily_clicks
        FROM url_stats
        CROSS JOIN topic_totals
        LEFT JOIN daily_stats;
      `;

      const results = await db.all(query, [
        topic,
        userId,
        topic,
        userId,
        topic,
        userId,
      ]);

      if (results.length === 0) {
        return res.status(200).json({
          totalClicks: 0,
          uniqueUsers: 0,
          clicksByDate: [],
          urls: [],
        });
      }

      // Process daily clicks
      const dailyClicks = results[0].daily_clicks
        ? results[0].daily_clicks
            .split(",")
            .reduce((acc, pair, index, array) => {
              if (index % 2 === 0) {
                acc.push({
                  date: array[index],
                  clicks: parseInt(array[index + 1]),
                });
              }
              return acc;
            }, [])
        : [];

      const analytics = {
        totalClicks: results[0].overall_unique_clicks,
        uniqueUsers: results[0].overall_unique_users,
        clicksByDate: dailyClicks,
        urls: results.map((url) => ({
          shortUrl: url.short_url,
          longUrl: url.long_url,
          totalClicks: url.unique_clicks,
          uniqueUsers: url.unique_users,
        })),
      };

      // Cache the result only if there is data
      if (analytics.totalClicks > 0 || analytics.uniqueUsers > 0) {
        await redisClient.set(cacheKey, JSON.stringify(analytics), "EX", 3600); // Cache for 1 hour
      }

      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }

  // Get overall user analytics
  static async getOverallAnalytics(req, res, next) {
    try {
      const userId = req.user?.id;
      const cacheKey = `overallAnalytics:${userId}`;

      // Check cache first
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      const query = `
          WITH daily_stats AS (
              SELECT 
                  DATE(a.created_at) as click_date,
                  COUNT(*) as daily_count
              FROM urls u
              JOIN analytics a ON u.id = a.url_id
              WHERE u.user_id = ?
              GROUP BY DATE(a.created_at)
          ),
          overall_stats AS (
              SELECT 
                  COUNT(DISTINCT u.id) as total_urls,
                  COUNT(a.id) as unique_clicks,
                  COUNT(DISTINCT a.ip_address) as unique_users
              FROM urls u
              LEFT JOIN analytics a ON u.id = a.url_id
              WHERE u.user_id = ?
              GROUP BY u.user_id
          ),
          os_stats AS (
              SELECT 
                  a.os_type as name,
                  COUNT(*) as unique_clicks,
                  COUNT(DISTINCT a.ip_address) as unique_users
              FROM urls u
              JOIN analytics a ON u.id = a.url_id
              WHERE u.user_id = ? AND a.os_type IS NOT NULL
              GROUP BY a.os_type
          ),
          device_stats AS (
              SELECT 
                  a.device_type as name,
                  COUNT(*) as unique_clicks,
                  COUNT(DISTINCT a.ip_address) as unique_users
              FROM urls u
              JOIN analytics a ON u.id = a.url_id
              WHERE u.user_id = ? AND a.device_type IS NOT NULL
              GROUP BY a.device_type
          )
          SELECT 
              overall_stats.*,
              GROUP_CONCAT(DISTINCT daily_stats.click_date || ',' || daily_stats.daily_count) as daily_clicks,
              GROUP_CONCAT(DISTINCT os_stats.name || ',' || os_stats.unique_clicks || ',' || os_stats.unique_users) as os_stats,
              GROUP_CONCAT(DISTINCT device_stats.name || ',' || device_stats.unique_clicks || ',' || device_stats.unique_users) as device_stats
          FROM overall_stats
          LEFT JOIN daily_stats
          LEFT JOIN os_stats
          LEFT JOIN device_stats;
      `;

      const result = await db.get(query, [userId, userId, userId, userId]);

      if (!result) {
        return res.status(200).json({
          totalUrls: 0,
          totalClicks: 0,
          uniqueUsers: 0,
          clicksByDate: [],
          osType: [],
          deviceType: [],
        });
      }

      const { clicksByDate, osType, deviceType } =
        AnalyticsController.processAnalyticsData(result);

      const analytics = {
        totalUrls: result.total_urls || 0,
        totalClicks: result.unique_clicks || 0,
        uniqueUsers: result.unique_users || 0,
        clicksByDate,
        osType,
        deviceType,
      };

      // Cache the result only if there is data
      if (
        analytics.totalUrls > 0 ||
        analytics.totalClicks > 0 ||
        analytics.uniqueUsers > 0
      ) {
        await redisClient.set(cacheKey, JSON.stringify(analytics), "EX", 3600); // Cache for 1 hour
      }

      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }
}

export default AnalyticsController;
