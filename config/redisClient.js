const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.connect().catch(console.error);

module.exports = redisClient;
