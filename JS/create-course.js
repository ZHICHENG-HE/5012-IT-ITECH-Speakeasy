document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        alert('Unauthorized! Teachers only.');
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('createCourseForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get data
        const title = document.getElementById('courseTitle').value.trim();
        const description = document.getElementById('courseDesc').value.trim();
        const moduleTitle = document.getElementById('moduleTitle').value.trim();
        const videoUrl = document.getElementById('videoUrl').value.trim();

        // Only one time click
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '🚀 Publishing...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/courses/new/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    module_title: moduleTitle,
                    video_url: videoUrl
                })
            });

            if (response.ok) {
                alert('🎉 Course created successfully! Your students can now see it.');
                window.location.href = 'teachercourse.html';
            } else {
                const errorData = await response.json();
                alert('Failed to create course: ' + (errorData.error || 'Unknown error'));
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Network Error:', error);
            alert('Network error. Is Django running?');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});