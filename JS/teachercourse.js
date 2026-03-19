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
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const template = document.getElementById('courseCardTemplate');

    courseList.innerHTML = '';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';

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

            if (myCourses.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            // Render course card
            myCourses.forEach(course => {
                const clone = template.content.cloneNode(true);
                clone.querySelector('.course-title-text').textContent = course.title;
                
                const shortDesc = course.description.substring(0, 60) + (course.description.length > 60 ? '...' : '');
                clone.querySelector('.course-desc-text').textContent = shortDesc;
                
                const inviteInput = clone.querySelector('.invite-input');
                const inviteBtn = clone.querySelector('.invite-btn');
                
                inviteInput.id = `invite-email-${course.id}`;
                inviteBtn.addEventListener('click', () => inviteStudent(course.id));

                clone.querySelector('.edit-btn').addEventListener('click', () => openEditModal(course));
                clone.querySelector('.add-module-btn').addEventListener('click', () => openModuleModal(course.id));
                
                courseList.appendChild(clone);
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

window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.openEditModal = function(course) {
    document.getElementById('editCourseId').value = course.id;
    document.getElementById('editCourseTitle').value = course.title;
    document.getElementById('editCourseDesc').value = course.description;
    document.getElementById('editCourseModal').style.display = 'block';
}

window.openModuleModal = function(courseId) {
    document.getElementById('targetCourseId').value = courseId;
    document.getElementById('addModuleForm').reset();
    document.getElementById('addModuleModal').style.display = 'block';
}

// Update edited course
document.getElementById('editCourseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const courseId = document.getElementById('editCourseId').value;
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/courses/${courseId}/edit/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: document.getElementById('editCourseTitle').value,
                description: document.getElementById('editCourseDesc').value
            })
        });

        if (response.ok) {
            alert('Course updated successfully!');
            closeModal('editCourseModal');
            loadMyCourses(user);
        } else {
            alert('Failed to update course. Did you add the backend API?');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Update new Module
document.getElementById('addModuleForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch('http://127.0.0.1:8000/api/modules/create/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                course_id: document.getElementById('targetCourseId').value,
                title: document.getElementById('moduleTitle').value,
                description: document.getElementById('moduleDescription').value,
                video_url: document.getElementById('moduleVideoUrl').value
            })
        });

        if (response.ok) {
            alert('Module added successfully!');
            closeModal('addModuleModal');
        } else {
            alert('Failed to add module. Did you add the backend API?');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});