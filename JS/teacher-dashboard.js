// Teacher Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is teacher
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    document.getElementById('teacherName').textContent = user.username || 'Teacher';
    document.getElementById('teacherEmail').textContent = user.email || '';

    // Get data
    loadTeacherCourses(user);
    loadRecentSubmissions(user);
});

async function loadTeacherCourses(user) {
    const coursesList = document.getElementById('dashboardCoursesList');
    const emptyState = document.getElementById('coursesEmptyState');
    const errorState = document.getElementById('coursesErrorState');
    const template = document.getElementById('dashboardCourseTemplate');

    coursesList.innerHTML = '';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

    try {
        const response = await fetch('http://127.0.0.1:8000/api/courses/');
        if (response.ok) {
            const allCourses = await response.json();
            const myCourses = allCourses.filter(c => c.teacher_name === user.username);
            
            coursesList.innerHTML = '';
            if (myCourses.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            // Only show 3 course
            myCourses.slice(0, 3).forEach(course => {
                const clone = template.content.cloneNode(true);
                clone.querySelector('.course-title-text').textContent = course.title;
                coursesList.appendChild(clone);
            });
        } else {
            errorState.textContent = 'Failed to load courses.';
            errorState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorState.textContent = 'Network error. Is Django running?';
        errorState.style.display = 'block';
        }
}

// Get student submissions
async function loadRecentSubmissions(user) {
    const assignmentsList = document.getElementById('dashboardAssignmentsList');
    const emptyState = document.getElementById('submissionsEmptyState');
    const errorState = document.getElementById('submissionsErrorState');
    const template = document.getElementById('dashboardSubmissionTemplate');

    assignmentsList.innerHTML = '';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

    try {
        const response = await fetch('http://127.0.0.1:8000/api/submissions/teacher/', {
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const submissions = await response.json();
            
            if (submissions.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            
            // Only show 3 most recent submissions
            submissions.slice(0, 3).forEach(sub => {
                const clone = template.content.cloneNode(true);
                clone.querySelector('.assignment-title-text').textContent = sub.assignment_title;
                clone.querySelector('.student-count').textContent = `Submitted by: ${sub.student_name}`;
                assignmentsList.appendChild(clone);
            });
        } else {
            errorState.textContent = 'Failed to load submissions.';
            errorState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorState.textContent = 'Network error. Is Django running?';
        errorState.style.display = 'block';
    }
}