import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const timestamp = url.searchParams.get("t"); // Get timestamp for cache busting
  
  if (!shop) {
    return new Response("Shop parameter required", { status: 400 });
  }

  // Get widget configuration from database
  let widgetSettings = await db.widgetSettings.findUnique({
    where: { shop: shop }
  });

  // If no settings found, create default ones
  if (!widgetSettings) {
    widgetSettings = await db.widgetSettings.create({
      data: {
        shop: shop,
        backgroundColor: "#007bff",
        iconColor: "#ffffff",
        position: "right",
        isActive: true
      }
    });
  }

  const config = {
    backgroundColor: widgetSettings.backgroundColor,
    iconColor: widgetSettings.iconColor,
    position: widgetSettings.position,
    shop: shop,
    enabled: widgetSettings.isActive,
    // Add timestamp to force cache refresh
    timestamp: Date.now(),
    // Add settings hash to detect changes
    settingsHash: btoa(JSON.stringify({
      bg: widgetSettings.backgroundColor,
      icon: widgetSettings.iconColor,
      pos: widgetSettings.position,
      active: widgetSettings.isActive
    }))
  };

  const embedScript = `
(function() {
  'use strict';
  
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  // Widget configuration
  window.voiceAIWidget = ${JSON.stringify(config)};
  
  // Check if widget is enabled
  if (!window.voiceAIWidget || !window.voiceAIWidget.enabled) {
    return;
  }
  
  const config = window.voiceAIWidget;
  
  // Check if settings have changed and refresh widget if needed
  const currentSettingsHash = localStorage.getItem('voiceAIWidgetSettingsHash');
  if (currentSettingsHash !== config.settingsHash) {
    console.log('Voice AI Widget: Settings changed, refreshing widget...');
    
    // Settings changed, remove existing widget and reinitialize
    const existingWidget = document.getElementById('voice-ai-widget');
    const existingModal = document.getElementById('voice-ai-modal');
    if (existingWidget) existingWidget.remove();
    if (existingModal) existingModal.remove();
    
    // Clear initialization flag
    delete window.voiceAIWidgetInitialized;
    
    // Update settings hash
    localStorage.setItem('voiceAIWidgetSettingsHash', config.settingsHash);
    
    console.log('Voice AI Widget: Widget removed, will reinitialize with new settings');
  }
  
  // Prevent multiple initializations
  if (window.voiceAIWidgetInitialized) {
    return;
  }
  window.voiceAIWidgetInitialized = true;
  
  // Wait for DOM to be ready
  function initWidget() {
    if (!document.body) {
      setTimeout(initWidget, 100);
      return;
    }
    
    if (document.getElementById('voice-ai-widget')) {
      return;
    }
    
    createWidget();
  }
  
  function createWidget() {
    try {
      // Create widget button
      const widget = document.createElement('div');
      widget.id = 'voice-ai-widget';
      widget.setAttribute('data-shopify-widget', 'true');
      widget.style.cssText = \`
        position: fixed;
        \${config.position}: 20px;
        bottom: 20px;
        width: 60px;
        height: 60px;
        background-color: \${config.backgroundColor};
        border-radius: 50%;
        cursor: pointer;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: \${config.iconColor};
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        border: none;
      \`;
      
      // Add icon
      widget.innerHTML = '🎤';
      
      // Add hover effects
      widget.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 25px rgba(0,0,0,0.25)';
      });
      
      widget.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      });
      
      // Create modal
      const modal = document.createElement('div');
      modal.id = 'voice-ai-modal';
      modal.setAttribute('data-shopify-modal', 'true');
      modal.style.cssText = \`
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
      \`;
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'voice-ai-modal-content';
      modalContent.style.cssText = \`
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
      \`;
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.className = 'voice-ai-close-btn';
      closeBtn.style.cssText = \`
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
      \`;
      
      // Create chat interface
      const chatInterface = document.createElement('div');
      chatInterface.innerHTML = \`
        <div class="voice-ai-header" style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
          <h2 style="margin: 0 0 10px 0; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">🎤 Voice AI Assistant</h2>
          <p style="margin: 0; color: #666; font-size: 14px;">Ask me anything about \${config.shop || 'this store'}!</p>
        </div>
        <div id="voice-ai-chat-messages" style="min-height: 250px; max-height: 350px; overflow-y: auto; border: 2px solid #e0e0e0; border-radius: 15px; padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
          <div class="voice-ai-message" style="margin-bottom: 15px; padding: 12px 16px; border-radius: 18px; background: white; color: #333; border: 1px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">👋 Hello! I'm your Voice AI assistant. How can I help you today?</div>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 15px;">
          <input type="text" id="voice-ai-chat-input" placeholder="Type your message here..." style="flex: 1; padding: 15px 20px; border: 2px solid #e0e0e0; border-radius: 25px; font-size: 14px; outline: none; transition: all 0.3s ease;">
          <button id="voice-ai-send-btn" style="padding: 15px 25px; background: \${config.backgroundColor}; color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease;">Send</button>
        </div>
        <div style="text-align: center;">
          <button id="voice-ai-voice-btn" style="padding: 12px 25px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
            🎤 Voice Input
          </button>
        </div>
      \`;
      
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(chatInterface);
      modal.appendChild(modalContent);
      
      // Add CSS animations
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .voice-ai-message {
          animation: fadeIn 0.3s ease;
        }
        .voice-ai-close-btn:hover {
          background: #f0f0f0;
          color: #333;
        }
        #voice-ai-chat-input:focus {
          border-color: \${config.backgroundColor};
          box-shadow: 0 0 0 3px \${config.backgroundColor}20;
        }
        #voice-ai-send-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px \${config.backgroundColor}40;
        }
        #voice-ai-voice-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }
        #voice-ai-voice-btn.listening {
          background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        #voice-ai-chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        #voice-ai-chat-messages::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        #voice-ai-chat-messages::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        #voice-ai-chat-messages::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        @media (max-width: 768px) {
          .voice-ai-modal-content {
            width: 95%;
            padding: 20px;
            margin: 10px;
          }
          #voice-ai-widget {
            width: 50px;
            height: 50px;
            right: 15px;
            bottom: 15px;
            font-size: 20px;
          }
        }
      \`;
      document.head.appendChild(style);
      
      // Session management
      function getSessionId() {
        let sessionId = localStorage.getItem('voice-ai-session-id');
        if (!sessionId) {
          sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('voice-ai-session-id', sessionId);
        }
        return sessionId;
      }
      
      function getCustomerId() {
        return localStorage.getItem('voice-ai-customer-id') || null;
      }
      
      // Chat functionality
      function addMessage(content, isUser = false) {
        try {
          const chatMessages = document.getElementById('voice-ai-chat-messages');
          if (!chatMessages) return;
          
          const messageDiv = document.createElement('div');
          messageDiv.className = 'voice-ai-message';
          messageDiv.style.cssText = \`
            margin-bottom: 15px;
            padding: 12px 16px;
            border-radius: 18px;
            max-width: 80%;
            word-wrap: break-word;
            \${isUser ? 
              \`background: \${config.backgroundColor}; color: white; margin-left: auto; text-align: right;\` : 
              'background: white; color: #333; border: 1px solid #e0e0e0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'
            }
          \`;
          messageDiv.textContent = content;
          chatMessages.appendChild(messageDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
          console.error('Voice AI Widget: Error adding message:', error);
        }
      }
      
      function sendMessage() {
        try {
          const chatInput = document.getElementById('voice-ai-chat-input');
          if (!chatInput) return;
          
          const message = chatInput.value.trim();
          if (!message) return;
          
          addMessage(message, true);
          chatInput.value = '';
          
          // Send message to RAG chat API
          fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              shop: config.shop,
              sessionId: getSessionId(),
              customerId: getCustomerId()
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.reply) {
              addMessage(data.reply);
            } else {
              addMessage("I'm sorry, I'm having trouble processing your request right now. Please try again later.");
            }
          })
          .catch(error => {
            console.error('Chat API error:', error);
            addMessage("I'm sorry, I'm having trouble processing your request right now. Please try again later.");
          });
        } catch (error) {
          console.error('Voice AI Widget: Error sending message:', error);
        }
      }
      
      function handleVoiceInput() {
        try {
          if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = function() {
              const voiceBtn = document.getElementById('voice-ai-voice-btn');
              if (voiceBtn) {
                voiceBtn.textContent = '🎤 Listening...';
                voiceBtn.classList.add('listening');
              }
            };
            
            recognition.onresult = function(event) {
              const transcript = event.results[0][0].transcript;
              const chatInput = document.getElementById('voice-ai-chat-input');
              if (chatInput) {
                chatInput.value = transcript;
                sendMessage();
              }
            };
            
            recognition.onend = function() {
              const voiceBtn = document.getElementById('voice-ai-voice-btn');
              if (voiceBtn) {
                voiceBtn.textContent = '🎤 Voice Input';
                voiceBtn.classList.remove('listening');
              }
            };
            
            recognition.onerror = function(event) {
              console.error('Speech recognition error:', event.error);
              const voiceBtn = document.getElementById('voice-ai-voice-btn');
              if (voiceBtn) {
                voiceBtn.textContent = '🎤 Voice Input';
                voiceBtn.classList.remove('listening');
              }
              addMessage('Sorry, there was an error with voice recognition. Please try typing your message.');
            };
            
            recognition.start();
          } else {
            addMessage('Sorry, speech recognition is not supported in your browser. Please use the text input instead.');
          }
        } catch (error) {
          console.error('Voice AI Widget: Error with voice input:', error);
          addMessage('Sorry, there was an error with voice recognition. Please try typing your message.');
        }
      }
      
      // Event listeners
      widget.addEventListener('click', function() {
        try {
          modal.style.display = 'flex';
          setTimeout(() => {
            const chatInput = document.getElementById('voice-ai-chat-input');
            if (chatInput) chatInput.focus();
          }, 100);
        } catch (error) {
          console.error('Voice AI Widget: Error opening modal:', error);
        }
      });
      
      closeBtn.addEventListener('click', function() {
        try {
          modal.style.display = 'none';
        } catch (error) {
          console.error('Voice AI Widget: Error closing modal:', error);
        }
      });
      
      modal.addEventListener('click', function(e) {
        try {
          if (e.target === modal) {
            modal.style.display = 'none';
          }
        } catch (error) {
          console.error('Voice AI Widget: Error with modal click:', error);
        }
      });
      
      // Chat event listeners
      setTimeout(() => {
        try {
          const sendBtn = document.getElementById('voice-ai-send-btn');
          const chatInput = document.getElementById('voice-ai-chat-input');
          const voiceBtn = document.getElementById('voice-ai-voice-btn');
          
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
        } catch (error) {
          console.error('Voice AI Widget: Error setting up event listeners:', error);
        }
      }, 100);
      
      // Keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        try {
          if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
          }
        } catch (error) {
          console.error('Voice AI Widget: Error with keyboard shortcut:', error);
        }
      });
      
      // Add to page
      document.body.appendChild(widget);
      document.body.appendChild(modal);
      
      // Welcome message
      setTimeout(() => {
        try {
          addMessage("💡 Tip: You can use voice input by clicking the microphone button!");
        } catch (error) {
          console.error('Voice AI Widget: Error adding welcome message:', error);
        }
      }, 3000);
      
      console.log('Voice AI Widget: Initialized successfully');
      
      // Set up periodic settings check for live updates
      setInterval(() => {
        try {
          // Check if settings hash has changed (indicating backend update)
          const currentHash = localStorage.getItem('voiceAIWidgetSettingsHash');
          if (currentHash && currentHash !== config.settingsHash) {
            console.log('Voice AI Widget: Detected settings change, refreshing...');
            // Reload the page to get fresh settings
            window.location.reload();
          }
        } catch (error) {
          console.error('Voice AI Widget: Error checking settings:', error);
        }
      }, 5000); // Check every 5 seconds
      
    } catch (error) {
      console.error('Voice AI Widget: Error creating widget:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    setTimeout(initWidget, 100);
  }
})();
`;

  return new Response(embedScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "ETag": `"${config.settingsHash}-${Date.now()}"`,
      "Last-Modified": new Date().toUTCString(),
      "Vary": "Accept-Encoding",
    },
  });
};