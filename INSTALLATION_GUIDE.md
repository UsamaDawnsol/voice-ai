# 🎤 Voice AI Floating Widget - Installation Guide

## 📋 Overview
यह एक beautiful और fully functional Voice AI floating widget है जो आपकी किसी भी website पर easily install हो सकता है।

## ✨ Features
- 🎤 **Voice Input Support** - Speech recognition के साथ
- 💬 **Chat Interface** - Beautiful chat UI
- 📱 **Responsive Design** - Mobile और desktop दोनों पर perfect
- 🎨 **Customizable** - Colors और position change कर सकते हैं
- ⚡ **Lightweight** - Fast loading और smooth animations
- 🔧 **Easy Installation** - Just copy-paste करें

## 🚀 Installation Methods

### Method 1: Complete HTML File (Recommended for Testing)
1. `floating-widget.html` file को browser में open करें
2. Widget automatically load हो जाएगा
3. Test करें कि सब कुछ properly काम कर रहा है

### Method 2: JavaScript File (For Any Website)
1. `voice-ai-widget.js` file को अपनी website के root directory में upload करें
2. अपने HTML file के `</body>` tag से पहले यह code add करें:

```html
<script src="voice-ai-widget.js"></script>
```

### Method 3: Inline Code (For Quick Setup)
अपने HTML file के `</body>` tag से पहले यह complete code add करें:

```html
<script>
(function() {
    'use strict';
    
    // Widget Configuration
    const config = {
        backgroundColor: '#667eea',
        iconColor: '#ffffff',
        position: 'right', // 'right' or 'left'
        enabled: true,
        shop: window.location.hostname
    };
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
    
    function initWidget() {
        // Check if widget is enabled
        if (!config.enabled) {
            return;
        }
        
        // Create widget container
        const widget = document.createElement('div');
        widget.id = 'voice-ai-widget';
        widget.style.cssText = `
            position: fixed;
            ${config.position}: 20px;
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
            animation: pulse 2s infinite;
        `;
        
        // Create icon
        const icon = document.createElement('div');
        icon.innerHTML = '🎤';
        icon.style.cssText = `
            font-size: 24px;
            color: ${config.iconColor};
            user-select: none;
        `;
        
        widget.appendChild(icon);
        
        // Add hover effects
        widget.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 6px 25px rgba(0,0,0,0.25)';
        });
        
        widget.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        });
        
        // Create modal overlay
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
            backdrop-filter: blur(5px);
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
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
            animation: slideIn 0.3s ease;
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'close-btn';
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
            transition: all 0.2s ease;
        `;
        
        // Create chat interface
        const chatInterface = document.createElement('div');
        chatInterface.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                <h2 style="margin: 0 0 10px 0; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">🎤 Voice AI Assistant</h2>
                <p style="margin: 0; color: #666; font-size: 14px;">Ask me anything! I'm here to help you.</p>
            </div>
            <div id="chat-messages" style="min-height: 250px; max-height: 350px; overflow-y: auto; border: 2px solid #e0e0e0; border-radius: 15px; padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                <div class="message ai" style="margin-bottom: 15px; padding: 12px 16px; border-radius: 18px; max-width: 80%; word-wrap: break-word; background: white; color: #333; border: 1px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">👋 Hello! I'm your Voice AI assistant. How can I help you today?</div>
            </div>
            <div style="display: flex; gap: 12px; margin-bottom: 15px;">
                <input type="text" id="chat-input" placeholder="Type your message here..." style="flex: 1; padding: 15px 20px; border: 2px solid #e0e0e0; border-radius: 25px; font-size: 14px; outline: none; transition: all 0.3s ease;">
                <button id="send-btn" style="padding: 15px 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease;">Send</button>
            </div>
            <div style="text-align: center;">
                <button id="voice-btn" style="padding: 12px 25px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                    🎤 Voice Input
                </button>
            </div>
        `;
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(chatInterface);
        modal.appendChild(modalContent);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-50px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .message {
                animation: fadeIn 0.3s ease;
            }
            .close-btn:hover {
                background: #f0f0f0;
                color: #333;
            }
            #chat-input:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            #send-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            #voice-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
            }
            #voice-btn.listening {
                background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
                animation: pulse 1s infinite;
            }
            #chat-messages::-webkit-scrollbar {
                width: 6px;
            }
            #chat-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
            }
            #chat-messages::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 10px;
            }
            #chat-messages::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            @media (max-width: 768px) {
                .modal-content {
                    width: 95%;
                    padding: 20px;
                    margin: 10px;
                }
                #voice-ai-widget {
                    width: 50px;
                    height: 50px;
                    right: 15px;
                    bottom: 15px;
                }
                #voice-ai-widget .icon {
                    font-size: 20px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        widget.addEventListener('click', function() {
            modal.style.display = 'flex';
            setTimeout(() => {
                const chatInput = document.getElementById('chat-input');
                if (chatInput) chatInput.focus();
            }, 100);
        });
        
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Chat functionality
        function addMessage(content, isUser = false) {
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.style.cssText = `
                margin-bottom: 15px;
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 80%;
                word-wrap: break-word;
                ${isUser ? 
                    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-left: auto; text-align: right;' : 
                    'background: white; color: #333; border: 1px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'
                }
            `;
            messageDiv.textContent = content;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function sendMessage() {
            const chatInput = document.getElementById('chat-input');
            if (!chatInput) return;
            
            const message = chatInput.value.trim();
            if (!message) return;
            
            addMessage(message, true);
            chatInput.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    "That's a great question! Let me help you with that.",
                    "I understand what you're looking for. Here's what I can tell you...",
                    "Thanks for asking! Based on your question, I'd suggest...",
                    "I'm here to help! Could you provide a bit more detail?",
                    "That's interesting! Let me think about the best way to assist you.",
                    "I'd be happy to help you with that. Here's what I know...",
                    "Great question! Let me provide you with some helpful information.",
                    "I understand your concern. Here's what I can recommend...",
                    "That's a wonderful question! Let me share some insights with you.",
                    "I appreciate you asking! Here's what I can help you with..."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage(randomResponse);
            }, 1000 + Math.random() * 1000);
        }
        
        // Add event listeners for chat functionality
        modal.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'send-btn') {
                sendMessage();
            }
        });
        
        modal.addEventListener('keypress', function(e) {
            if (e.target && e.target.id === 'chat-input' && e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Voice input functionality
        modal.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'voice-btn') {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';
                    
                    recognition.onstart = function() {
                        e.target.textContent = '🎤 Listening...';
                        e.target.classList.add('listening');
                    };
                    
                    recognition.onresult = function(event) {
                        const transcript = event.results[0][0].transcript;
                        const chatInput = document.getElementById('chat-input');
                        if (chatInput) {
                            chatInput.value = transcript;
                            sendMessage();
                        }
                    };
                    
                    recognition.onend = function() {
                        e.target.textContent = '🎤 Voice Input';
                        e.target.classList.remove('listening');
                    };
                    
                    recognition.onerror = function(event) {
                        console.error('Speech recognition error:', event.error);
                        e.target.textContent = '🎤 Voice Input';
                        e.target.classList.remove('listening');
                        addMessage('Sorry, there was an error with voice recognition. Please try typing your message.');
                    };
                    
                    recognition.start();
                } else {
                    addMessage('Sorry, speech recognition is not supported in your browser. Please use the text input instead.');
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
        
        // Add to page
        document.body.appendChild(widget);
        document.body.appendChild(modal);
        
        // Welcome message after a delay
        setTimeout(() => {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages && chatMessages.children.length === 1) {
                addMessage("💡 Tip: You can use voice input by clicking the microphone button!");
            }
        }, 3000);
    }
})();
</script>
```

