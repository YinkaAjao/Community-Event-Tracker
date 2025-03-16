// js/main.js
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Handle file input display
    const fileInput = document.getElementById('eventImage');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0]?.name;
            document.getElementById('file-name').textContent = fileName || 'No file chosen';
        });
    }
});