(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.voiceAIWidgetLoaded) {
        return;
    }
    window.voiceAIWidgetLoaded = true;
    
    // Widget Configuration
    const config = {
        backgroundColor: '#667eea',
        iconColor: '#ffffff',
        position: 'right',
        enabled: true
    };
    
    // Safe initialization function
    function initVoiceAIWidget() {
        try {
            // Check if document is ready
            if (!document.body) {
                setTimeout(initVoiceAIWidget, 100);
                return;
            }
            
            // Check if widget already exists
            if (document.getElementById('voice-ai-widget')) {
                return;
            }
            
            createWidget();
        } catch (error) {
            console.error('Voice AI Widget Error:', error);
        }
    }
    
    function createWidget() {
        // Create main widget button
        const widget = document.createElement('div');
        widget.id = 'voice-ai-widget';
        widget.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            border: none;
        `;
        
        // Add icon
        const icon = document.createElement('div');
        icon.innerHTML = '🎤';
        icon.style.cssText = `
            font-size: 24px;
            color: white;
            user-select: none;
        `;
        widget.appendChild(icon);
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'voice-ai-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 1000000;
            display: none;
            align-items: center;
            justify-content: center;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #666;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        `;
        
        // Create chat interface
        const chatInterface = document.createElement('div');
        chatInterface.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">🎤 Voice AI Assistant</h2>
                <p style="margin: 0; color: #666; font-size: 14px;">Ask me anything!</p>
            </div>
            <div id="chat-messages" style="min-height: 250px; max-height: 350px; overflow-y: auto; border: 2px solid #e0e0e0; border-radius: 15px; padding: 20px; margin-bottom: 20px; background: #f9f9f9;">
                <div style="margin-bottom: 15px; padding: 12px 16px; border-radius: 18px; background: white; color: #333; border: 1px solid #e0e0e0;">👋 Hello! How can I help you today?</div>
            </div>
            <div style="display: flex; gap: 12px; margin-bottom: 15px;">
                <input type="text" id="chat-input" placeholder="Type your message..." style="flex: 1; padding: 15px 20px; border: 2px solid #e0e0e0; border-radius: 25px; font-size: 14px; outline: none;">
                <button id="send-btn" style="padding: 15px 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px;">Send</button>
            </div>
            <div style="text-align: center;">
                <button id="voice-btn" style="padding: 12px 25px; background: #28a745; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px;">
                    🎤 Voice Input
                </button>
            </div>
        `;
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(chatInterface);
        modal.appendChild(modalContent);
        
        // Add to page
        document.body.appendChild(widget);
        document.body.appendChild(modal);
        
        // Event handlers
        function openModal() {
            modal.style.display = 'flex';
            setTimeout(() => {
                const input = document.getElementById('chat-input');
                if (input) input.focus();
            }, 100);
        }
        
        function closeModal() {
            modal.style.display = 'none';
        }
        
        function addMessage(text, isUser = false) {
            const messages = document.getElementById('chat-messages');
            if (!messages) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                margin-bottom: 15px;
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 80%;
                word-wrap: break-word;
                ${isUser ? 
                    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-left: auto; text-align: right;' : 
                    'background: white; color: #333; border: 1px solid #e0e0e0;'
                }
            `;
            messageDiv.textContent = text;
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
            const input = document.getElementById('chat-input');
            if (!input) return;
            
            const message = input.value.trim();
            if (!message) return;
            
            addMessage(message, true);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "That's a great question! Let me help you.",
                    "I understand what you're looking for.",
                    "Thanks for asking! Here's what I suggest...",
                    "I'm here to help! Can you provide more details?",
                    "That's interesting! Let me think about this.",
                    "I'd be happy to help you with that.",
                    "Great question! Let me provide some information.",
                    "I understand your concern. Here's my recommendation."
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                addMessage(response);
            }, 1000);
        }
        
        function handleVoiceInput() {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';
                
                recognition.onstart = function() {
                    const voiceBtn = document.getElementById('voice-btn');
                    if (voiceBtn) {
                        voiceBtn.textContent = '🎤 Listening...';
                        voiceBtn.style.background = '#dc3545';
                    }
                };
                
                recognition.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    const input = document.getElementById('chat-input');
                    if (input) {
                        input.value = transcript;
                        sendMessage();
                    }
                };
                
                recognition.onend = function() {
                    const voiceBtn = document.getElementById('voice-btn');
                    if (voiceBtn) {
                        voiceBtn.textContent = '🎤 Voice Input';
                        voiceBtn.style.background = '#28a745';
                    }
                };
                
                recognition.onerror = function(event) {
                    console.error('Speech recognition error:', event.error);
                    const voiceBtn = document.getElementById('voice-btn');
                    if (voiceBtn) {
                        voiceBtn.textContent = '🎤 Voice Input';
                        voiceBtn.style.background = '#28a745';
                    }
                    addMessage('Sorry, there was an error with voice recognition.');
                };
                
                recognition.start();
            } else {
                addMessage('Speech recognition not supported in this browser.');
            }
        }
        
        // Attach event listeners
        widget.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Chat event listeners
        setTimeout(() => {
            const sendBtn = document.getElementById('send-btn');
            const chatInput = document.getElementById('chat-input');
            const voiceBtn = document.getElementById('voice-btn');
            
            if (sendBtn) {
                sendBtn.addEventListener('click', sendMessage);
            }
            
            if (chatInput) {
                chatInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
            }
            
            if (voiceBtn) {
                voiceBtn.addEventListener('click', handleVoiceInput);
            }
        }, 100);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
        
        // Welcome message
        setTimeout(() => {
            addMessage("💡 Tip: You can use voice input by clicking the microphone button!");
        }, 2000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVoiceAIWidget);
    } else {
        setTimeout(initVoiceAIWidget, 100);
    }
})();
