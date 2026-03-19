// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    initLogin();
});

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const roleBtns = document.querySelectorAll('.role-btn');
    let currentRole = 'student';

    // Role selection
    roleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            roleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentRole = this.dataset.role;
        });
    });

    // Form submission
    // Form submission
    let isLoginMode = true; 
    const usernameGroup = document.getElementById('usernameGroup');
    const toggleBtn = document.getElementById('toggleModeBtn');
    const loginBtn = document.querySelector('.login-btn');

    // Switch login and register
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            isLoginMode = !isLoginMode;
            clearErrors();

            if (isLoginMode) {
                // Login
                usernameGroup.style.display = 'none';
                loginBtn.textContent = 'Log In';
                toggleBtn.innerHTML = 'Don\'t have an account? <strong style="color: #2196F3;">Sign Up</strong>';
            } else {
                // Register
                usernameGroup.style.display = 'block';
                loginBtn.textContent = 'Sign Up';
                toggleBtn.innerHTML = 'Already have an account? <strong style="color: #2196F3;">Log In</strong>';
            }
        });
    }

    // Submit form, both login and register
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const username = document.getElementById('username') ? document.getElementById('username').value.trim() : '';

        // Verification
        if (!validateEmail(email)) {
            showError('email', 'Please enter a valid email');
            return;
        }
        if (password.length < 6) {
            showError('password', 'Password must be at least 6 characters');
            return;
        }
        if (!isLoginMode && username.length < 3) {
            showError('username', 'Username must be at least 3 characters');
            return;
        }
        
        clearErrors();
        
        const originalBtnText = loginBtn.textContent;
        loginBtn.classList.add('loading');
        loginBtn.textContent = isLoginMode ? 'Logging in...' : 'Signing up...';
        loginBtn.disabled = true;
        
        try {
            // login API or register API
            const endpoint = isLoginMode ? 'http://127.0.0.1:8000/api/login/' : 'http://127.0.0.1:8000/api/register/';
            
            // Packaging
            const payload = { email: email, password: password };
            if (!isLoginMode) {
                payload.username = username;
                payload.role = currentRole;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                if (data.role !== currentRole && data.user?.role !== currentRole) {
                    const actualRole = data.role || data.user.role;
                    showError('email', `Failed: This account belongs to a ${actualRole}, but you selected ${currentRole}.`);
                    return; 
                }

                // Save to local
                localStorage.setItem('user', JSON.stringify({
                    token: data.token,
                    username: data.username || data.user?.username,
                    email: data.email || data.user?.email,
                    role: data.role || data.user?.role
                }));

                window.location.href = currentRole === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
                
            } else {
                let errorMsg = 'Invalid email or password';
                if (!isLoginMode) {
                    errorMsg = data.email ? 'Email already exists' : (data.username ? 'Username already taken' : 'Registration failed');
                }
                showError('password', data.error || errorMsg);
            }
        } catch (error) {
            console.error('Auth error:', error);
            showError('email', 'Network error. Is Django running?');
        } finally {
            loginBtn.classList.remove('loading');
            loginBtn.textContent = originalBtnText;
            loginBtn.disabled = false;
        }
    });
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show error message
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Remove existing error
    removeError(fieldId);
    
    // Add error class
    formGroup.classList.add('error');
    
    // Add error message
    const error = document.createElement('span');
    error.className = 'error-message';
    error.textContent = message;
    formGroup.appendChild(error);
}

// Remove error
function removeError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    formGroup.classList.remove('error');
}

// Clear all errors
function clearErrors() {
    removeError('email');
    removeError('password');
}