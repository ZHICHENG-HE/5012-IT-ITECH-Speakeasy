document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        alert('Unauthorized: Teachers only.');
        window.location.href = 'login.html';
        return;
    }

    const submissionsList = document.getElementById('submissionsList');

    // Get submission data
    async function loadSubmissions() {
        const errorState = document.getElementById('errorState');
        const submissionsList = document.getElementById('submissionsList');
        const emptyState = document.getElementById('emptyState');
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/submissions/teacher/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const submissions = await response.json();
                renderSubmissions(submissions);
            } else {
                showError('Failed to load submissions.');
            }
        } catch (error) {
            console.error('Network error:', error);
            showError('Network error. Is Django running?');
        }

        function showError(msg) {
            submissionsList.innerHTML = '';
            emptyState.style.display = 'none';
            errorState.textContent = msg;
            errorState.style.display = 'block';
        }
    }

    // Show data
    function renderSubmissions(submissions) {
        const submissionsList = document.getElementById('submissionsList');
        const emptyState = document.getElementById('emptyState');
        const errorState = document.getElementById('errorState');
        const template = document.getElementById('submissionCardTemplate');

        submissionsList.innerHTML = '';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';

        if (submissions.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        submissions.forEach(sub => {
            const clone = template.content.cloneNode(true);

            // Push data
            clone.querySelector('.submission-title').textContent = sub.assignment_title;
            clone.querySelector('.student-name-email').textContent = `${sub.student_name} (${sub.student_email})`;
            clone.querySelector('.submitted-at-text').textContent = sub.submitted_at;
            clone.querySelector('.download-btn').href = sub.file_url;

            const gradedBox = clone.querySelector('.graded-box');
            const gradingForm = clone.querySelector('.grading-form');

            if (sub.grade !== null) {
                // If grade
                gradedBox.style.display = 'block';
                clone.querySelector('.graded-score').textContent = `Score: ${sub.grade}/100`;
                clone.querySelector('.graded-feedback').textContent = `Feedback: ${sub.feedback || 'None'}`;
            } else {
                gradingForm.style.display = 'flex';
                
                const gradeInput = clone.querySelector('.grade-input');
                const feedbackInput = clone.querySelector('.feedback-input');
                const saveBtn = clone.querySelector('.save-grade-btn');

                gradeInput.id = `grade-${sub.id}`;
                feedbackInput.id = `feedback-${sub.id}`;

                saveBtn.addEventListener('click', () => submitGrade(sub.id));
            }

            submissionsList.appendChild(clone);
        });
    }

    loadSubmissions();

    // Submit grade
    window.submitGrade = async function(submissionId) {
    const gradeInput = document.getElementById(`grade-${submissionId}`).value;
    const feedbackInput = document.getElementById(`feedback-${submissionId}`).value;
    
    if (!gradeInput) {
        alert('Please enter a score!');
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/submissions/${submissionId}/grade/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grade: parseInt(gradeInput),
                feedback: feedbackInput
            })
        });

        if (response.ok) {
            alert('Grade saved successfully!');
            location.reload();
        } else {
            alert('Failed to save grade.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
});