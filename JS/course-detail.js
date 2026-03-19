document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (courseId) {
        fetchCourseData(courseId, user.token);
    } else {
        alert('No course selected');
        window.location.href = 'courses.html';
    }
});

// Get data from back-end
async function fetchCourseData(courseId, token) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/courses/${courseId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch course detail');
        
        // Get Course detail and Module list
        const courseData = await response.json();
        
        courseError.style.display = 'none';
        courseHeader.style.display = 'block';

        renderCourseDetails(courseData);
        renderCourseModules(courseData.modules);
    } catch (error) {
        console.error('Error:', error);
        courseHeader.style.display = 'none';
        courseError.textContent = 'Error loading course details.';
        courseError.style.display = 'block';
        }
}

// Render top course information
function renderCourseDetails(course) {
    const moduleCount = course.modules ? course.modules.length : 0;

    document.getElementById('detailTitle').textContent = course.title;
    document.getElementById('detailModuleCount').textContent = `📚 ${moduleCount} Video Modules`;
    document.getElementById('detailInstructor').textContent = `👨‍🏫 Instructor: ${course.teacher_name}`;
    document.getElementById('detailDescription').textContent = course.description;
}

// Render the module list below
function renderCourseModules(modules) {
    const modulesList = document.getElementById('modulesList');
    const modulesEmpty = document.getElementById('modulesEmpty');
    const template = document.getElementById('moduleTemplate');

    modulesList.innerHTML = '';
    
    if (!modules || modules.length === 0) {
        modulesEmpty.style.display = 'block';
        return;
    }
    
    modulesEmpty.style.display = 'none';

    modules.forEach((module, index) => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.module-number-box').textContent = `M${module.sequence_order || index + 1}`;
        clone.querySelector('.module-title').textContent = module.title;
        clone.querySelector('.module-meta').textContent = module.description || 'Video Lesson';
        
        // Button click
        const watchBtn = clone.querySelector('.watch-btn');
        if (module.video_url) {
            watchBtn.href = module.video_url;
        } else {
            watchBtn.href = "#";
            watchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Teacher hasn't uploaded a video link yet!");
            });
        }
        
        modulesList.appendChild(clone);
    });
}