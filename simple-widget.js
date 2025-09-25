// Simple Voice AI Widget - No Errors Version
(function() {
    'use strict';
    
    // Check if already loaded
    if (window.simpleWidgetLoaded) return;
    window.simpleWidgetLoaded = true;
    
    // Wait for DOM
    function waitForDOM() {
        if (document.body) {
            createSimpleWidget();
        } else {
            setTimeout(waitForDOM, 100);
        }
    }
    
    function createSimpleWidget() {
        try {
            // Check if widget exists
            if (document.getElementById('simple-voice-widget')) return;
            
            // Create widget button
            const widget = document.createElement('div');
            widget.id = 'simple-voice-widget';
            widget.innerHTML = '🎤';
            widget.style.cssText = `
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 60px;
                height: 60px;
                background: #667eea;
                border-radius: 50%;
                cursor: pointer;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            `;
            
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'simple-voice-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000000;
                display: none;
                align-items: center;
                justify-content: center;
            `;
            
            // Create modal content
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            `;
            
            content.innerHTML = `
                <button id="close-btn" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                <h2 style="text-align: center; margin-bottom: 20px;">🎤 Voice AI Assistant</h2>
                <div id="messages" style="min-height: 200px; max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 10px; padding: 15px; margin-bottom: 15px; background: #f9f9f9;">
                    <div style="padding: 10px; background: white; border-radius: 8px; margin-bottom: 10px;">👋 Hello! How can I help you?</div>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <input type="text" id="message-input" placeholder="Type your message..." style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px;">
                    <button id="send-btn" style="padding: 12px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Send</button>
                </div>
                <div style="text-align: center;">
                    <button id="voice-btn" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer;">🎤 Voice Input</button>
                </div>
            `;
            
            modal.appendChild(content);
            
            // Add to page
            document.body.appendChild(widget);
            document.body.appendChild(modal);
            
            // Simple functions
            function openModal() {
                modal.style.display = 'flex';
            }
            
            function closeModal() {
                modal.style.display = 'none';
            }
            
            function addMessage(text, isUser = false) {
                const messages = document.getElementById('messages');
                if (!messages) return;
                
                const div = document.createElement('div');
                div.style.cssText = `
                    padding: 10px;
                    background: ${isUser ? '#667eea' : 'white'};
                    color: ${isUser ? 'white' : '#333'};
                    border-radius: 8px;
                    margin-bottom: 10px;
                    ${isUser ? 'margin-left: auto; text-align: right; max-width: 80%;' : ''}
                `;
                div.textContent = text;
                messages.appendChild(div);
                messages.scrollTop = messages.scrollHeight;
            }
            
            function sendMessage() {
                const input = document.getElementById('message-input');
                if (!input) return;
                
                const message = input.value.trim();
                if (!message) return;
                
                addMessage(message, true);
                input.value = '';
                
                // Simple response
                setTimeout(() => {
                    const responses = [
                        "That's a great question!",
                        "I understand what you're looking for.",
                        "Thanks for asking!",
                        "I'm here to help!",
                        "That's interesting!",
                        "I'd be happy to help you.",
                        "Great question!",
                        "I understand your concern."
                    ];
                    const response = responses[Math.floor(Math.random() * responses.length)];
                    addMessage(response);
                }, 1000);
            }
            
            function handleVoice() {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';
                    
                    recognition.onstart = function() {
                        const btn = document.getElementById('voice-btn');
                        if (btn) {
                            btn.textContent = '🎤 Listening...';
                            btn.style.background = '#dc3545';
                        }
                    };
                    
                    recognition.onresult = function(event) {
                        const transcript = event.results[0][0].transcript;
                        const input = document.getElementById('message-input');
                        if (input) {
                            input.value = transcript;
                            sendMessage();
                        }
                    };
                    
                    recognition.onend = function() {
                        const btn = document.getElementById('voice-btn');
                        if (btn) {
                            btn.textContent = '🎤 Voice Input';
                            btn.style.background = '#28a745';
                        }
                    };
                    
                    recognition.onerror = function(event) {
                        console.error('Speech error:', event.error);
                        const btn = document.getElementById('voice-btn');
                        if (btn) {
                            btn.textContent = '🎤 Voice Input';
                            btn.style.background = '#28a745';
                        }
                        addMessage('Sorry, voice recognition error occurred.');
                    };
                    
                    recognition.start();
                } else {
                    addMessage('Speech recognition not supported.');
                }
            }
            
            // Event listeners
            widget.addEventListener('click', openModal);
            
            // Use setTimeout to ensure elements exist
            setTimeout(() => {
                const closeBtn = document.getElementById('close-btn');
                const sendBtn = document.getElementById('send-btn');
                const input = document.getElementById('message-input');
                const voiceBtn = document.getElementById('voice-btn');
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', closeModal);
                }
                
                if (modal) {
                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) {
                            closeModal();
                        }
                    });
                }
                
                if (sendBtn) {
                    sendBtn.addEventListener('click', sendMessage);
                }
                
                if (input) {
                    input.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });
                }
                
                if (voiceBtn) {
                    voiceBtn.addEventListener('click', handleVoice);
                }
            }, 100);
            
            // Welcome message
            setTimeout(() => {
                addMessage("💡 Tip: You can use voice input!");
            }, 2000);
            
        } catch (error) {
            console.error('Widget creation error:', error);
        }
    }
    
    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDOM);
    } else {
        waitForDOM();
    }
})();
