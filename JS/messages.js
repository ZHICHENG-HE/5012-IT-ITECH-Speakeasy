document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    let activeContactId = null;

    const contactList = document.getElementById('contactList');
    const chatHeader = document.getElementById('chatHeader');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // Get Contacts list
    async function loadContacts() {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/contacts/', {
                headers: { 'Authorization': `Token ${user.token}` }
            });
            if (response.ok) {
                const contacts = await response.json();
                renderContacts(contacts);
            }
        } catch (error) {
            contactList.innerHTML = '<p style="color:red; padding: 20px;">Error loading contacts</p>';
        }
    }

    // Contacts list
    function renderContacts(contacts) {
        contactList.innerHTML = '';
        if (contacts.length === 0) {
            contactList.innerHTML = '<p style="padding: 20px; color: #888;">No contacts found.</p>';
            return;
        }

        contacts.forEach(contact => {
            const div = document.createElement('div');
            div.className = 'contact-item';
            div.innerHTML = `
                <span class="contact-name">${contact.username}</span>
                <span class="contact-role role-${contact.role}">${contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}</span>
            `;
            
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
        chatMessages.innerHTML = '<p style="text-align: center; color: #888;">Loading messages...</p>';
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/messages/chat/${contactId}/`, {
                headers: { 'Authorization': `Token ${user.token}` }
            });
            if (response.ok) {
                const messages = await response.json();
                renderMessages(messages);
            }
        } catch (error) {
            chatMessages.innerHTML = '<p style="text-align: center; color: red;">Failed to load messages</p>';
        }
    }

    // Chat bubbles
    function renderMessages(messages) {
        chatMessages.innerHTML = '';
        if (messages.length === 0) {
            chatMessages.innerHTML = '<p style="text-align: center; color: #aaa; margin-top: 20px;">No messages yet. Say hi! 👋</p>';
            return;
        }

        messages.forEach(msg => {
            const isMe = msg.sender === user.id || msg.sender_name === user.username;
            const bubbleClass = isMe ? 'message-outgoing' : 'message-incoming';
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message-bubble ${bubbleClass}`;
            msgDiv.innerHTML = `
                <div>${msg.content}</div>
                <div class="message-time">${msg.timestamp}</div>
            `;
            chatMessages.appendChild(msgDiv);
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