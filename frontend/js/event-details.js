document.addEventListener('DOMContentLoaded', async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            window.location.href = 'events.html';
            return;
        }

        // Use CONFIG.utils.getApiUrl() instead of CONFIG.getApiUrl()
        const response = await fetch(CONFIG.utils.getApiUrl(`event/${eventId}`));
        
        if (!response.ok) throw new Error('Failed to fetch event details');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to load event');
        
        // Rest of your event loading code...
        
    } catch (error) {
        console.error('Error loading event details:', error);
        if (window.toast) {
            window.toast.show({
                title: 'Error!',
                message: 'Failed to load event details',
                type: 'error',
                duration: 5000
            });
        }
        setTimeout(() => window.location.href = 'events.html', 2000);
    }
});