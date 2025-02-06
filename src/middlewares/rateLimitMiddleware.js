import rateLimit from "express-rate-limit";

const urlCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many URL creation requests, please try again later",
});

export default urlCreationLimiter;
