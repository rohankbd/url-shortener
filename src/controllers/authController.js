import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";
import verifyGoogleToken from "../config/google-auth.js";
import pkg from "jsonwebtoken";
import ErrorHandler from "../middlewares/errorMiddleware.js";
const { sign } = pkg;

class AuthController {
  // Google Sign-In Handler
  static async googleSignInOrRegister(req, res, next) {
    try {
      const { credential } = req.body;

      // Verify Google token
      const payload = await verifyGoogleToken(credential);

      if (!payload) {
        return next(ErrorHandler.createError("Invalid Google token", 401));
      }

      const { sub: googleId, email, name } = payload;

      // Check if user exists
      let existingUser;
      try {
        existingUser = await db.get("SELECT * FROM users WHERE google_id = ?", [
          googleId,
        ]);
      } catch (err) {
        console.error(err);
        return next(ErrorHandler.createError("Database query failed", 500));
      }

      let userId;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        userId = uuidv4();
        try {
          await db.run(
            "INSERT INTO users (id, email, name, google_id) VALUES (?, ?, ?, ?)",
            [userId, email, name, googleId]
          );
        } catch (err) {
          console.error(err);
          return next(ErrorHandler.createError("Failed to create new user", 500));
        }
      }

      // Generate JWT token
      const token = sign({ userId, email }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      res.status(200).json({
        message: "Login or registration successful",
        user: { id: userId, email, name },
      });
    } catch (error) {
      console.error("Google Sign-In or Registration Error:", error);
      next(error);
    }
  }
}

export default AuthController;
