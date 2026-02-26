import { FastifyRequest, FastifyReply } from 'fastify';

const rateLimit = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 5; // Max requests
const WINDOW_MS = 60 * 1000; // 1 minute

// Cleanup expired entries periodically to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimit.entries()) {
    if (now > record.resetTime) {
      rateLimit.delete(ip);
    }
  }
}, WINDOW_MS);

export const rateLimitCheck = async (request: FastifyRequest, reply: FastifyReply) => {
  const ip = request.ip;
  const now = Date.now();

  let record = rateLimit.get(ip);

  // Clean up if window passed
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + WINDOW_MS };
    rateLimit.set(ip, record);
  }

  record.count++;

  if (record.count > LIMIT) {
    // Return 429
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
};
