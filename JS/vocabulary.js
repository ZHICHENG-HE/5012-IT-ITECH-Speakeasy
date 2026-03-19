document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    let wordsData = [];
    let currentIndex = 0;
    let currentWord = null;

    // Get vocabulary
    async function fetchVocabulary() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/vocabulary/', {
                headers: { 'Authorization': `Token ${user.token}` }
            });
            
            if (response.ok) {
                wordsData = await response.json();
                if (wordsData.length > 0) {
                    loadWord(0);
                } else {
                    document.getElementById('wordDisplay').textContent = "No words yet!";
                }
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('wordDisplay').textContent = "Error loading words";
        }
    }

    // Show vocabulary
    function loadWord(index) {
        if (index >= wordsData.length) {
            index = 0;
        }
        currentIndex = index;
        currentWord = wordsData[currentIndex];
        
        document.getElementById('wordDisplay').textContent = currentWord.word;
        document.getElementById('answerInput').value = '';
        document.getElementById('answerInput').disabled = false;
        document.getElementById('feedbackMessage').innerHTML = '';
        document.getElementById('feedbackMessage').className = 'feedback-message';
        document.getElementById('answerInput').focus();
    }

    // Click 'dontknow'
    document.getElementById('dontKnowBtn').addEventListener('click', function() {
        if (!currentWord) return;
        const feedback = document.getElementById('feedbackMessage');
        feedback.innerHTML = `💡 Meaning: ${currentWord.meaning}`;
        feedback.className = 'feedback-message incorrect';
        document.getElementById('answerInput').disabled = true;
    });

    // Click 'check'
    function handleCheck() {
        if (!currentWord) return;
        const answer = document.getElementById('answerInput').value.trim();
        const feedback = document.getElementById('feedbackMessage');
        
        if (!answer) {
            feedback.innerHTML = 'Please enter your answer';
            feedback.className = 'feedback-message incorrect';
            return;
        }
        
        // If include correct answer, make it correct
        if (currentWord.meaning.includes(answer) || answer.includes(currentWord.meaning)) {
            feedback.innerHTML = '✓ Correct! You are amazing!';
            feedback.className = 'feedback-message correct';
            document.getElementById('answerInput').disabled = true;
        } else {
            feedback.innerHTML = `✗ Incorrect. The correct meaning is: ${currentWord.meaning}`;
            feedback.className = 'feedback-message incorrect';
            document.getElementById('answerInput').disabled = true;
        }
    }

    document.getElementById('checkBtn').addEventListener('click', handleCheck);
    
    // Enter -> Check
    document.getElementById('answerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleCheck();
    });

    // Click 'next'
    document.getElementById('nextBtn').addEventListener('click', function() {
        if (!currentWord) return;
        loadWord(currentIndex + 1);
    });

    fetchVocabulary();

    // Add vocabulary to back-end
    document.getElementById('addNewWordBtn').addEventListener('click', async function() {
        const word = document.getElementById('newWordInput').value.trim();
        const meaning = document.getElementById('newMeaningInput').value.trim();
        const btn = this;
        
        if (!word || !meaning) {
            alert('Please enter both word and meaning!');
            return;
        }
        
        btn.textContent = 'Adding...';
        btn.disabled = true;
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/vocabulary/add/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ word: word, meaning: meaning })
            });
            
            if (response.ok) {
                // Reset input field
                document.getElementById('newWordInput').value = '';
                document.getElementById('newMeaningInput').value = '';
                
                fetchVocabulary(); 
                alert('Word added successfully! 🎉');
            } else {
                alert('Failed to add word.');
            }
        } catch (error) {
            alert('Network error.');
        } finally {
            btn.textContent = 'Add';
            btn.disabled = false;
        }
    });
});