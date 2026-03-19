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
    } else {
        loadAssignmentDetails(assignmentId);
    }

    const form = document.getElementById('submitForm');
    const fileInput = document.getElementById('assignmentFile');
    const filePreview = document.getElementById('filePreview');
    const fileNameDisplay = filePreview.querySelector('.file-name');
    const removeFileBtn = filePreview.querySelector('.remove-file');
    const submitBtn = document.querySelector('.submit-btn');

    // Preview
    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
            filePreview.style.display = 'flex';
        } else {
            filePreview.style.display = 'none';
        }
    });

    // Delete file
    removeFileBtn.addEventListener('click', function() {
        fileInput.value = '';
        filePreview.style.display = 'none';
    });

    // Send file
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Check value
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to upload!');
            return;
        }

        // Show uploading
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        // Packing file data
        const formData = new FormData();
        formData.append('assignment', assignmentId);
        formData.append('file', fileInput.files[0]);

        //try submit
        try {
            const response = await fetch('http://127.0.0.1:8000/api/submissions/create/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${user.token}`
                },
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
});

// Load assignment details
async function loadAssignmentDetails(id) {
    const user = JSON.parse(localStorage.getItem('user'));
    const detailDiv = document.getElementById('assignmentDetail');
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/assignments/`, {
            headers: { 'Authorization': `Token ${user.token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const assignment = data.find(a => a.id == id);
            
            if (assignment) {
                detailDiv.innerHTML = `
                    <div style="padding: 30px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        <h1 style="margin-bottom: 10px; color: #2c3e50;">${assignment.title}</h1>
                        <p style="color: #666; margin-bottom: 20px; font-size: 1.1rem;">${assignment.description}</p>
                        <div style="display: flex; gap: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                            <span><strong>Due:</strong> ${assignment.due_date}</span>
                            <span><strong>Points:</strong> ${assignment.points}</span>
                            <span style="text-transform: capitalize;"><strong>Status:</strong> ${assignment.status}</span>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error("Failed to render assignment details", error);
    }
}

// Setup file upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('assignmentFile');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const filePreview = document.getElementById('filePreview');
    const fileName = filePreview.querySelector('.file-name');
    const removeBtn = filePreview.querySelector('.remove-file');
    const placeholder = fileUploadArea.querySelector('.file-upload-placeholder');
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                fileInput.value = '';
                return;
            }
            
            // Check file type
            const allowedTypes = ['application/pdf', 'application/msword', 
                                 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                 'text/plain'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please upload PDF, DOC, DOCX, or TXT files only');
                fileInput.value = '';
                return;
            }
            
            // Show preview
            placeholder.style.display = 'none';
            filePreview.style.display = 'flex';
            fileName.textContent = file.name;
        }
    });
    
    // Handle drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
    
    // Remove file
    removeBtn.addEventListener('click', function() {
        fileInput.value = '';
        placeholder.style.display = 'block';
        filePreview.style.display = 'none';
    });
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('submitForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('assignmentFile');
        const comments = document.getElementById('comments').value;
        
        // Validate file
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to upload');
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        // Simulate upload (in real app, this would send to server)
        setTimeout(() => {
            // Show success message
            showSuccessMessage();
            
            // Reset form
            form.reset();
            
            // Reset file upload area
            const placeholder = document.querySelector('.file-upload-placeholder');
            const filePreview = document.getElementById('filePreview');
            placeholder.style.display = 'block';
            filePreview.style.display = 'none';
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Assignment';
            
            // Redirect back to assignments after 2 seconds
            setTimeout(() => {
                window.location.href = 'assignments.html';
            }, 2000);
            
        }, 1500);
    });
}

// Show success message
function showSuccessMessage() {
    const form = document.getElementById('submitForm');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <span>✓ Assignment submitted successfully!</span>
        <button class="close-btn" onclick="this.parentElement.remove()">✕</button>
    `;
    
    form.insertBefore(successDiv, form.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}