const Redis = require("ioredis");

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    commandTimeout: 1500,
    retryStrategy: (times) => {
        if (times > 3) {
            return null;
        }
        return Math.min(times * 200, 1000);
    }
})

redisClient.on('connect', () => {
    console.log("Redis Connected Successfully")
})

redisClient.on('error', (err) => {
    console.log("Redis error:", err.message)
})

module.exports = redisClient;