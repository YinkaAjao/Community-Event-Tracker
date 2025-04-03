/**
 * Application configuration settings
 * Central place to manage environment-specific settings
 */
const CONFIG = {
    // API settings
    api: {
        baseUrl: 'http://localhost:5001',
        uploadsPath: '/uploads'
    },

    // Helper methods
    getApiUrl(endpoint) {
        return `${this.api.baseUrl}/${endpoint}`;
    },

    getUploadsUrl(filename = '') {
        return `${this.api.baseUrl}${this.api.uploadsPath}/${filename}`;
    }
};

// Prevent modifications to the configuration
Object.freeze(CONFIG);
