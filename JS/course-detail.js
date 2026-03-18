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
        
        const courseData = await response.json(); // Get Course detail and Module list
        
        renderCourseDetails(courseData);
        renderCourseModules(courseData.modules);
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('courseHeader').innerHTML = '<p style="color:red; padding:20px;">Error loading course.</p>';
    }
}

// Render top course information
function renderCourseDetails(course) {
    const headerDiv = document.getElementById('courseHeader');
    const moduleCount = course.modules ? course.modules.length : 0;

    headerDiv.innerHTML = `
        <h1 style="color: #333; margin-bottom: 15px; font-size: 2.5rem;">${course.title}</h1>
        <div class="course-meta" style="margin-bottom: 20px; font-size: 1.1rem;">
            <span style="margin-right: 20px;"> ${moduleCount} Video Modules</span>
            <span style="color: #4CAF50; font-weight: bold;"> Instructor: ${course.teacher_name}</span>
        </div>
        <p class="course-description" style="line-height: 1.6; color: #555; font-size: 1.1rem; max-width: 800px;">
            ${course.description}
        </p>
    `;
}

// Render the module list below
function renderCourseModules(modules) {
    const modulesList = document.getElementById('modulesList');
    
    if (!modules || modules.length === 0) {
        modulesList.innerHTML = '<div class="no-modules">No modules available yet. Teacher is working on it!</div>';
        return;
    }
    
    modulesList.innerHTML = '';
    modules.forEach((module, index) => {
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';
        moduleItem.style = 'display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #fff; border: 1px solid #eee; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';

        const statusHtml = `<span style="background-color: #e8f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">▶ Ready</span>`;
        const linkHref = module.video_url ? module.video_url : "javascript:alert('Teacher hasn\\'t uploaded a video link yet!');";
        const linkHtml = `<a href="${linkHref}" target="_blank" style="background-color: #2196F3; color: white; padding: 8px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; transition: 0.3s;">Watch Video</a>`;
        
        moduleItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
                <div style="background: #f5f5f5; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; color: #666;">
                    M${module.sequence_order || index + 1}
                </div>
                <div>
                    <div style="font-weight: bold; font-size: 18px; color: #333; margin-bottom: 5px;">${module.title}</div>
                    <div style="color: #888; font-size: 14px;">${module.description || 'Video Lesson'}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 20px;">
                ${statusHtml}
                ${linkHtml}
            </div>
        `;
        modulesList.appendChild(moduleItem);
    });
}