import UrlService from "../services/urlService.js";
import { validateUrl } from "../utils/validateUrl.js";
import AnalyticsService from "../services/analyticsService.js";
import db from "../config/database.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";

class UrlController {
  // Create short URL
  static async createShortUrl(req, res, next) {
    try {
      const { longUrl, customAlias, topic } = req.body;

      // Validate URL
      if (!validateUrl(longUrl)) {
        return next(ErrorHandler.createError("Invalid URL format", 400));
      }

      const shortUrl = await UrlService.createShortUrl(
        req.user.id,
        longUrl,
        customAlias,
        topic
      );

      res.status(201).json(shortUrl);
    } catch (error) {
      next(error);
    }
  }

  // Redirect short URL
  static async redirectUrl(req, res, next) {
    try {
      const { alias } = req.params;
      const longUrl = await UrlService.resolveShortUrl(alias);

      if (!longUrl) {
        return next(ErrorHandler.createError("URL not found", 404));
      }

      const urlRecord = await db.findOne("urls", {
        short_url: `${process.env.BASE_URL}/${alias}`,
      });

      if (!urlRecord) {
        console.error("URL record not found for analytics logging");
        return res.redirect(longUrl); // Still redirect even if analytics fails
      }

      // Log analytics asynchronously - don't await to prevent delay in redirect
      AnalyticsService.logRedirectEvent(urlRecord.id, req).catch((error) => {
        console.error("Analytics logging error:", error);
      });

      // Here you would typically log analytics before redirecting
      res.redirect(longUrl);
    } catch (error) {
      next(error);
    }
  }

  static async getLongUrl(req, res, next) {
    try {
      const { shortUrl } = req.params;
      const longUrl = await UrlService.getLongUrl(shortUrl);

      if (!longUrl) {
        return next(ErrorHandler.createError("Short URL not found", 404));
      }

      res.status(200).json({ longUrl });
    } catch (error) {
      next(error);
    }
  }
}

export default UrlController;
