/**
 * Application configuration settings
 * Central place to manage environment-specific settings
 */
const CONFIG = {
    // API settings
    api: {
        // Updated to use the correct port for the backend API
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? `http://${window.location.hostname}:5001` 
            : '',
        version: 'v1'
    },
    
    // Application settings
    app: {
        name: 'CommunityVibe',
        environment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'development' 
            : 'production'
    },
    
    // Get complete API URL
    getApiUrl: function(endpoint) {
        return `${this.api.baseUrl}/${endpoint}`;
    },
    
    // Get uploads URL
    getUploadsUrl: function() {
        return `${this.api.baseUrl}/uploads`;
    }
};

// Prevent modifications to the configuration
Object.freeze(CONFIG);
