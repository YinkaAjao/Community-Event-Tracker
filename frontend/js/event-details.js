document.addEventListener('DOMContentLoaded', async () => {
    let eventData = null;
    
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    async function loadEventDetails() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('id');

            if (!eventId) {
                throw new Error('No event ID provided');
            }

            // Add loading state
            document.body.classList.add('loading');
            
            console.log('Fetching event:', CONFIG.getApiUrl(`event/${eventId}`));
            const response = await fetch(CONFIG.getApiUrl(`event/${eventId}`));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Event data received:', data);
            
            if (!data.success || !data.data) {
                throw new Error(data.message || 'Failed to load event data');
            }
            
            eventData = data.data;
            updateUI(eventData);
            initMap(eventData);
            loadSimilarEvents(eventData.category, eventData.id);

        } catch (error) {
            console.error('Error loading event:', error);
            document.getElementById('event-title').textContent = 'Error loading event';
            document.getElementById('event-description-text').textContent = 
                'Sorry, we couldn\'t load this event. Please try again later.';
            
            if (window.toast) {
                window.toast.show({
                    title: 'Error!',
                    message: error.message,
                    type: 'error',
                    duration: 5000
                });
            }
        } finally {
            document.body.classList.remove('loading');
        }
    }

    function updateUI(event) {
        document.title = `${event.title} - CommunityVibe`;
        
        // Update text content
        document.getElementById('event-title').textContent = event.title;
        document.getElementById('event-title-header').textContent = event.title;
        document.getElementById('event-category').textContent = event.category;
        document.getElementById('event-date').textContent = formatDate(event.event_date);
        document.getElementById('event-time').textContent = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
        document.getElementById('event-venue').textContent = event.venue;
        document.getElementById('event-description-text').textContent = event.description;
        document.getElementById('event-capacity').textContent = event.formatted_capacity;
        document.getElementById('event-price').textContent = event.formatted_price;
        document.getElementById('venue-name').textContent = event.venue;
        document.getElementById('venue-address').textContent = event.address;

        // Handle RSVP buttons
        const rsvpBtns = document.querySelectorAll('#rsvp-btn, #sidebar-rsvp-btn');
        rsvpBtns.forEach(btn => {
            btn.addEventListener('click', handleRSVP);
        });

        // Update images with error handling
        const eventImage = document.getElementById('event-image');
        eventImage.src = `${CONFIG.getUploadsUrl()}/${event.image}`;
        eventImage.alt = event.title;
        eventImage.onerror = () => {
            eventImage.src = `${CONFIG.getUploadsUrl()}/default.jpg`;
        };
        
        const organizerImage = document.getElementById('organizer-image');
        organizerImage.src = event.organizer_image ? 
            `${CONFIG.getUploadsUrl()}/${event.organizer_image}` : 
            `${CONFIG.getUploadsUrl()}/default-organizer.jpg`;
        organizerImage.onerror = () => {
            organizerImage.src = `${CONFIG.getUploadsUrl()}/default-organizer.jpg`;
        };

        // Update organizer info
        document.getElementById('organizer-name').textContent = event.organizer_name;
        document.getElementById('organizer-description').textContent = 
            event.organizer_description || 'No description available';

        // Set up share functionality
        setupShareButtons(event);

        // Set up directions button
        setupDirectionsButton(event);
    }

    function handleRSVP() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            return;
        }

        // Show RSVP confirmation dialog
        if (window.confirm('Would you like to RSVP for this event?')) {
            window.toast?.show({
                title: 'Success!',
                message: 'You have successfully RSVP\'d for this event.',
                type: 'success',
                duration: 3000
            });
        }
    }

    function setupShareButtons(event) {
        const url = window.location.href;
        const text = `Check out "${event.title}" on CommunityVibe!`;

        document.getElementById('facebook-share').href = 
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        
        document.getElementById('twitter-share').href = 
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        
        document.getElementById('email-share').href = 
            `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;

        // Open share links in new window
        document.querySelectorAll('.social-share a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(e.currentTarget.href, '_blank', 'width=600,height=400');
            });
        });
    }

    function setupDirectionsButton(event) {
        const directionsBtn = document.getElementById('directions-btn');
        if (event.latitude && event.longitude) {
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
            directionsBtn.href = mapsUrl;
        } else {
            directionsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
        }
    }

    async function loadSimilarEvents(category, currentEventId) {
        try {
            const response = await fetch(CONFIG.getApiUrl(`events/similar/${category}/${currentEventId}`));
            if (!response.ok) throw new Error('Failed to fetch similar events');
            
            const data = await response.json();
            if (!data.success) throw new Error('Failed to load similar events');
            
            const container = document.getElementById('similar-events-list');
            container.innerHTML = data.data.map(event => `
                <div class="similar-event">
                    <div class="similar-event-image">
                        <img src="${CONFIG.getUploadsUrl()}/${event.image}" alt="${event.title}" onerror="this.src='${CONFIG.getUploadsUrl()}/default.jpg'">
                    </div>
                    <div class="similar-event-info">
                        <h4>${event.title}</h4>
                        <p>${formatDate(event.event_date)}</p>
                        <a href="event-details.html?id=${event.id}">View Details →</a>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading similar events:', error);
        }
    }

    function initMap(event) {
        // Only initialize map if coordinates exist and are not 0
        if (!event.latitude || !event.longitude || 
            (event.latitude === 0 && event.longitude === 0)) {
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div class="map-error">
                        <i class="fas fa-map-marker-alt"></i>
                        <p>Location coordinates not available</p>
                    </div>
                `;
            }
            return;
        }
        
        const position = { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) };
        const map = new google.maps.Map(document.getElementById('map'), {
            center: position,
            zoom: 15
        });
        
        new google.maps.Marker({
            position: position,
            map: map,
            title: event.venue
        });
    }

    // Initialize the page
    loadEventDetails();
});