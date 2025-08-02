// Security utilities for API protection

/**
 * Check if the current environment is allowed to use API keys
 */
export const isAllowedEnvironment = () => {
  const hostname = window.location.hostname
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    'wonbyte-pro.vercel.app',
    'wonbyte-pro-git-main-mingukang0719s-projects.vercel.app'
  ]
  
  return allowedHosts.some(host => hostname.includes(host))
}

/**
 * Rate limiting for API calls
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  canMakeRequest() {
    const now = Date.now()
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }

  getRemainingTime() {
    if (this.requests.length === 0) return 0
    const oldestRequest = Math.min(...this.requests)
    const now = Date.now()
    return Math.max(0, this.windowMs - (now - oldestRequest))
  }
}

// Create rate limiter instance (10 requests per minute)
export const apiRateLimiter = new RateLimiter(10, 60000)

/**
 * Sanitize API responses to prevent XSS
 */
export const sanitizeApiResponse = (text) => {
  if (typeof text !== 'string') return text
  
  // Remove any potential script tags or dangerous HTML
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * Log API usage for monitoring
 */
export const logApiUsage = (provider, success, error = null) => {
  const usage = {
    timestamp: new Date().toISOString(),
    provider,
    success,
    error: error?.message || null,
    hostname: window.location.hostname
  }
  
  // In production, you might want to send this to an analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log('API Usage:', usage)
  }
}