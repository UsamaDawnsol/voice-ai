/**
 * Floating Chat Widget - Jotform Style
 * A clean, self-contained floating chat widget for Shopify stores
 * Fetches configuration from backend API and renders a professional chat interface
 */

// Ensure module compatibility
if (typeof exports === 'undefined') {
  window.exports = {};
}

(function() {
  'use strict';

  // Configuration and state
  let config = {
    title: 'Support Chat',
    color: '#e63946',
    greeting: '👋 Welcome! How can we help you?',
    position: 'right',
    isActive: true,
    shop: '',
    messages: [],
    agentName: 'Assistant',
    agentRole: 'Customer Support',
    responseLength: 'medium',
    language: 'en',
    tone: 'friendly',
    avatar: 'https://cdn.shopify.com/s/files/1/0780/7745/0100/files/default-avatar.png'
  };

  let isOpen = false;
  let isLoaded = false;
  let currentConversationId = null;

  /**
   * Initialize the widget
   */
  async function init() {
    if (isLoaded) return;
    
    try {
      console.log('Floating Widget: Initializing...');
      console.log('Floating Widget: Window location:', window.location.href);
      console.log('Floating Widget: User agent:', navigator.userAgent);
      console.log('Floating Widget: Document ready state:', document.readyState);
      
      // Get shop domain
      const shop = getShopDomain();
      console.log('Floating Widget: Shop domain:', shop);
      if (!shop) {
        console.warn('Floating Widget: Could not determine shop domain');
        return;
      }

      // Fetch configuration from API
      await loadConfig(shop);
      
      // Only render if widget is active
      if (!config.isActive) {
        console.log('Floating Widget: Widget is disabled');
        return;
      }

      // Create and render widget
      createWidget();
      
      isLoaded = true;
      console.log('Floating Widget: Initialized successfully');
      console.log('Floating Widget: Config:', config);
      
    } catch (error) {
      console.error('Floating Widget: Initialization failed', error);
    }
  }

  /**
   * Save message to database
   */
  async function saveMessage(message, role = 'user') {
    try {
      const origin = window.floatingChatWidget?.appUrl || window.location.origin;
      
      // If no conversation exists, create one first
      if (!currentConversationId) {
        const conversationResponse = await fetch(`${origin}/api/floating-widget-data?shop=${encodeURIComponent(config.shop)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_conversation',
            shop: config.shop,
            sessionId: generateSessionId(),
            customerEmail: null,
            customerName: null
          })
        });
        
        if (conversationResponse.ok) {
          const conversationData = await conversationResponse.json();
          currentConversationId = conversationData.conversationId;
          console.log('Floating Widget: Created conversation:', currentConversationId);
        }
      }
      
      // Save the message
      if (currentConversationId) {
        const messageResponse = await fetch(`${origin}/api/floating-widget-data?shop=${encodeURIComponent(config.shop)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save_message',
            conversationId: currentConversationId,
            message: message,
            role: role
          })
        });
        
        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          console.log('Floating Widget: Message saved:', messageData.messageId);
          return true;
        } else {
          const errorData = await messageResponse.json();
          console.error('Floating Widget: Failed to save message:', errorData);
          
          // Handle plan limit errors
          if (messageResponse.status === 403 && errorData.error) {
            this.showPlanLimitError(errorData);
            return false;
          }
        }
      }
    } catch (error) {
      console.error('Floating Widget: Error saving message:', error);
    }
    return false;
  }

  /**
   * Generate a unique session ID
   */
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Show plan limit error to user
   */
  function showPlanLimitError(errorData) {
    const widgetContainer = document.getElementById('jotform-agent-preview-root');
    if (!widgetContainer) return;
    
    const messagesContainer = widgetContainer.querySelector('.ai-agent-chat-messages');
    if (!messagesContainer) return;
    
    // Create error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'ai-agent-chat-message ai-agent-message';
    errorMessage.innerHTML = `
      <div class="ai-agent-message-content" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;">
        <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Plan Limit Reached</div>
        <div style="margin-bottom: 8px;">${errorData.error}</div>
        <div style="font-size: 14px; color: #7f1d1d;">
          You've used ${errorData.used} of ${errorData.limit} ${errorData.plan} plan limits.
        </div>
        <div style="margin-top: 8px;">
          <a href="/app/plans" target="_blank" style="color: #dc2626; text-decoration: underline;">
            Upgrade your plan to continue chatting
          </a>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(errorMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Get shop domain from various sources
   */
  function getShopDomain() {
    // Try theme extension config first
    if (window.floatingChatWidget && window.floatingChatWidget.shop) {
      return window.floatingChatWidget.shop;
    }
    
    // Try to get from Shopify global
    if (window.Shopify && window.Shopify.shop) {
      return window.Shopify.shop;
    }
    
    // Try to extract from current domain
    const hostname = window.location.hostname;
    if (hostname.includes('.myshopify.com')) {
      return hostname;
    }
    
    return null;
  }

  /**
   * Load configuration from API or use defaults
   */
  async function loadConfig(shop) {
    try {
      config.shop = shop;
      
      // Try to fetch from API, but use defaults if it fails
      try {
        const origin = window.floatingChatWidget?.appUrl || window.location.origin;
        const response = await fetch(`${origin}/api/floating-widget-data?shop=${encodeURIComponent(shop)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const apiConfig = await response.json();
          config = { ...config, ...apiConfig };
          console.log('Floating Widget: Configuration loaded from API', config);
        } else {
          console.warn('Floating Widget: Could not fetch config from API, using defaults');
        }
      } catch (apiError) {
        console.warn('Floating Widget: API not available, using default configuration');
      }
      
      // Respect backend isActive setting
      console.log('Floating Widget: Using configuration:', config);
      
    } catch (error) {
      console.error('Floating Widget: Error loading config:', error);
      console.log('Floating Widget: Using default configuration');
      config.isActive = true;
    }
  }

  /**
   * Create the Jotform-style widget
   */
  function createWidget() {
    console.log('Floating Widget: Creating widget with config:', config);
    
    // Remove existing widget if it exists
    const existingWidget = document.getElementById('jotform-agent-preview-root');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create main container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'jotform-agent-preview-root';
    widgetContainer.innerHTML = `
      <div class="embedded-agent-container align-${config.position}">
        <div class="ai-agent-chat-avatar-container">
          <div class="ai-agent-avatar-content">
            <div class="ai-agent-avatar-content-wrapper">
              <div class="ai-agent-chat-avatar-pulse-wrapper">
                <div class="ai-agent-chat-avatar" style="background: linear-gradient(rgba(0, 0, 0, 0.81) 0%, rgb(0, 0, 0) 100%);">
                  <img draggable="false" src="${config.avatar}" alt="agent" width="80" height="80">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="ai-agent-chat-animation-container">
          <div class="ai-agent-chat-cover">
            <div class="ai-agent-chat-widget" style="display: none;">
              <div class="ai-agent-chat-header" style="background: ${config.color};">
                <div class="ai-agent-chat-header-content">
                  <img src="${config.avatar}" alt="${config.agentName}" class="ai-agent-chat-header-avatar">
                  <div class="ai-agent-chat-header-info">
                    <div class="ai-agent-chat-header-name">${config.agentName}</div>
                    <div class="ai-agent-chat-header-role">${config.agentRole}</div>
                  </div>
                </div>
                <button class="ai-agent-chat-close" onclick="window.FloatingChatWidget.close()">×</button>
              </div>
              <div class="ai-agent-chat-body">
                <div class="ai-agent-chat-messages">
                  <div class="ai-agent-chat-message ai-agent-message">
                    <div class="ai-agent-message-content">${config.greeting}</div>
                  </div>
                </div>
                <div class="ai-agent-chat-input-area">
                  <input type="text" class="ai-agent-chat-input" placeholder="Type your message...">
                  <button class="ai-agent-chat-send">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .embedded-agent-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .embedded-agent-container.align-left {
        right: auto;
        left: 20px;
      }
      
      .ai-agent-chat-avatar-container {
        position: relative;
        cursor: pointer;
      }
      
      .ai-agent-chat-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        z-index: 1;
      }
      
      .ai-agent-chat-avatar:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      
      .ai-agent-chat-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        pointer-events: none;
        user-select: none;
      }
      
      .ai-agent-chat-avatar-pulse-wrapper {
        position: relative;
      }
      
      .ai-agent-chat-avatar-pulse-wrapper::before {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border-radius: 50%;
        background: ${config.color};
        opacity: 0.3;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.1); opacity: 0.1; }
        100% { transform: scale(1); opacity: 0.3; }
      }
      
      .ai-agent-chat-widget {
        position: absolute;
        bottom: 90px;
        right: 0;
        width: 320px;
        height: 420px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .embedded-agent-container.align-left .ai-agent-chat-widget {
        right: auto;
        left: 0;
      }
      
      .ai-agent-chat-header {
        padding: 16px;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ai-agent-chat-header-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .ai-agent-chat-header-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .ai-agent-chat-header-info {
        display: flex;
        flex-direction: column;
      }
      
      .ai-agent-chat-header-name {
        font-weight: 600;
        font-size: 14px;
      }
      
      .ai-agent-chat-header-role {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .ai-agent-chat-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ai-agent-chat-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
      }
      
      .ai-agent-chat-messages {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 16px;
      }
      
      .ai-agent-chat-message {
        margin-bottom: 12px;
      }
      
      .ai-agent-message-content {
        background: #e3f2fd;
        padding: 12px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .ai-agent-chat-input-area {
        display: flex;
        gap: 8px;
      }
      
      .ai-agent-chat-input {
        flex: 1;
        padding: 12px;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        outline: none;
        font-size: 14px;
      }
      
      .ai-agent-chat-input:focus {
        border-color: ${config.color};
      }
      
      .ai-agent-chat-send {
        background: ${config.color};
        color: #fff;
        border: none;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      }
      
      .ai-agent-chat-send:hover {
        opacity: 0.9;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(widgetContainer);

    // Set up event listeners
    const avatar = widgetContainer.querySelector('.ai-agent-chat-avatar');
    const avatarImg = widgetContainer.querySelector('.ai-agent-chat-avatar img');
    const chatWidget = widgetContainer.querySelector('.ai-agent-chat-widget');
    const closeButton = widgetContainer.querySelector('.ai-agent-chat-close');
    const sendButton = widgetContainer.querySelector('.ai-agent-chat-send');
    const chatInput = widgetContainer.querySelector('.ai-agent-chat-input');
    
    console.log('Floating Widget: Widget created and added to DOM');
    console.log('Floating Widget: Avatar element:', avatar);
    console.log('Floating Widget: Avatar image element:', avatarImg);
    console.log('Floating Widget: Chat widget element:', chatWidget);
    
    // Function to toggle chat
    const toggleChat = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Floating Widget: Avatar clicked, toggling chat');
      console.log('Floating Widget: Click event:', e);
      console.log('Floating Widget: Click target:', e.target);
      console.log('Floating Widget: Current chat display:', chatWidget.style.display);
      console.log('Floating Widget: Current isOpen state:', isOpen);
      
      // Add visual feedback
      avatar.style.transform = 'scale(0.95)';
      setTimeout(() => {
        avatar.style.transform = '';
      }, 150);
      
      if (chatWidget.style.display === 'none' || !chatWidget.style.display) {
        chatWidget.style.display = 'flex';
        isOpen = true;
        console.log('Floating Widget: Chat opened successfully');
        console.log('Floating Widget: Chat widget element:', chatWidget);
        console.log('Floating Widget: Chat widget computed style:', window.getComputedStyle(chatWidget).display);
        
        // Add a visual indicator that chat is open
        avatar.style.border = '3px solid #4CAF50';
        setTimeout(() => {
          avatar.style.border = '';
        }, 2000);
      } else {
        chatWidget.style.display = 'none';
        isOpen = false;
        console.log('Floating Widget: Chat closed successfully');
      }
    };
    
    // Avatar click to toggle chat
    if (avatar) {
      avatar.addEventListener('click', toggleChat);
      avatar.addEventListener('mousedown', (e) => {
        console.log('Floating Widget: Avatar mousedown event');
      });
      avatar.addEventListener('mouseup', (e) => {
        console.log('Floating Widget: Avatar mouseup event');
      });
      console.log('Floating Widget: Avatar click handler attached');
    } else {
      console.error('Floating Widget: Avatar element not found!');
    }
    
    // Also add click handler to the image
    if (avatarImg) {
      avatarImg.addEventListener('click', toggleChat);
      console.log('Floating Widget: Avatar image click handler attached');
    } else {
      console.error('Floating Widget: Avatar image element not found!');
    }
    
    // Add click handler to the entire avatar container
    const avatarContainer = widgetContainer.querySelector('.ai-agent-chat-avatar-container');
    if (avatarContainer) {
      avatarContainer.addEventListener('click', toggleChat);
      console.log('Floating Widget: Avatar container click handler attached');
    } else {
      console.error('Floating Widget: Avatar container element not found!');
    }
    
    // Close button
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatWidget.style.display = 'none';
        isOpen = false;
        console.log('Floating Widget: Chat closed via close button');
      });
      console.log('Floating Widget: Close button handler attached');
    } else {
      console.error('Floating Widget: Close button element not found!');
    }
    
    // Send message
    if (sendButton && chatInput) {
      sendButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        console.log('Floating Widget: Send button clicked, message:', message);
        if (message) {
          console.log('Floating Widget: Sending message:', message);
          
          // Add user message to UI
          const messagesContainer = widgetContainer.querySelector('.ai-agent-chat-messages');
          const userMessage = document.createElement('div');
          userMessage.className = 'ai-agent-chat-message';
          userMessage.innerHTML = `<div style="background: #f0f0f0; padding: 12px; border-radius: 8px; margin-left: auto; max-width: 80%; text-align: right;">${message}</div>`;
          messagesContainer.appendChild(userMessage);
          
          // Save message to database
          const saved = await saveMessage(message, 'user');
          if (saved) {
            console.log('Floating Widget: Message saved to database');
          } else {
            console.warn('Floating Widget: Failed to save message to database');
          }
          
          // Clear input
          chatInput.value = '';
          
          // Scroll to bottom
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          // Simulate AI response (you can replace this with actual AI integration)
          setTimeout(async () => {
            const aiResponse = `Thank you for your message: "${message}". This is an automated response. How can I help you further?`;
            
            // Add AI response to UI
            const aiMessage = document.createElement('div');
            aiMessage.className = 'ai-agent-chat-message ai-agent-message';
            aiMessage.innerHTML = `<div class="ai-agent-message-content">${aiResponse}</div>`;
            messagesContainer.appendChild(aiMessage);
            
            // Save AI response to database
            await saveMessage(aiResponse, 'assistant');
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }, 1000);
        }
      });
      console.log('Floating Widget: Send button handler attached');
    } else {
      console.error('Floating Widget: Send button or chat input element not found!');
    }
    
    // Enter key to send
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('Floating Widget: Enter key pressed, triggering send');
          sendButton.click();
        }
      });
      console.log('Floating Widget: Enter key handler attached');
    } else {
      console.error('Floating Widget: Chat input element not found for keypress handler!');
    }
    
    // Close when clicking outside (temporarily disabled for debugging)
    document.addEventListener('click', (e) => {
      if (isOpen && !widgetContainer.contains(e.target)) {
        console.log('Floating Widget: Outside click detected, but not closing for debugging');
        // chatWidget.style.display = 'none';
        // isOpen = false;
        // console.log('Floating Widget: Chat closed via outside click');
      }
    });
    console.log('Floating Widget: Outside click handler attached (disabled for debugging)');
    
    // Add a test button for debugging
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Click';
    testButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      background: #ff0000;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    `;
    testButton.addEventListener('click', () => {
      console.log('Floating Widget: Test button clicked - forcing chat open');
      chatWidget.style.display = 'flex';
      isOpen = true;
    });
    document.body.appendChild(testButton);
    console.log('Floating Widget: Test button added for debugging');
    
    // Add a direct test for the avatar
    setTimeout(() => {
      console.log('Floating Widget: Testing avatar click programmatically...');
      if (avatar) {
        avatar.click();
        console.log('Floating Widget: Programmatic avatar click executed');
      }
    }, 2000);
    
    // Add a simple click test button
    const simpleTestButton = document.createElement('button');
    simpleTestButton.textContent = 'Simple Test';
    simpleTestButton.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      z-index: 10000;
      background: #00ff00;
      color: black;
      border: none;
      padding: 10px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    `;
    simpleTestButton.addEventListener('click', () => {
      console.log('Floating Widget: Simple test button clicked');
      console.log('Floating Widget: Avatar element:', avatar);
      console.log('Floating Widget: Chat widget element:', chatWidget);
      console.log('Floating Widget: Chat widget current display:', chatWidget.style.display);
      console.log('Floating Widget: Chat widget computed display:', window.getComputedStyle(chatWidget).display);
      
      // Force open the chat
      chatWidget.style.display = 'flex';
      isOpen = true;
      console.log('Floating Widget: Chat forced open');
    });
    document.body.appendChild(simpleTestButton);
    console.log('Floating Widget: Simple test button added');
  }

  /**
   * Open chat
   */
  function openChat() {
    const chatWidget = document.querySelector('.ai-agent-chat-widget');
    if (chatWidget) {
      chatWidget.style.display = 'flex';
      isOpen = true;
    }
  }

  /**
   * Close chat
   */
  function closeChat() {
    const chatWidget = document.querySelector('.ai-agent-chat-widget');
    if (chatWidget) {
      chatWidget.style.display = 'none';
      isOpen = false;
    }
  }

  /**
   * Toggle chat
   */
  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // Expose widget API for external control
  window.FloatingChatWidget = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    isOpen: () => isOpen,
    config: config,
    refresh: () => {
      const shop = getShopDomain();
      if (shop) {
        loadConfig(shop).then(() => {
          createWidget();
        });
      }
    }
  };

  // Initialize when DOM is ready
  console.log('Floating Widget: Script loaded, document ready state:', document.readyState);
  
  if (document.readyState === 'loading') {
    console.log('Floating Widget: DOM still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Floating Widget: DOMContentLoaded fired, initializing...');
      init();
    });
  } else {
    console.log('Floating Widget: DOM already ready, initializing immediately');
    init();
  }

})();
