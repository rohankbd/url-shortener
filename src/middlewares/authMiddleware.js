import pkg from "jsonwebtoken";
const { verify } = pkg;
import db from "../config/database.js";

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET);

    // Check if user exists
    try {
      const user = await db.get("SELECT * FROM users WHERE id = ?", [
        decoded.userId,
      ]);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ error: "Database error" });
    }
  } catch (error) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

export default authMiddleware;
