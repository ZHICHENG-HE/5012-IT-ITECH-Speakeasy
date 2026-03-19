document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        window.location.href = 'login.html';
        return;
    }

    loadMyCourses(user);
});

async function loadMyCourses(user) {
    const courseList = document.getElementById('teacherCourseList');

    try {
        const response = await fetch('http://127.0.0.1:8000/api/courses/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const allCourses = await response.json();
            const myCourses = allCourses.filter(c => c.teacher_name === user.username);

            courseList.innerHTML = '';

            if (myCourses.length === 0) {
                // If no course
                courseList.innerHTML = `
                    <div style="text-align: center; padding: 50px 20px; background: #fff; border-radius: 8px; border: 1px dashed #ccc;">
                        <span style="font-size: 40px;">📭</span>
                        <p style="color: #666; margin: 15px 0; font-size: 16px;">You haven't created any courses yet.</p>
                        <p style="color: #999; font-size: 14px;">Click the green button above to launch your first course!</p>
                    </div>
                `;
                return;
            }

            // Render course cards
            myCourses.forEach(course => {
                const courseItem = document.createElement('div');
                courseItem.className = 'course-item';
                courseItem.innerHTML = `
                    <div style="flex: 1;">
                        <span class="course-name" style="font-size: 1.2rem; font-weight: bold; color: #2c3e50; display: block; margin-bottom: 5px;">${course.title}</span>
                        <span style="color: #666; font-size: 0.9rem;">${course.description.substring(0, 60)}${course.description.length > 60 ? '...' : ''}</span>
                    </div>
                    <div style="text-align: right;">
                        <span class="student-count" style="background: #e3f2fd; color: #1976d2; padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">Active</span>
                        <div style="display: flex; gap: 5px;">
                            <input type="email" id="invite-email-${course.id}" placeholder="Student Email" style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; width: 150px;">
                            <button onclick="inviteStudent(${course.id})" style="background: #FF9800; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; transition: 0.3s;">+ Invite</button>
                        </div>
                    </div>
                `;
                courseList.appendChild(courseItem);
            });
        } else {
            courseList.innerHTML = '<p style="color: red; padding: 20px; text-align: center;">Failed to load courses.</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        courseList.innerHTML = '<p style="color: red; padding: 20px; text-align: center;">Network error. Is Django running?</p>';
    }
}

// Invite student to the course
window.inviteStudent = async function(courseId) {
    const user = JSON.parse(localStorage.getItem('user'));
    const emailInput = document.getElementById(`invite-email-${courseId}`);
    const email = emailInput.value.trim();
    
    if (!email) {
        alert("Please enter a student's email first!");
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/courses/enroll/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                course_id: courseId,
                email: email
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message || 'Student enrolled successfully! 🎉');
            emailInput.value = '';
        } else {
            alert('Error: ' + (data.error || 'Failed to enroll student.'));
        }
    } catch (error) {
        alert('Network error. Is Django running?');
    }
};