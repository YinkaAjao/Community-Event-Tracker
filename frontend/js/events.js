// js/events.js
document.addEventListener('DOMContentLoaded', function() {
    // Filter functionality for events page
    const filterChips = document.querySelectorAll('.filter-chip');
    const eventCards = document.querySelectorAll('.event-card');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all chips
            filterChips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            this.classList.add('active');
            
            const filter = this.textContent.trim();
            
            // Show all events if "All" is selected
            if (filter === 'All') {
                eventCards.forEach(card => {
                    card.style.display = 'block';
                });
                return;
            }
            
            // Otherwise, filter events
            eventCards.forEach(card => {
                const eventTag = card.querySelector('.event-tag').textContent;
                if (eventTag === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});