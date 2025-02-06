import Redis from "ioredis";

let redisClient;

if (process.env.NODE_ENV === "production") {
    redisClient = new Redis(process.env.REDIS_URL);
} else {
    redisClient = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379
    });
}

redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});

export default redisClient;