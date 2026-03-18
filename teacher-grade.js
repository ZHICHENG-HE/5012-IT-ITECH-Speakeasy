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
                submissionsList.innerHTML = '<p style="color: red;">Failed to load submissions.</p>';
            }
        } catch (error) {
            console.error('Network error:', error);
            submissionsList.innerHTML = '<p style="color: red;">Network error. Is Django running?</p>';
        }
    }

    // Show data
    function renderSubmissions(submissions) {
        submissionsList.innerHTML = ''; 

        if (submissions.length === 0) {
            submissionsList.innerHTML = '<div style="background: white; padding: 30px; text-align: center; border-radius: 8px; border: 1px solid #ddd;">No submissions found yet. ☕</div>';
            return;
        }

        submissions.forEach(sub => {
            const card = document.createElement('div');
            card.style = 'background: white; border: 1px solid #e0e0e0; padding: 20px; margin-bottom: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';

            let gradingHtml = '';
            if (sub.grade !== null) {
                gradingHtml = `
                    <div style="margin-top: 15px; padding: 10px; background-color: #e8f5e9; border-radius: 5px; border-left: 4px solid #4CAF50;">
                        <span style="color: #2e7d32; font-weight: bold;">Score: ${sub.grade}/100</span>
                        <p style="margin: 5px 0 0 0; color: #555; font-size: 14px;">Feedback: ${sub.feedback || 'None'}</p>
                    </div>
                `;
            } else {
                gradingHtml = `
                    <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
                        <input type="number" id="grade-${sub.id}" placeholder="Score (0-100)" style="width: 100px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <input type="text" id="feedback-${sub.id}" placeholder="Feedback..." style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                        <button onclick="submitGrade(${sub.id})" style="background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">Save Grade</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="flex: 1; padding-right: 20px;">
                    <h3 style="margin: 0 0 8px 0; color: #2c3e50;">${sub.assignment_title}</h3>
                    <p style="margin: 0; color: #555; font-size: 14px;">
                        <strong>Student:</strong> ${sub.student_name} (${sub.student_email})
                    </p>
                    <p style="margin: 5px 0 0 0; color: #888; font-size: 13px;">
                        Submitted at: ${sub.submitted_at}
                    </p>
                    ${gradingHtml} </div>
                <div>
                    <a href="${sub.file_url}" target="_blank" download
                       style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; transition: 0.3s; display: inline-block;">
                       📥 Download
                    </a>
                </div>
            `;
            submissionsList.appendChild(card);
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