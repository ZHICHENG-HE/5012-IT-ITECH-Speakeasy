document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        window.location.href = 'login.html';
        return;
    }
    
    loadModulesForDropdown(user.token);
    const form = document.getElementById('assignmentForm');
    const messageDiv = document.getElementById('message');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const course = document.getElementById('course').value;
        const dueDate = document.getElementById('dueDate').value;
        const description = document.getElementById('description').value;
        const points = document.getElementById('points').value;
        
        // Simple validation
        if (!title || !course || !dueDate || !description || !points) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Please fill in all fields';
            return;
        }
        
        // Send to sever
        const submitBtn = document.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Posting...';
        submitBtn.disabled = true
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/assignments/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${user.token}`
                },
                body: JSON.stringify({
                    course: course,
                    title: title,
                    description: description,
                    due_date: dueDate,
                    points: points
                })
            });

            if (response.ok) {
                // Show success message
                messageDiv.className = 'message success';
                messageDiv.textContent = 'Assignment posted successfully! 🎉';
                form.reset(); // Reset form
            } else {
                const data = await response.json();
                console.error('Backend errors:', data);
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Failed: Please check the form data.';
            }
        } catch (error) {
            console.error('Network Error:', error);
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Server connection failed.';
        } finally {
            // Reset submit button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;

            // Clear message after 3 seconds
            setTimeout(() => {
                if (messageDiv) {
                    messageDiv.textContent = '';
                    messageDiv.className = 'message';
                }
            }, 3000);
        }
    });

    async function loadModulesForDropdown(token) {
    const selectElement = document.getElementById('course');
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/courses/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const courses = await response.json();
            const user = JSON.parse(localStorage.getItem('user'));
                const myCourses = courses.filter(c => c.teacher_name === user.username);
                selectElement.innerHTML = '';
            
            if (myCourses.length === 0) {
                selectElement.innerHTML = '<option value="">No course found. Please create a course first.</option>';
                return;
            }
            
            // Show Course module data
            myCourses.forEach(mod => {
                const option = document.createElement('option');
                option.value = mod.id;
                option.textContent = mod.title;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading modules:', error);
        selectElement.innerHTML = '<option value="">Error loading options</option>';
    }
}
});