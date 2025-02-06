import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";
import GeoIPService from "./geoipService.js";

class AnalyticsService {
  // Log redirect event
  static async logRedirectEvent(urlId, req) {
    const id = uuidv4();
    const ipAddress = req.ip;
    const userAgent = req.get("User-Agent") || "Unknown";
    const referrer = req.get("Referrer") || "Direct";

    // Detect OS and device type
    const osType = this.detectOS(userAgent);
    const deviceType = this.detectDeviceType(userAgent);

    // Get geolocation
    const geoLocation = await GeoIPService.getLocation(ipAddress);

    await db.insert("analytics", {
      id,
      url_id: urlId,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer,
      os_type: osType,
      device_type: deviceType,
      country: (await geoLocation).country,
      city: (await geoLocation).city,
    });
  }

  // Detect Operating System
  static detectOS(userAgent) {
    userAgent = userAgent.toLowerCase();
    if (userAgent.includes("windows")) return "Windows";
    if (userAgent.includes("mac")) return "macOS";
    if (userAgent.includes("linux")) return "Linux";
    if (userAgent.includes("android")) return "Android";
    if (userAgent.includes("ios")) return "iOS";
    return "Other";
  }

  // Detect Device Type
  static detectDeviceType(userAgent) {
    userAgent = userAgent.toLowerCase();
    if (userAgent.includes("mobile")) return "Mobile";
    if (userAgent.includes("tablet")) return "Tablet";
    return "Desktop";
  }
}

export default AnalyticsService;
