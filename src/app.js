import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { swaggerUi, swaggerDocs } from "./config/swagger.js";

// Load environment variables
config();

// Initialize GeoIP Service
import geoIPService from "./services/geoipService.js";
geoIPService.initialize();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(json());
app.use(cookieParser());

// Routes
import authRoutes from "./routes/authRoutes.js";
import urlRoutes from "./routes/urlRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Endpoints
app.use("/api/auth", authRoutes);
app.use("/", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
