class Toast {
    constructor() {
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'complete') {
            this.init();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.init());
        }
    }

    init() {
        // Create container only if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    show(options) {
        const { title, message, type = 'success', duration = 3000 } = options;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.querySelector('.toast-container');
        container.appendChild(toast);

        // Show the toast
        setTimeout(() => toast.classList.add('show'), 10);

        // Add close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toast));

        // Auto-hide after duration
        if (duration) {
            setTimeout(() => this.hide(toast), duration);
        }
    }

    hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }
}

// Initialize only after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.toast = new Toast();
});