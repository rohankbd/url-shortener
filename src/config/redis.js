import Redis from "ioredis";

// LOCAL
// const redisClient = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: process.env.REDIS_PORT || 6379,
// });

// PRODUCTION
const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export default redisClient;
