import { open } from "maxmind";
import { resolve } from "path";

class GeoIPService {
  constructor() {
    this.cityLookup = null;
  }

  async initialize() {
    const databasePath = resolve(process.cwd(), "GeoLite2-City.mmdb");

    // Load GeoIP database
    this.cityLookup = await open(databasePath);
  }

  async getLocation(ip) {
    if (!this.cityLookup) {
      console.warn("GeoIP database not initialized");
      await this.initialize();
    }

    try {
      if (
        ip === "::1" ||
        ip === "localhost" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("127.0.")
      ) {
        return {
          country: "Local",
          city: "Local",
        };
      }

      // Remove IPv6 prefix if present
      const cleanIP = ip.replace(/^::ffff:/, "");

      const geo = this.cityLookup.get(cleanIP);

      return {
        country: geo?.country?.names?.en || "Unknown",
        city: geo?.city?.names?.en || "Unknown",
      };
    } catch (error) {
      console.error("Geolocation lookup error:", error);
      return {
        country: "Unknown",
        city: "Unknown",
      };
    }
  }
}

export default new GeoIPService();
