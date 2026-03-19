document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    let activeContactId = null;

    const contactList = document.getElementById('contactList');
    const contactLoading = document.getElementById('contactLoading');
    const contactEmpty = document.getElementById('contactEmpty');
    const contactError = document.getElementById('contactError');
    const contactTemplate = document.getElementById('contactTemplate');

    const chatHeader = document.getElementById('chatHeader');
    const chatMessages = document.getElementById('chatMessages');
    const chatWelcome = document.getElementById('chatWelcome');
    const chatLoading = document.getElementById('chatLoading');
    const chatEmpty = document.getElementById('chatEmpty');
    const chatError = document.getElementById('chatError');
    const messageTemplate = document.getElementById('messageTemplate');

    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // Get Contacts list
    async function loadContacts() {
        contactLoading.style.display = 'block';
        contactEmpty.style.display = 'none';
        contactError.style.display = 'none';
        contactList.innerHTML = '';

        try {
            const response = await fetch('http://127.0.0.1:8000/api/contacts/', {
                headers: { 'Authorization': `Token ${user.token}` }
            });
            contactLoading.style.display = 'none';
            if (response.ok) {
                const contacts = await response.json();
                renderContacts(contacts);
            } else {
                 contactError.style.display = 'block';
            }
        } catch (error) {
            contactLoading.style.display = 'none';
            contactError.style.display = 'block';
        }
    }

    // Contacts list
    function renderContacts(contacts) {
        if (contacts.length === 0) {
            contactEmpty.style.display = 'block';
            return;
        }

        contacts.forEach(contact => {
            const clone = contactTemplate.content.cloneNode(true);
            const div = clone.querySelector('.contact-item');
            
            // Fill data
            clone.querySelector('.contact-name').textContent = contact.username;

            const roleSpan = clone.querySelector('.contact-role');
            roleSpan.textContent = contact.role.charAt(0).toUpperCase() + contact.role.slice(1);
            roleSpan.classList.add(`role-${contact.role}`);
            
            // Click Contact, load message
            div.addEventListener('click', () => {
                document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                
                activeContactId = contact.id;
                chatHeader.textContent = `Chat with ${contact.username}`;
                messageInput.disabled = false;
                sendBtn.disabled = false;
                
                loadMessages(contact.id);
            });
            
            contactList.appendChild(div);
        });
    }

    // Get message list
    async function loadMessages(contactId) {
        chatMessages.innerHTML = '';
        chatWelcome.style.display = 'none';
        chatEmpty.style.display = 'none';
        chatError.style.display = 'none';
        chatLoading.style.display = 'block';

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/messages/chat/${contactId}/`, {
                headers: { 'Authorization': `Token ${user.token}` }
            });
            chatLoading.style.display = 'none';

            if (response.ok) {
                const messages = await response.json();
                renderMessages(messages);
            } else {
                chatError.style.display = 'block';
            }
        } catch (error) {
            chatLoading.style.display = 'none';
            chatError.style.display = 'block';
        }
    }

    // Chat bubbles
    function renderMessages(messages) {
        if (messages.length === 0) {
            chatEmpty.style.display = 'block';
            return;
        }

        messages.forEach(msg => {
            const isMe = msg.sender === user.id || msg.sender_name === user.username;
            const bubbleClass = isMe ? 'message-outgoing' : 'message-incoming';
            
            const clone = messageTemplate.content.cloneNode(true);
            const bubble = clone.querySelector('.message-bubble');

            bubble.classList.add(bubbleClass);
            clone.querySelector('.message-content').textContent = msg.content;
            clone.querySelector('.message-time').textContent = msg.timestamp;

            chatMessages.appendChild(clone);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send message
    async function sendMessage() {
        const content = messageInput.value.trim();
        if (!content || !activeContactId) return;

        messageInput.value = '';
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/messages/send/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiver_id: activeContactId,
                    content: content
                })
            });

            if (response.ok) {
                // Reload message
                loadMessages(activeContactId);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    loadContacts();
});