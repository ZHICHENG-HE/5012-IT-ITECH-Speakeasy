document.addEventListener('DOMContentLoaded', function() {
    // Permissions Enquiry
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    
    let allAssignmentsData = [];
    
    // Get data
    async function loadAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        const errorState = document.getElementById('assignmentsError');
        const emptyState = document.getElementById('assignmentsEmpty');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/assignments/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                allAssignmentsData = await response.json();
                renderAssignments(allAssignmentsData, 'all');
                updateStats(allAssignmentsData);
            } else {
                assignmentsList.innerHTML = '';
                errorState.textContent = 'Failed to load assignments.';
                errorState.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            assignmentsList.innerHTML = '';
            errorState.textContent = 'Network error. Check if Django is running.';
            errorState.style.display = 'block';
        }
    }

    // Render data to card
    function renderAssignments(assignments, filterType = 'all') {
        const assignmentsList = document.getElementById('assignmentsList');
        const emptyState = document.getElementById('assignmentsEmpty');
        const errorState = document.getElementById('assignmentsError');
        const template = document.getElementById('assignmentCardTemplate');

        assignmentsList.innerHTML = ''; 
        emptyState.style.display = 'none';
        errorState.style.display = 'none';

        const now = new Date();
        let filteredAssignments = assignments;

        if (filterType === 'completed') {
            filteredAssignments = assignments.filter(a => a.is_completed);
        } else if (filterType === 'pending') {w
            filteredAssignments = assignments.filter(a => !a.is_completed && new Date(a.due_date) >= now);
        } else if (filterType === 'overdue') {
            filteredAssignments = assignments.filter(a => !a.is_completed && new Date(a.due_date) < now);
        }

        if (filteredAssignments.length === 0) {
            emptyState.textContent = `No ${filterType} assignments found. 🎉`;
            emptyState.style.display = 'block';
            return;
        }

        filteredAssignments.forEach(assignment => {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.assignment-card-title').textContent = assignment.title;
            clone.querySelector('.due-date-text').textContent = assignment.due_date;
            clone.querySelector('.points-text').textContent = assignment.points;
            clone.querySelector('.assignment-card-desc').textContent = assignment.description;

            // Button State
            const gradeBox = clone.querySelector('.grade-box');
            const pendingBadge = clone.querySelector('.pending-grade-badge');
            const submitBtn = clone.querySelector('.submit-work-btn');

            if (assignment.is_completed) {
                if (assignment.grade !== null && assignment.grade !== undefined) {
                    // Grade
                    gradeBox.style.display = 'block';
                    clone.querySelector('.score-badge').textContent = `🏆 Score: ${assignment.grade}`;
                    clone.querySelector('.feedback-text').textContent = `📝 ${assignment.feedback || 'Good job!'}`;
                } else {
                    // Not grade
                    pendingBadge.style.display = 'inline-block';
                }
            } else {
                // Not submit
                submitBtn.style.display = 'inline-block';
                submitBtn.href = `assignment-submit.html?id=${assignment.id}`;
            }

            assignmentsList.appendChild(clone);
        });
    }

    // Statistical data on assignments
    function updateStats(assignments) {
        const now = new Date();
        let total = assignments.length;
        let completed = 0;
        let overdue = 0;

        // Check status
        assignments.forEach(assignment => {
            if (assignment.is_completed) {
                completed++;
            } else {
                const dueDate = new Date(assignment.due_date);
                if (dueDate < now) {
                    overdue++;
                }
            }
        });

        let pending = total - completed;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statPending').textContent = pending;
        document.getElementById('statOverdue').textContent = overdue;
    }

    // Implementing 'All Pending Completed Overdue' click events
    function setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filterType = this.dataset.filter;
                renderAssignments(allAssignmentsData, filterType);
            });
        });
    }

    setupFilters();
    loadAssignments();
});