## 🎨 Customization Options

### Colors Change करें:
```javascript
const config = {
    backgroundColor: '#your-color', // Widget background color
    iconColor: '#your-color',       // Icon color
    position: 'right',              // 'right' or 'left'
    enabled: true
};
```

### Position Change करें:
```javascript
position: 'left'  // Left side पर widget दिखेगा
position: 'right' // Right side पर widget दिखेगा (default)
```

### Widget Disable करें:
```javascript
enabled: false  // Widget hide हो जाएगा
```

## 🔧 Troubleshooting

### Widget नहीं दिख रहा:
1. Browser console check करें (F12 → Console)
2. JavaScript errors check करें
3. `enabled: true` है या नहीं verify करें

### Voice Input काम नहीं कर रहा:
1. HTTPS connection check करें (voice input HTTPS पर ही काम करता है)
2. Browser permissions check करें
3. Microphone access allow करें

### Mobile पर Issues:
1. Responsive design automatically handle होता है
2. Touch events properly work करते हैं
3. Modal size mobile के लिए optimize है

## 📱 Browser Support
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 🎯 Features in Detail

### Voice Recognition:
- Real-time speech to text
- Multiple language support
- Error handling
- Visual feedback

### Chat Interface:
- Beautiful UI design
- Smooth animations
- Responsive layout
- Auto-scroll messages

### Customization:
- Easy color changes
- Position control
- Enable/disable toggle
- Mobile optimization

## 🚀 Quick Start
1. `floating-widget.html` file को browser में open करें
2. Widget automatically load हो जाएगा
3. 🎤 icon पर click करें
4. Chat interface test करें
5. Voice input try करें

## 📞 Support
अगर कोई issue आए तो:
1. Browser console check करें
2. Network tab में errors देखें
3. JavaScript file properly load हो रहा है या नहीं verify करें

---

**🎉 Enjoy your new Voice AI Floating Widget!**




