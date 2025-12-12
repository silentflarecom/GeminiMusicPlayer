/**
 * Application Configuration
 * 
 * Central management for API endpoints and other global constants.
 * Supports overriding via environment variables (VITE_ prefix).
 */

export const API_CONFIG = {
    // Base URL for Netease Cloud Music API
    NETEASE_BASE_URL: import.meta.env.VITE_NETEASE_API_URL || "https://163api.qijieya.cn",

    // Meting API URL
    METING_API_URL: import.meta.env.VITE_METING_API_URL || "https://api.qijieya.cn/meting/",

    // Netease Search Endpoint (Convenience getter)
    get NETEASE_SEARCH_API() {
        return `${this.NETEASE_BASE_URL}/cloudsearch`;
    }
};
