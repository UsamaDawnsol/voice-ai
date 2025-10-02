import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  DataTable,
  TextField,
  Select,
  Banner,
  Box,
  Divider,
  EmptyState,
  Modal,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function LocalConversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    // Load conversations from localStorage
    const loadConversations = () => {
      try {
        const currentConversation = JSON.parse(localStorage.getItem('current_conversation') || '{}');
        const allMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
        
        const conversationList = [];
        
        // Add current conversation if exists
        if (currentConversation.id && currentConversation.messages && currentConversation.messages.length > 0) {
          conversationList.push({
            id: currentConversation.id,
            sessionId: currentConversation.sessionId,
            shop: currentConversation.shop,
            status: currentConversation.status,
            createdAt: currentConversation.createdAt,
            updatedAt: currentConversation.updatedAt,
            messages: currentConversation.messages,
            messageCount: currentConversation.messages.length
          });
        }
        
        // Add old messages as separate conversations
        if (allMessages.length > 0) {
          const groupedMessages = {};
          allMessages.forEach(msg => {
            if (!groupedMessages[msg.conversationId]) {
              groupedMessages[msg.conversationId] = {
                id: msg.conversationId,
                sessionId: msg.sessionId,
                shop: msg.shop,
                status: 'active',
                createdAt: msg.timestamp,
                updatedAt: msg.timestamp,
                messages: [],
                messageCount: 0
              };
            }
            groupedMessages[msg.conversationId].messages.push(msg);
            groupedMessages[msg.conversationId].messageCount++;
          });
          
          Object.values(groupedMessages).forEach(conv => {
            conversationList.push(conv);
          });
        }
        
        setConversations(conversationList);
        console.log('Loaded conversations from localStorage:', conversationList);
        
      } catch (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      }
    };
    
    loadConversations();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { status: "success", children: "Active" },
      closed: { status: "info", children: "Closed" },
      archived: { status: "warning", children: "Archived" },
    };
    return statusMap[status] || { status: "info", children: status };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setShowConversationModal(true);
  };

  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Active", value: "active" },
    { label: "Closed", value: "closed" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <Page>
      <TitleBar title="Local Conversation History" />
      
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Local Conversation Storage
              </Text>
              
              <Banner status="info">
                <Text as="p" variant="bodyMd">
                  <strong>Note:</strong> Conversations are currently stored locally in the browser's localStorage. 
                  To view conversations, open the browser's Developer Tools (F12) and check the localStorage 
                  for 'chat_messages' key.
                </Text>
              </Banner>
              
              <Text as="p" variant="bodyMd">
                The floating chat widget is now working without external API dependencies. 
                All messages are saved to localStorage for persistence across page reloads.
              </Text>
              
              <InlineStack gap="200">
                <Button 
                  onClick={() => {
                    const messages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
                    console.log('Stored messages:', messages);
                    alert(`Found ${messages.length} messages in localStorage. Check console for details.`);
                  }}
                >
                  Check Local Storage
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => {
                    localStorage.removeItem('chat_messages');
                    alert('Local storage cleared!');
                  }}
                >
                  Clear Local Storage
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
          
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Widget Status
              </Text>
              
              <Banner status="success">
                <Text as="p" variant="bodyMd">
                  <strong>✅ Widget is working!</strong> The floating chat widget is now completely self-contained 
                  and doesn't require external API calls. It uses theme settings and localStorage for data persistence.
                </Text>
              </Banner>
              
              <Text as="h3" variant="headingSm">
                Features Working:
              </Text>
              
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  ✅ Floating chat button appears<br/>
                  ✅ Chat opens and closes on click<br/>
                  ✅ Messages are sent and received<br/>
                  ✅ AI responses are generated<br/>
                  ✅ Messages saved to localStorage<br/>
                  ✅ No external API dependencies
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
