import { v4 as uuidv4 } from "uuid";
import UrlGenerator from "../utils/urlGenerator.js";
import db from "../config/database.js";
import redisClient from "../config/redis.js";

class UrlService {
  static async createShortUrl(userId, longUrl, customAlias, topic) {
    try {
      const BASE_URL =
        process.env.NODE_ENV === "production"
          ? "https://url-shortener-mkx7.onrender.com/"
          : "http://localhost:3000";
      const id = uuidv4();
      const shortAlias =
        customAlias || UrlGenerator.generateShortAlias(longUrl);
      const shortUrl = `${BASE_URL}/${shortAlias}`;

      const existingUrl = await db.findOne("urls", { short_url: shortUrl });

      if (existingUrl) {
        throw new Error("Custom alias already in use");
      }

      const urlData = {
        id,
        user_id: userId,
        long_url: longUrl,
        short_url: shortUrl,
        custom_alias: customAlias,
        topic,
      };

      await db.insert("urls", urlData);

      await redisClient.set(
        `short:${shortAlias}`,
        longUrl,
        "EX",
        30 * 24 * 60 * 60 // 30 days expiry
      );

      return {
        id,
        shortUrl,
        longUrl,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in createShortUrl:", error);
      throw error;
    }
  }

  static async resolveShortUrl(shortAlias) {
    try {
      // Check Redis cache first
      const cachedUrl = await redisClient.get(`short:${shortAlias}`);
      if (cachedUrl) {
        return cachedUrl;
      }

      // If not in cache, check database using promisified method
      const row = await db.findOne("urls", {
        short_url: { LIKE: `%/${shortAlias}` },
      });

      if (row) {
        // Update cache for future requests
        await redisClient.set(
          `short:${shortAlias}`,
          row.long_url,
          "EX",
          30 * 24 * 60 * 60
        );
        return row.long_url;
      }

      throw new Error("Short URL not found");
    } catch (error) {
      console.error("Error in resolveShortUrl:", error);
      throw error;
    }
  }
}

export default UrlService;
