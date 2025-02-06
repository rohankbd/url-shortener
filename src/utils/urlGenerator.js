import { randomBytes } from "crypto";

class UrlGenerator {
  // Generate a unique short URL alias
  static generateShortAlias(length = 8) {
    // Use crypto to generate a secure, random string
    return randomBytes(Math.ceil(length / 2))
      .toString("base64") // Convert to base64
      .slice(0, length) // Trim to desired length
      .replace(/[+/]/g, "_") // Replace special characters
      .toLowerCase(); // Ensure lowercase
  }
}

export default UrlGenerator;
