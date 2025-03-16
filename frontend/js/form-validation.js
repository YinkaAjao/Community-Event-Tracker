// js/form-validation.js
document.addEventListener('DOMContentLoaded', function() {
    // Event creation form validation
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const eventTitle = document.getElementById('eventTitle').value.trim();
            const eventCategory = document.getElementById('eventCategory').value;
            const eventDate = document.getElementById('eventDate').value;
            const startTime = document.getElementById('startTime').value;
            const eventDescription = document.getElementById('eventDescription').value.trim();
            
            let isValid = true;
            let errorMessage = '';
            
            if (!eventTitle) {
                isValid = false;
                errorMessage += 'Please enter an event title.\n';
            }
            
            if (!eventCategory) {
                isValid = false;
                errorMessage += 'Please select an event category.\n';
            }
            
            if (!eventDate) {
                isValid = false;
                errorMessage += 'Please select an event date.\n';
            }
            
            if (!startTime) {
                isValid = false;
                errorMessage += 'Please enter a start time.\n';
            }
            
            if (!eventDescription) {
                isValid = false;
                errorMessage += 'Please enter an event description.\n';
            }
            
            if (!isValid) {
                alert('Please fix the following errors:\n' + errorMessage);
                return;
            }
            
            // If valid, you would typically submit to server
            // For demo, just show success message
            alert('Event created successfully! (This is a demo - in a real app, the event would be saved)');
            window.location.href = 'events.html';
        });
    }
    
    // Login form validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            let isValid = true;
            let errorMessage = '';
            
            if (!email) {
                isValid = false;
                errorMessage += 'Please enter your email address.\n';
            } else if (!isValidEmail(email)) {
                isValid = false;
                errorMessage += 'Please enter a valid email address.\n';
            }
            
            if (!password) {
                isValid = false;
                errorMessage += 'Please enter your password.\n';
            }
            
            if (!isValid) {
                alert('Please fix the following errors:\n' + errorMessage);
                return;
            }
            
            // For demo purposes
            alert('Login successful! (This is a demo - in a real app, you would be logged in)');
            window.location.href = 'index.html';
        });
    }
    
    // Sign up form validation
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            let isValid = true;
            let errorMessage = '';
            
            if (!username) {
                isValid = false;
                errorMessage += 'Please enter a username.\n';
            }
            
            if (!email) {
                isValid = false;
                errorMessage += 'Please enter your email address.\n';
            } else if (!isValidEmail(email)) {
                isValid = false;
                errorMessage += 'Please enter a valid email address.\n';
            }
            
            if (!password) {
                isValid = false;
                errorMessage += 'Please enter a password.\n';
            }
            
            if (password !== confirmPassword) {
                isValid = false;
                errorMessage += 'Passwords do not match.\n';
            }
            
            if (!isValid) {
                alert('Please fix the following errors:\n' + errorMessage);
                return;
            }
            
            // For demo purposes
            alert('Registration successful! (This is a demo - in a real app, your account would be created)');
            window.location.href = 'index.html';
        });
    }
    
    // Helper function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});