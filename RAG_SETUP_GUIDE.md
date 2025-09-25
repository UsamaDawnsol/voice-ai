# RAG Chatbot Setup Guide

## ✅ Dependencies Installed
- ✅ openai (v4.104.0)
- ✅ pinecone-client (v1.1.2)
- ✅ bull (v4.16.5)
- ✅ ioredis (v5.7.0)
- ✅ node-fetch (v3.3.2)

## ✅ Database Migration Complete
- ✅ New RAG models added to schema
- ✅ Migration applied successfully
- ✅ Prisma client generated

## 🚀 Next Steps

### 1. Set Environment Variables
Copy `env.example` to `.env` and fill in your API keys:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for vector search)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment

# Optional (for background jobs)
REDIS_URL=redis://localhost:6379
```

### 2. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your `.env` file

### 3. Test the Setup
1. Start the development server: `npm run dev`
2. Go to your Shopify app admin
3. Navigate to "Bot Configuration"
4. Click "Start Data Ingestion"
5. Test the chat widget on your storefront

### 4. Features Available
- ✅ **RAG-powered responses** using store data
- ✅ **Voice input** with speech recognition
- ✅ **Conversation history** tracking
- ✅ **Admin configuration** for bot behavior
- ✅ **Data ingestion** from Shopify
- ✅ **Session management** for customers

### 5. API Endpoints
- `/api/chat` - Chat with RAG + LLM
- `/api/ingest` - Start data ingestion
- `/debug-settings` - Debug widget settings

### 6. Admin Pages
- `/app/widget-settings` - Widget appearance settings
- `/app/bot-config` - Bot behavior configuration

## 🎉 You're Ready!
Your Voice AI widget is now a full RAG chatbot that can:
- Answer questions about your products
- Use voice input
- Maintain conversation history
- Be configured from the admin panel

## 🔧 Troubleshooting

### If you get "Cannot find module 'openai'" error:
```bash
npm install openai
```

### If database migration fails:
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_rag_models
```

### If Prisma client generation fails:
```bash
taskkill /f /im node.exe
npx prisma generate
```

## 📚 Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Shopify App Development](https://shopify.dev/docs/apps)
