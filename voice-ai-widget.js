// Voice AI Widget - Super Simple Version
(function() {
    'use strict';
    
    // Prevent multiple loads
    if (window.voiceAIWidgetLoaded) return;
    window.voiceAIWidgetLoaded = true;
    
    // Simple initialization
    function init() {
        // Wait for body
        if (!document.body) {
            setTimeout(init, 50);
            return;
        }
        
        // Check if already exists
        if (document.getElementById('voice-ai-widget')) return;
        
        createWidget();
    }
    
    function createWidget() {
        try {
            // Create button
            const btn = document.createElement('div');
            btn.id = 'voice-ai-widget';
            btn.innerHTML = '🎤';
            btn.style.cssText = `
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 60px;
                height: 60px;
                background: #007bff;
                border-radius: 50%;
                cursor: pointer;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            
            // Create modal
            const modal = document.createElement('div');
            modal.id = 'voice-ai-modal';
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
            
            // Create content
            const content = document.createElement('div');
            content.style.cssText = `
                background: white;
                border-radius: 10px;
                padding: 20px;
                max-width: 400px;
                width: 90%;
                position: relative;
            `;
            
            content.innerHTML = `
                <button id="close-modal" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
                <h3 style="margin: 0 0 15px 0; text-align: center;">🎤 Voice AI</h3>
                <div id="chat-messages" style="height: 200px; border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin-bottom: 10px; overflow-y: auto; background: #f9f9f9;">
                    <div style="padding: 8px; background: white; border-radius: 5px; margin-bottom: 5px;">Hello! How can I help?</div>
                </div>
                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                    <input type="text" id="chat-input" placeholder="Type message..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                    <button id="send-btn" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Send</button>
                </div>
                <div style="text-align: center;">
                    <button id="voice-btn" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">🎤 Voice</button>
                </div>
            `;
            
            modal.appendChild(content);
            
            // Add to page
            document.body.appendChild(btn);
            document.body.appendChild(modal);
            
            // Simple functions
            function showModal() {
                modal.style.display = 'flex';
            }
            
            function hideModal() {
                modal.style.display = 'none';
            }
            
            function addMsg(text, isUser) {
                const area = document.getElementById('chat-messages');
                if (!area) return;
                
                const div = document.createElement('div');
                div.style.cssText = `
                    padding: 8px;
                    background: ${isUser ? '#007bff' : 'white'};
                    color: ${isUser ? 'white' : '#333'};
                    border-radius: 5px;
                    margin-bottom: 5px;
                    ${isUser ? 'text-align: right;' : ''}
                `;
                div.textContent = text;
                area.appendChild(div);
                area.scrollTop = area.scrollHeight;
            }
            
            function sendMsg() {
                const input = document.getElementById('chat-input');
                if (!input) return;
                
                const msg = input.value.trim();
                if (!msg) return;
                
                addMsg(msg, true);
                input.value = '';
                
                // Simple response
                setTimeout(() => {
                    const replies = [
                        'Thanks for your message!',
                        'I understand what you mean.',
                        'That\'s a good question!',
                        'Let me help you with that.',
                        'I\'m here to assist you.',
                        'Great to hear from you!'
                    ];
                    const reply = replies[Math.floor(Math.random() * replies.length)];
                    addMsg(reply, false);
                }, 500);
            }
            
            function voiceInput() {
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
                        const text = event.results[0][0].transcript;
                        const input = document.getElementById('chat-input');
                        if (input) {
                            input.value = text;
                            sendMsg();
                        }
                    };
                    
                    recognition.onend = function() {
                        const btn = document.getElementById('voice-btn');
                        if (btn) {
                            btn.textContent = '🎤 Voice';
                            btn.style.background = '#28a745';
                        }
                    };
                    
                    recognition.onerror = function(event) {
                        console.error('Voice error:', event.error);
                        const btn = document.getElementById('voice-btn');
                        if (btn) {
                            btn.textContent = '🎤 Voice';
                            btn.style.background = '#28a745';
                        }
                        addMsg('Voice recognition error occurred.', false);
                    };
                    
                    recognition.start();
                } else {
                    addMsg('Voice recognition not supported.', false);
                }
            }
            
            // Event listeners
            btn.addEventListener('click', showModal);
            
            // Use setTimeout to ensure elements exist
            setTimeout(() => {
                const closeBtn = document.getElementById('close-modal');
                const sendBtn = document.getElementById('send-btn');
                const input = document.getElementById('chat-input');
                const voiceBtn = document.getElementById('voice-btn');
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', hideModal);
                }
                
                if (modal) {
                    modal.addEventListener('click', function(e) {
                        if (e.target === modal) {
                            hideModal();
                        }
                    });
                }
                
                if (sendBtn) {
                    sendBtn.addEventListener('click', sendMsg);
                }
                
                if (input) {
                    input.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            sendMsg();
                        }
                    });
                }
                
                if (voiceBtn) {
                    voiceBtn.addEventListener('click', voiceInput);
                }
            }, 50);
            
            // Welcome message
            setTimeout(() => {
                addMsg('Welcome! You can type or use voice input.', false);
            }, 1000);
            
        } catch (error) {
            console.error('Widget creation error:', error);
        }
    }
    
    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();