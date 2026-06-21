import rateLimit from 'express-rate-limit';

// Strict rate limiter for login and authentication endpoints
// Limits each IP to 10 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for checkout/order creation
// Limits each IP to 5 order creations per hour to prevent spam/botting
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Allowing 10 orders per hour per IP
  message: {
    success: false,
    message: 'Too many orders created from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter for all other API endpoints (optional safety net)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
