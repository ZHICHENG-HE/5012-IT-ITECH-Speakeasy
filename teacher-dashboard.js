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
    try {
        const response = await fetch('http://127.0.0.1:8000/api/courses/');
        if (response.ok) {
            const allCourses = await response.json();
            const myCourses = allCourses.filter(c => c.teacher_name === user.username);
            
            coursesList.innerHTML = '';
            if (myCourses.length === 0) {
                coursesList.innerHTML = '<p style="padding: 15px; color: #888;">No courses created yet.</p>';
                return;
            }
            
            // Only show 3 course
            myCourses.slice(0, 3).forEach(course => {
                coursesList.innerHTML += `
                    <div class="course-item">
                        <span>${course.title}</span>
                        <a href="teachercourse.html" class="course-link">View →</a>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error:', error);
        coursesList.innerHTML = '<p style="padding: 15px; color: red;">Network error.</p>';
    }
}

// Get student submissions
async function loadRecentSubmissions(user) {
    const assignmentsList = document.getElementById('dashboardAssignmentsList');
    try {
        const response = await fetch('http://127.0.0.1:8000/api/submissions/teacher/', {
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const submissions = await response.json();
            
            assignmentsList.innerHTML = '';
            if (submissions.length === 0) {
                assignmentsList.innerHTML = '<p style="padding: 15px; color: #888;">No recent submissions. 🎉</p>';
                return;
            }
            
            // Only show 3 most recent submissions
            submissions.slice(0, 3).forEach(sub => {
                assignmentsList.innerHTML += `
                    <div class="assignment-item">
                        <div class="assignment-info">
                            <span style="font-weight: bold; color: #333;">${sub.assignment_title}</span>
                            <span class="student-count">Submitted by: ${sub.student_name}</span>
                        </div>
                        <a href="teacher-grade.html" class="assignment-link">Grade →</a>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error:', error);
        assignmentsList.innerHTML = '<p style="padding: 15px; color: red;">Network error.</p>';
    }
}