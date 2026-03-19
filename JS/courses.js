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

// Load courses from Django Back-end
async function loadCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
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
        coursesGrid.innerHTML = '';
        
        if (realCourses.length === 0) {
            coursesGrid.innerHTML = `
                <div class="no-results">
                    <p>No courses found. Teacher needs to add some!</p>
                </div>
            `;
            return;
        }

        // Put data to card
        realCourses.forEach(course => {
            const courseDataForUI = {
                id: course.id,
                title: course.title,
                description: course.description,
                level: 'intermediate', // 暂时写死
                image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
                modules: 12,
                duration: '20 hours',
                progress: 0,
                completed: false
            };
            
            const card = createCourseCard(courseDataForUI);
            coursesGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching courses:', error);
        coursesGrid.innerHTML = '<p class="error">Error loading courses from server.</p>';
    }
}

// Create course card element
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    // Level class for styling
    const levelClass = `level-${course.level}`;
    
    // Level display text
    const levelText = course.level.charAt(0).toUpperCase() + course.level.slice(1);
    
    // Button text based on progress
    let btnText = 'Continue Learning';
    let btnClass = 'course-btn';
    
    if (course.progress === 100) {
        btnText = '✓ Completed';
        btnClass = 'course-btn completed';
    } else if (course.progress === 0) {
        btnText = 'Start Course';
    }
    
    card.innerHTML = `
        <div class="course-image" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${course.image}')">
            <span class="course-level ${levelClass}">${levelText}</span>
        </div>
        <div class="course-content">
            <h3 class="course-title">${course.title}</h3>
            <p class="course-description">${course.description}</p>
            
            <div class="course-meta">
                <span>📚 ${course.modules} modules</span>
                <span>⏱️ ${course.duration}</span>
            </div>
            
            <div class="course-progress">
                <div class="progress-text">
                    <span>Progress</span>
                    <span>${course.progress}%</span>
                </div>
                <div class="progress-bar-small">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
            </div>
            
            <a href="course-detail.html?id=${course.id}" class="${btnClass}">${btnText}</a>
        </div>
    `;
    
    return card;
}

// Setup search and filter
function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const levelFilter = document.getElementById('levelFilter');
    
    function filterCourses() {
        const searchTerm = searchInput.value.toLowerCase();
        const level = levelFilter.value;
        
        const filtered = coursesData.filter(course => {
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

// Get course by ID (for course detail page)
function getCourseById(id) {
    return coursesData.find(course => course.id === parseInt(id));
}