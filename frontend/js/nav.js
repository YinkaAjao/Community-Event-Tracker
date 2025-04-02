function createNav() {
    const nav = `
        <div class="logo-container">
            <a href="index.html" class="logo">Community<span>Vibe</span></a>
        </div>
        <nav>
            <ul>
                <li><a href="index.html" id="nav-home">Home</a></li>
                <li><a href="events.html" id="nav-events">Events</a></li>
                <li><a href="create-event.html" id="nav-create">Create Event</a></li>
                <!-- Auth nav for logged out users -->
                <div id="auth-nav" style="display: flex;">
                    <li><a href="login.html">Login</a></li>
                    <li><a href="signup.html" class="signup-btn">Sign Up</a></li>
                </div>
                <!-- User nav for logged in users -->
                <div id="user-nav">
                    <li class="user-welcome">
                        <i class="fas fa-user-circle"></i>
                        <span id="username-display">Username</span>
                    </li>
                    <div class="notifications-container">
                        <button class="notifications-toggle">
                            <i class="fas fa-bell"></i>
                            <span id="notification-badge">0</span>
                        </button>
                        <div id="notifications-dropdown"></div>
                    </div>
                    <li><a href="#" id="logout-btn" class="signup-btn">Logout</a></li>
                </div>
            </ul>
        </nav>`;

    const headerStyles = `
        <style>
            #user-nav {
                display: none;
                align-items: center;
                gap: 15px;
            }
            .user-welcome {
                display: flex;
                align-items: center;
                color: var(--text-color);
            }
            .user-welcome i {
                margin-right: 6px;
                color: var(--primary-color);
            }
            .notifications-container {
                position: relative;
            }
            .notifications-toggle {
                background: none;
                border: none;
                cursor: pointer;
                position: relative;
                color: var(--text-color);
            }
            .notifications-toggle i {
                font-size: 1.2em;
            }
            #notification-badge {
                position: absolute;
                top: -5px;
                right: -10px;
                background-color: var(--primary-color);
                color: #fff;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 0.8em;
            }
            #notifications-dropdown {
                display: none;
                position: absolute;
                top: 30px;
                right: 0;
                background-color: #fff;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                width: 250px;
                z-index: 1000;
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', headerStyles);
    document.querySelector('header').innerHTML = nav;
    
    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navId = {
        'index.html': 'nav-home',
        'events.html': 'nav-events',
        'create-event.html': 'nav-create'
    }[currentPage];
    
    if (navId) {
        document.getElementById(navId)?.classList.add('active');
    }
}
