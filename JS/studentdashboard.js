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
    document.getElementById('studentName').textContent = user.username || 'Student';
    document.getElementById('studentEmail').textContent = user.email || '';

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
            
            const deadlineList = document.getElementById('dashboardDeadlineList');
            const deadlineEmpty = document.getElementById('deadlinesEmptyState');
            const deadlineTemplate = document.getElementById('dashboardDeadlineTemplate');

            if (deadlineList) {
                deadlineList.innerHTML = '';
                deadlineEmpty.style.display = 'none';
                
                if (upcoming.length === 0) {
                    deadlineEmpty.style.display = 'block';
                } else {
                    upcoming.forEach(item => {
                        const clone = deadlineTemplate.content.cloneNode(true);
                        clone.querySelector('.deadline-course').textContent = item.title;
                        clone.querySelector('.deadline-date').textContent = `Due: ${item.due_date}`;
                        deadlineList.appendChild(clone);
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
            const courseList = document.getElementById('dashboardCourseList');
            const courseEmpty = document.getElementById('coursesEmptyState');
            const courseTemplate = document.getElementById('dashboardCourseTemplate');
            
            if (courseList) {
                courseList.innerHTML = '';
                courseEmpty.style.display = 'none';
                
                if (courses.length === 0) {
                    courseEmpty.style.display = 'block';
                } else {
                    // Only show 3 course
                    courses.slice(0, 3).forEach(c => {
                        const clone = courseTemplate.content.cloneNode(true);
                        clone.querySelector('.course-title-text').textContent = c.title;
                        clone.querySelector('.course-link').href = `course-detail.html?id=${c.id}`;
                        courseList.appendChild(clone);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}