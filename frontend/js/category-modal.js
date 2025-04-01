class CategoryModal {
    constructor() {
        this.categories = [
            'Workshop', 'Festival', 'Meetup', 'Volunteer', 'Market', 'Sports',
            'Music', 'Technology', 'Education', 'Art', 'Food', 'Business'
        ];
        this.createModal();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'categoryModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Select Your Interests</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Choose categories that interest you:</p>
                    <div class="category-grid">
                        ${this.categories.map(category => `
                            <div class="category-item">
                                <input type="checkbox" id="${category.toLowerCase()}" value="${category}">
                                <label for="${category.toLowerCase()}">${category}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary-btn" id="cancelCategories">Cancel</button>
                    <button class="btn primary-btn" id="saveCategories">Save Preferences</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupListeners();
    }

    setupListeners() {
        const modal = document.getElementById('categoryModal');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = document.getElementById('cancelCategories');
        const saveBtn = document.getElementById('saveCategories');

        closeBtn.onclick = () => this.hideModal();
        cancelBtn.onclick = () => this.hideModal();
        saveBtn.onclick = () => this.saveCategories();
    }

    showModal() {
        const modal = document.getElementById('categoryModal');
        modal.style.display = 'flex';
        this.loadUserCategories();
    }

    hideModal() {
        const modal = document.getElementById('categoryModal');
        modal.style.display = 'none';
    }

    async loadUserCategories() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        try {
            const response = await fetch(CONFIG.getApiUrl(`user-categories/${currentUser.id}`));
            const data = await response.json();

            if (data.success) {
                const userCategories = data.data;
                this.categories.forEach(category => {
                    const checkbox = document.getElementById(category.toLowerCase());
                    if (checkbox) {
                        checkbox.checked = userCategories.includes(category);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading user categories:', error);
        }
    }

    async saveCategories() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            alert('Please login to save your preferences');
            window.location.href = 'login.html';
            return;
        }

        const selectedCategories = Array.from(document.querySelectorAll('.category-item input:checked'))
            .map(checkbox => checkbox.value);

        try {
            const response = await fetch(CONFIG.getApiUrl('user-categories'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    categories: selectedCategories
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Preferences saved successfully!');
                this.hideModal();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error saving categories:', error);
            alert('Failed to save preferences. Please try again.');
        }
    }
}

// Initialize the modal
document.addEventListener('DOMContentLoaded', () => {
    window.categoryModal = new CategoryModal();
});
