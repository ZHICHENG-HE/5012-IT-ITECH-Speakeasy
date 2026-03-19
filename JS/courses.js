// Courses Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load courses
    loadCourses();
    // Setup search and filter
    setupSearchAndFilter();
});

let allCoursesData = [];

// Load courses from Django Back-end
async function loadCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
    const coursesEmpty = document.getElementById('coursesEmpty');
    const coursesError = document.getElementById('coursesError');

    if (!coursesGrid) return;

    try {
        // Get user and Token
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Get data with Token from Back-end
        const response = await fetch('http://127.0.0.1:8000/api/courses/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch courses');
        }

        const realCourses = await response.json();

        // Put data to card
        allCoursesData = realCourses.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level || 'Universal',
                image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
                modules: 12,
                duration: '20 hours',
                progress: 0,
            }));
            
            renderCourses(allCoursesData);

    } catch (error) {
        console.error('Error fetching courses:', error);
        coursesGrid.innerHTML = '';
        coursesEmpty.style.display = 'none';
        coursesError.style.display = 'block';
    }
}

// Rendering
function renderCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');
    const coursesEmpty = document.getElementById('coursesEmpty');
    const coursesError = document.getElementById('coursesError');
    const template = document.getElementById('courseCardTemplate');
    
    coursesGrid.innerHTML = '';
    coursesError.style.display = 'none';
    
    if (courses.length === 0) {
        coursesEmpty.style.display = 'block';
        return;
    }
    coursesEmpty.style.display = 'none';

    courses.forEach(course => {
        const clone = template.content.cloneNode(true);
        
        // Cover image
        const imageDiv = clone.querySelector('.course-image');
        imageDiv.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${course.image}')`;
        
        // Difficulty Badge
        const levelSpan = clone.querySelector('.course-level');
        levelSpan.textContent = course.level.charAt(0).toUpperCase() + course.level.slice(1);
        levelSpan.classList.add(`level-${course.level}`);
        
        // Text
        clone.querySelector('.course-title').textContent = course.title;
        clone.querySelector('.course-description').textContent = course.description;
        clone.querySelector('.course-modules').textContent = `📚 ${course.modules} modules`;
        clone.querySelector('.course-duration').textContent = `⏱️ ${course.duration}`;
        
        // progress bar
        clone.querySelector('.progress-percent').textContent = `${course.progress}%`;
        clone.querySelector('.progress-fill').style.width = `${course.progress}%`;
        
        // Button
        const btn = clone.querySelector('.course-btn');
        btn.href = `course-detail.html?id=${course.id}`;
        
        if (course.progress === 100) {
            btn.textContent = '✓ Completed';
            btn.classList.add('completed');
        } else if (course.progress === 0) {
            btn.textContent = 'Start Course';
        } else {
            btn.textContent = 'Continue Learning';
        }
        
        coursesGrid.appendChild(clone);
    });
}

// Setup search and filter
function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const levelFilter = document.getElementById('levelFilter');
    
    function filterCourses() {
        const searchTerm = searchInput.value.toLowerCase();
        const level = levelFilter.value;
        
        const filtered = allCoursesData.filter(course => {
            // Search filter
            const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
                                    course.description.toLowerCase().includes(searchTerm);         
            // Level filter
            const matchesLevel = level === 'all' || course.level === level;
            
            return matchesSearch && matchesLevel;
        });
        
        loadCourses(filtered);
    }
    
    searchInput.addEventListener('input', filterCourses);
    levelFilter.addEventListener('change', filterCourses);
}