// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Redirect to login if not logged in as student
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    const userInfoDiv = document.querySelector('.user-info');
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `
            <h3>${user.username}</h3>
            <p>${user.email}</p>
        `;
    }

    // Initialize dashboard data
    loadDashboardData(user.token);
});

// Load dashboard data
async function loadDashboardData(token) {
    try {
        // Assignment API
        const response = await fetch('http://127.0.0.1:8000/api/assignments/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        
        if (response.ok) {
            const assignments = await response.json();
            
            // Progress bar
            const total = assignments.length;
            const completed = assignments.filter(a => a.is_completed).length;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
            
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
                progressBar.textContent = progress + '%';
                if (progress < 10) progressBar.style.color = '#333';
            }
            
            // Show deadline
            const now = new Date();
            const upcoming = assignments.filter(a => {
                const due = new Date(a.due_date);
                return !a.is_completed && due >= now;
            }).slice(0, 3);
            
            const deadlineList = document.querySelector('.deadline-list');
            if (deadlineList) {
                deadlineList.innerHTML = '';
                if (upcoming.length === 0) {
                    deadlineList.innerHTML = '<p style="color: #4CAF50; padding: 15px 0; font-weight: bold;">🎉 No pending deadlines. Great job!</p>';
                } else {
                    upcoming.forEach(item => {
                        const deadlineItem = document.createElement('div');
                        deadlineItem.className = 'deadline-item';
                        deadlineItem.innerHTML = `
                            <span class="deadline-course">${item.title}</span>
                            <span class="deadline-date" style="color: #e74c3c; font-weight: bold;">Due: ${item.due_date}</span>
                        `;
                        deadlineList.appendChild(deadlineItem);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }

    // Loading My courses
    try {
        const courseRes = await fetch('http://127.0.0.1:8000/api/courses/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        
        if (courseRes.ok) {
            const courses = await courseRes.json();
            const courseList = document.querySelector('.course-list');
            
            if (courseList) {
                courseList.innerHTML = '';
                if (courses.length === 0) {
                    courseList.innerHTML = '<p style="color: #888; padding: 10px 0;">No courses available.</p>';
                } else {
                    // Show 3 courses
                    courses.slice(0, 3).forEach(c => {
                        courseList.innerHTML += `
                            <div class="course-item">
                                <span>${c.title}</span>
                                <a href="course-detail.html?id=${c.id}" class="course-link">Continue →</a>
                            </div>
                        `;
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}