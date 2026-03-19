document.addEventListener('DOMContentLoaded', function() {
    // Permissions Enquiry
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    
    const assignmentsList = document.getElementById('assignmentsList');
    let allAssignmentsData = [];
    
    async function loadAssignments() {
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
                setupFilters();
            } else {
                assignmentsList.innerHTML = '<p class="error">Failed to load assignments.</p>';
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            assignmentsList.innerHTML = '<p class="error">Network error. Check if Django is running.</p>';
        }
    }

    // Render data to card
    function renderAssignments(assignments, filterType = 'all') {
        assignmentsList.innerHTML = ''; 

        const now = new Date();
        let filteredAssignments = assignments;
        if (filterType === 'completed') {
            filteredAssignments = assignments.filter(a => a.is_completed);
        } else if (filterType === 'pending') {
            filteredAssignments = assignments.filter(a => !a.is_completed && new Date(a.due_date) >= now);
        } else if (filterType === 'overdue') {
            filteredAssignments = assignments.filter(a => !a.is_completed && new Date(a.due_date) < now);
        }

        if (filteredAssignments.length === 0) {
            assignmentsList.innerHTML = `<p style="padding: 20px; text-align: center; color: #FFD700;">No ${filterType} assignments found. 🎉</p>`;
            return;
        }

        filteredAssignments.forEach(assignment => {
            const card = document.createElement('div');
            card.className = 'assignment-card'; 
            card.style = 'border: 1px solid #ddd; padding: 20px; margin-bottom: 15px; border-radius: 8px; background-color: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);';
            
            // Button Style
            let buttonHtml = '';
            if (assignment.is_completed) {
                if (assignment.grade !== null && assignment.grade !== undefined) {
                    // Grade
                    buttonHtml = `
                        <div style="text-align: right;">
                            <span style="background-color: #FFD700; color: #8B6508; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 18px;">🏆 Score: ${assignment.grade}</span>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">📝 ${assignment.feedback || 'Good job!'}</p>
                        </div>
                    `;
                } else {
                    // Not grade
                    buttonHtml = `<span style="background-color: #9e9e9e; color: white; padding: 10px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">✅ Pending Grade</span>`;
                }
            } else {
                // Not submit
                buttonHtml = `
                    <a href="assignment-submit.html?id=${assignment.id}" 
                       style="background-color: #4CAF50; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);">
                       Submit Work
                    </a>
                `;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="flex: 1; padding-right: 30px;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${assignment.title}</h3>
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>Due:</strong> ${assignment.due_date} | 
                            <strong>Points:</strong> ${assignment.points}
                        </p>
                        <p style="color: #555; margin-top: 10px; line-height: 1.5;">${assignment.description}</p>
                    </div>
                    <div style="flex-shrink: 0;">
                        ${buttonHtml} </div>
                </div>
            `;
            assignmentsList.appendChild(card);
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

    loadAssignments();
});