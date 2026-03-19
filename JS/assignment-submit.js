// Assignment Submit Page JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    // Check student
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    // Get assignment id
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');

    if (!assignmentId) {
        alert('No assignment selected!');
        window.location.href = 'assignments.html';
        return;
    }

    const loadingText = document.getElementById('assignmentLoading');
    const errorText = document.getElementById('assignmentError');
    const detailCard = document.getElementById('assignmentDetailCard');
    const formArea = document.getElementById('submissionFormArea');
    
    const form = document.getElementById('submitForm');
    const fileInput = document.getElementById('assignmentFile');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const filePreview = document.getElementById('filePreview');
    const fileNameDisplay = filePreview.querySelector('.file-name');
    const removeFileBtn = filePreview.querySelector('.remove-file');
    const submitBtn = document.querySelector('.submit-btn');
    const placeholder = document.querySelector('.file-upload-placeholder');

    // Get Data
    async function loadAssignmentDetails() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/assignments/', {
                headers: { 'Authorization': `Token ${user.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const assignment = data.find(a => a.id == assignmentId);
                
                if (assignment) {
                    document.getElementById('detailTitle').textContent = assignment.title;
                    document.getElementById('detailDesc').textContent = assignment.description;
                    document.getElementById('detailDue').textContent = assignment.due_date;
                    document.getElementById('detailPoints').textContent = assignment.points;
                    document.getElementById('detailStatus').textContent = assignment.is_completed ? 'Completed' : 'Pending';

                    // Switch UI
                    loadingText.style.display = 'none';
                    detailCard.style.display = 'block';
                    formArea.style.display = 'block';
                } else {
                    throw new Error("Assignment not found");
                }
            } else {
                throw new Error("Failed to fetch data");
            }
        } catch (error) {
            console.error(error);
            loadingText.style.display = 'none';
            errorText.textContent = "Error loading assignment details. Is Django running?";
            errorText.style.display = 'block';
        }
    }

    // File handling and dragging
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(this.files[0]);
    });

    fileUploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', e => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', e => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    function handleFileSelect(file) {
        if (file) {
            // Limite 10MB
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                fileInput.value = '';
                return;
            }
            fileNameDisplay.textContent = file.name;
            placeholder.style.display = 'none';
            filePreview.style.display = 'flex';
        }
    }

    // Delete file
    removeFileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.value = '';
        placeholder.style.display = 'block';
        filePreview.style.display = 'none';
    });

    // Send form to back-end
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to upload!');
            return;
        }

        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('assignment', assignmentId);
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/submissions/create/', {
                method: 'POST',
                headers: { 'Authorization': `Token ${user.token}` },
                body: formData
            });

            if (response.ok) {
                alert('Assignment submitted successfully! 🎉');
                window.location.href = 'assignments.html';
            } else {
                const errorData = await response.json();
                console.error('Backend errors:', errorData);
                alert('Failed to submit. Please check console for details.');
            }
        } catch (error) {
            console.error('Network Error:', error);
            alert('Network error. Is Django running?');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
    
    loadAssignmentDetails();
});