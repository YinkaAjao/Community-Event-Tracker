// js/main.js
document.addEventListener('DOMContentLoaded', async function() {
    // Check server connection first
    try {
        const response = await fetch(CONFIG.getApiUrl('health'));
        if (!response.ok) throw new Error('Server health check failed');
        console.log('✅ Connected to server successfully');
    } catch (error) {
        console.error('❌ Server connection failed:', error);
        document.body.innerHTML = `
            <div class="error-message">
                Unable to connect to server. Please ensure the server is running on port 5001.
                <br><button onclick="window.location.reload()">Retry</button>
            </div>`;
        return;
    }

    // Load upcoming events
    const upcomingEventsContainer = document.getElementById('upcomingEvents');
    if (upcomingEventsContainer) {
        try {
            const response = await fetch(CONFIG.getApiUrl('events'));
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load events');
            }

            if (data.data.length === 0) {
                upcomingEventsContainer.innerHTML = '<p>No upcoming events found</p>';
                return;
            }

            upcomingEventsContainer.innerHTML = data.data.map(event => `
                <div class="event-card">
                    <div class="event-image">
                        <img src="${CONFIG.getUploadsUrl(event.image)}" 
                             alt="${event.title}"
                             onerror="this.src='${CONFIG.getUploadsUrl('default.jpg')}'">
                        <div class="event-date">${event.event_date}</div>
                        <div class="event-tag">${event.category}</div>
                    </div>
                    <div class="event-details">
                        <h3>${event.title}</h3>
                        <p>${event.description || 'No description available'}</p>
                        <div class="event-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
                            <span><i class="far fa-clock"></i> ${event.start_time}</span>
                        </div>
                        <a href="event-details.html?id=${event.id}" class="btn primary-btn">View Details</a>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading events:', error);
            upcomingEventsContainer.innerHTML = `
                <div class="error-message">
                    Failed to load upcoming events. Please try again later.
                    <br><button onclick="window.location.reload()">Retry</button>
                </div>`;
        }
    }

    // Create navigation
    createNav();

    // Mobile menu toggle (for responsive design)
    const setupMobileMenu = () => {
        const header = document.querySelector('header');
        const mobileMenuButton = document.createElement('button');
        mobileMenuButton.classList.add('mobile-menu-button');
        mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
        
        const nav = document.querySelector('nav');
        
        // Only add mobile menu button if screen is small
        if (window.innerWidth <= 768) {
            if (!document.querySelector('.mobile-menu-button')) {
                header.insertBefore(mobileMenuButton, nav);
                nav.style.display = 'none';
            }
            
            mobileMenuButton.addEventListener('click', function() {
                if (nav.style.display === 'none') {
                    nav.style.display = 'block';
                    mobileMenuButton.innerHTML = '<i class="fas fa-times"></i>';
                } else {
                    nav.style.display = 'none';
                    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        } else {
            // Remove mobile menu button if screen is large
            const existingButton = document.querySelector('.mobile-menu-button');
            if (existingButton) {
                existingButton.remove();
                nav.style.display = 'block';
            }
        }
    };
    
    // Call initially and on window resize
    setupMobileMenu();
    window.addEventListener('resize', setupMobileMenu);
    
    // Authentication and session management
    function checkAuthStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        const authNav = document.getElementById('auth-nav');
        const userNav = document.getElementById('user-nav');
        
        if (currentUser) {
            // User is logged in
            if (authNav) authNav.style.display = 'none';
            if (userNav) {
                userNav.style.display = 'flex';
                const usernameElement = document.getElementById('username-display');
                if (usernameElement) {
                    usernameElement.textContent = currentUser.username;
                }
            }
        } else {
            // User is logged out
            if (authNav) authNav.style.display = 'flex';
            if (userNav) userNav.style.display = 'none';
        }
    }

    // Enhanced notification handling
    async function checkNotifications() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        try {
            const response = await fetch(CONFIG.getApiUrl(`notifications/${currentUser.id}`));
            const data = await response.json();

            if (data.success) {
                updateNotificationBadge(data.notifications);
                populateNotificationsDropdown(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    function updateNotificationBadge(notifications) {
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    function populateNotificationsDropdown(notifications) {
        const dropdown = document.getElementById('notifications-dropdown');
        if (!dropdown) return;

        if (!notifications.length) {
            dropdown.innerHTML = '<div class="no-notifications">No notifications</div>';
            return;
        }

        dropdown.innerHTML = '';
        notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? '' : 'unread'}`;
            item.innerHTML = `
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-category">${notification.category}</div>
                    <div class="notification-text">${notification.message}</div>
                    <div class="notification-time">${new Date(notification.created_at).toLocaleDateString()}</div>
                </div>
            `;
            
            item.addEventListener('click', () => markNotificationRead(notification.id));
            dropdown.appendChild(item);
        });
    }

    async function markNotificationRead(notificationId) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        try {
            await fetch(CONFIG.getApiUrl(`notifications/${notificationId}/read`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            await checkNotifications(); // Refresh notifications
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Set up notification toggle behavior
    function setupNotifications() {
        const toggle = document.querySelector('.notifications-toggle');
        const dropdown = document.getElementById('notifications-dropdown');
        if (!toggle || !dropdown) return;

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                checkNotifications();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Initialize notifications
    setupNotifications();
    checkNotifications();
    // Check for new notifications every minute
    setInterval(checkNotifications, 60000);

    // Logout function
    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    // Attach logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Check authentication status on page load
    checkAuthStatus();
    
    // Handle file input display
    const fileInput = document.getElementById('eventImage');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name;
            document.getElementById('file-name').textContent = fileName || 'No file chosen';
        });
    }

    // Check if CONFIG is available
    if (typeof CONFIG === 'undefined') {
        console.error('Configuration not loaded!');
    }

    // Example of using the configuration in API calls
    function fetchEventDetails(eventId) {
        return fetch(CONFIG.getApiUrl(`events/${eventId}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error fetching event details:', error);
            });
    }
});
