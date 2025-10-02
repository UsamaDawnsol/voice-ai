import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
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
  DatePicker,
  Modal,
  Banner,
  Box,
  Divider,
  EmptyState,
  Pagination,
  Filters,
  ChoiceList,
  RangeSlider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo = url.searchParams.get("dateTo") || "";
    
    // Build where clause
    const where = {
      shop: session.shop,
    };
    
    if (search) {
      where.OR = [
        { customerEmail: { contains: search } },
        { customerName: { contains: search } },
        { sessionId: { contains: search } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }
    
    // Get conversations with messages
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Log database query results for debugging
    console.log(`Found ${conversations.length} conversations for shop: ${session.shop}`);
    
    // Get total count for pagination
    const totalCount = await prisma.conversation.count({ where });
    
    return {
      conversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        search,
        status,
        dateFrom,
        dateTo,
      },
    };
    
  } catch (error) {
    console.error("Error loading conversation history:", error);
    return {
      conversations: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      filters: { search: "", status: "", dateFrom: "", dateTo: "" },
      error: error.message,
    };
  }
};

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "updateStatus") {
      const conversationId = formData.get("conversationId");
      const status = formData.get("status");
      
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status },
      });
      
      return { success: true, message: "Conversation status updated" };
    }
    
    if (action === "deleteConversation") {
      const conversationId = formData.get("conversationId");
      
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
      
      return { success: true, message: "Conversation deleted" };
    }
    
    return { success: false, error: "Invalid action" };
    
  } catch (error) {
    console.error("Error in conversation action:", error);
    return { success: false, error: error.message };
  }
};

export default function ConversationHistory() {
  const { conversations, pagination, filters, error } = useLoaderData();
  const fetcher = useFetcher();
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);
  
  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Active", value: "active" },
    { label: "Closed", value: "closed" },
    { label: "Archived", value: "archived" },
  ];
  
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
  
  const handleStatusUpdate = (conversationId, newStatus) => {
    const formData = new FormData();
    formData.append("action", "updateStatus");
    formData.append("conversationId", conversationId);
    formData.append("status", newStatus);
    fetcher.submit(formData, { method: "post" });
  };
  
  const handleDeleteConversation = (conversationId) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      const formData = new FormData();
      formData.append("action", "deleteConversation");
      formData.append("conversationId", conversationId);
      fetcher.submit(formData, { method: "post" });
    }
  };
  
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter) params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    
    window.location.href = `/app/conversation-history?${params.toString()}`;
  };
  
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    window.location.href = "/app/conversation-history";
  };
  
  const rows = conversations.map((conversation) => [
    conversation.id,
    conversation.customerName || conversation.customerEmail || "Anonymous",
    conversation.customerEmail || "N/A",
    formatDate(conversation.createdAt),
    conversation._count.messages,
    getStatusBadge(conversation.status),
    <InlineStack gap="200">
      <Button
        size="slim"
        onClick={() => handleConversationClick(conversation)}
      >
        View
      </Button>
      <Select
        options={statusOptions}
        value={conversation.status}
        onChange={(value) => handleStatusUpdate(conversation.id, value)}
      />
      <Button
        size="slim"
        variant="tertiary"
        tone="critical"
        onClick={() => handleDeleteConversation(conversation.id)}
      >
        Delete
      </Button>
    </InlineStack>,
  ]);
  
  return (
    <Page>
      <TitleBar title="Conversation History" />
      
      {error && (
        <Banner status="critical">
          <Text as="p" variant="bodyMd">
            <strong>Error:</strong> {error}
          </Text>
        </Banner>
      )}
      
      {fetcher.data?.success && (
        <Banner status="success">
          <Text as="p" variant="bodyMd">
            <strong>✅ {fetcher.data.message}</strong>
          </Text>
        </Banner>
      )}
      
      {fetcher.data?.error && (
        <Banner status="critical">
          <Text as="p" variant="bodyMd">
            <strong>Error:</strong> {fetcher.data.error}
          </Text>
        </Banner>
      )}
      
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Filters
              </Text>
              
              <InlineStack gap="400" wrap={false}>
                <TextField
                  label="Search"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name, email, or session ID"
                  autoComplete="off"
                />
                
                <Select
                  label="Status"
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                
                <TextField
                  label="Date From"
                  type="date"
                  value={dateFrom}
                  onChange={setDateFrom}
                />
                
                <TextField
                  label="Date To"
                  type="date"
                  value={dateTo}
                  onChange={setDateTo}
                />
              </InlineStack>
              
              <InlineStack gap="200">
                <Button variant="primary" onClick={handleSearch}>
                  Search
                </Button>
                <Button variant="tertiary" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
          
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Conversations ({pagination.total})
                </Text>
                <Text as="p" variant="bodyMd" color="subdued">
                  Page {pagination.page} of {pagination.totalPages}
                </Text>
              </InlineStack>
              
              {conversations.length === 0 ? (
                <EmptyState
                  heading="No conversations found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p" variant="bodyMd" color="subdued">
                    No conversations match your current filters.
                  </Text>
                </EmptyState>
              ) : (
                <>
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text", 
                      "text",
                      "text",
                      "numeric",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "ID",
                      "Customer",
                      "Email",
                      "Date",
                      "Messages",
                      "Status",
                      "Actions",
                    ]}
                    rows={rows}
                  />
                  
                  {pagination.totalPages > 1 && (
                    <InlineStack align="center">
                      <Pagination
                        hasPrevious={pagination.page > 1}
                        onPrevious={() => {
                          const params = new URLSearchParams(window.location.search);
                          params.set("page", (pagination.page - 1).toString());
                          window.location.href = `/app/conversation-history?${params.toString()}`;
                        }}
                        hasNext={pagination.page < pagination.totalPages}
                        onNext={() => {
                          const params = new URLSearchParams(window.location.search);
                          params.set("page", (pagination.page + 1).toString());
                          window.location.href = `/app/conversation-history?${params.toString()}`;
                        }}
                      />
                    </InlineStack>
                  )}
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      
      {/* Conversation Detail Modal */}
      <Modal
        open={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        title={`Conversation Details`}
        large
      >
        <Modal.Section>
          {selectedConversation && (
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    {selectedConversation.customerName || "Anonymous Customer"}
                  </Text>
                  <Text as="p" variant="bodyMd" color="subdued">
                    {selectedConversation.customerEmail || "No email provided"}
                  </Text>
                  <Text as="p" variant="bodySm" color="subdued">
                    Started: {formatDate(selectedConversation.createdAt)}
                  </Text>
                </BlockStack>
                
                <Badge {...getStatusBadge(selectedConversation.status)} />
              </InlineStack>
              
              <Divider />
              
              <Text as="h4" variant="headingSm">
                Messages ({selectedConversation.messages.length})
              </Text>
              
              <BlockStack gap="300">
                {selectedConversation.messages.map((message, index) => (
                  <Box
                    key={index}
                    padding="400"
                    background={message.role === "user" ? "bg-surface" : "bg-surface-secondary"}
                    borderRadius="200"
                  >
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        {message.role === "user" ? "Customer" : "Assistant"}
                      </Text>
                      <Text as="p" variant="bodySm" color="subdued">
                        {formatDate(message.timestamp)}
                      </Text>
                    </InlineStack>
                    <Text as="p" variant="bodyMd">
                      {message.content}
                    </Text>
                  </Box>
                ))}
              </BlockStack>
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
