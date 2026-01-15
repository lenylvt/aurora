# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurora is an ultra-fast AI assistant built for students (high school audience), with French as the primary language. The project prioritizes **speed** and **simplicity** with streaming responses, optimistic UI, and intelligent API cost optimization.

**Tech Stack:**
- **Framework**: Next.js 16 (App Router) with React 19
- **UI**: Assistant UI (primary chat interface) + Shadcn UI components + Tailwind CSS
- **AI**: xAI Grok API (primary) + Groq API (fallback) with multi-provider system + Vercel AI SDK for streaming
- **Backend**: Appwrite (authentication + database)
- **Tools**: Composio SDK for MCP integration (external tool access)
- **OAuth**: Snapchat Login Kit (PKCE flow)

## Common Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Architecture

### Multi-Provider System with Intelligent Fallback

The chat API implements a **dual-provider system** (xAI + Groq) with automatic failover (app/api/chat/route.ts:24-75):

**xAI Grok models (Primary, if XAI_API_KEY is set):**
1. `grok-4-1-fast-reasoning` (primary, optimized for speed, native vision support, 2M context, extended reasoning)
2. `grok-4-1-fast-non-reasoning` (fallback 1, 2M context, vision support)
3. `grok-4-1-fast-non-reasoning-mini` (fallback 2, lightweight)

**Groq models (Fallback or standalone):**
1. `openai/gpt-oss-120b` (primary, most powerful)
2. `qwen/qwen3-32b` (fallback 1)
3. `openai/gpt-oss-20b` (fallback 2)
4. `meta-llama/llama-4-maverick-17b-128e-instruct` (vision model for images)

**Smart model selection:**
- Text conversations: Uses Grok 4.1 Fast Reasoning (xAI) or gpt-oss-120b (Groq)
- Vision (images/PDFs): Uses Grok 4.1 Fast Reasoning (native vision) or dedicated Groq vision model
- Code tutoring (Prof): Uses Grok 4.1 Fast Non-Reasoning (faster responses) or gpt-oss-120b (Groq)
- Automatic fallback: If xAI unavailable or fails, falls back to Groq seamlessly

**xAI exclusive features:**
- 2M token context windows (15x larger than Groq's 128K)
- X Search integration (real-time Twitter/X data access)
- Server-side code execution
- Native vision support (no separate model needed)

See [XAI_INTEGRATION.md](./XAI_INTEGRATION.md) for detailed setup and usage.

### Context Optimization System

**Critical feature**: lib/groq/context.ts implements intelligent context reduction to cut API costs by 60-80%.

**Strategy:**
- Limits messages sent to API to max 20 (instead of entire history)
- Keeps first 2 messages (initial context) + most recent 18 messages
- Enforces ~10,000 token limit per request
- Calculates token estimates at 4 chars/token ratio
- Database queries optimized to load only 50 messages (not 1000+)

When modifying chat functionality, **maintain this optimization** to avoid cost explosions.

### Appwrite Database Structure

Three collections with specific permissions (Read/Create: Role:user, Update/Delete: Owner):

**`chats` collection:**
- `userId` (string, required)
- `title` (string, required)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

**`messages` collection:**
- `chatId` (string, required)
- `role` (enum: user, assistant, required)
- `content` (string, required)
- `files` (string, optional) - JSON stringified MessageFile[]
- `createdAt` (datetime, required)

**`users` collection:** (optional, for extended profiles)

Database operations in lib/appwrite/database.ts use create-or-update pattern for optimistic UI.

### Composio Integration

**Purpose**: Enables AI assistant to use external tools (file systems, APIs, integrations)

**Architecture:**
- lib/composio/client.ts: Full Composio SDK wrapper with VercelProvider
- lib/composio/config.ts: Enabled toolkit configuration
- app/api/composio/: OAuth flow endpoints for connecting accounts
- Tools are user-scoped (each user connects their own accounts)

**Key functions:**
- `getComposioTools(userId, options)`: Fetches tools for enabled toolkits
- `initiateHostedConnection(userId, authConfigId, callbackUrl)`: OAuth flow
- `getUserConnections(userId)`: List user's connected accounts

Tools are automatically passed to Groq via Vercel AI SDK - no manual execution needed.

### File Upload System

**Location**: lib/files/, lib/attachments/

**Supported formats:**
- Images (displayed inline)
- PDFs (parsed via pdfjs-dist)
- Text documents

Files are converted to data URLs and embedded in message content for the AI model.

### Authentication Flow

**Appwrite Session Management:**
- Email/password auth: app/(auth)/login, app/(auth)/signup
- Snapchat OAuth: lib/snapchat/, app/api/auth/snapchat/
- Session validation: lib/appwrite/server.ts `getCurrentUserServer()`

All protected routes in `(dashboard)` require authentication.

## Key Design Patterns

### Streaming Responses

Chat API uses Vercel AI SDK's `streamText()` with `toUIMessageStreamResponse()` for real-time streaming. Client uses Assistant UI's runtime which handles streaming automatically.

### Optimistic UI

Messages appear instantly in UI before API confirmation. Database operations use deterministic IDs so client can render immediately then sync with server.

### Title Generation

Auto-generates chat titles using lightweight Groq models (lib/groq/naming.ts):
- Fallback chain: llama-3.3-70b-versatile → llama-3.1-8b-instant → gemma2-9b-it
- Analyzes first 100 chars only (not 200) to reduce cost
- Max 30 tokens, temperature 0.3

## Important Constraints

1. **Always respond in French** - This is a French-first application for French students
2. **Context optimization is sacred** - Never remove or bypass the message context optimization without explicit approval
3. **Appwrite is the only backend** - No direct database access, all operations through Appwrite SDK
4. **User-scoped tools** - Composio tools must be fetched with userId, never globally
5. **No rate limiting yet** - This is planned but not implemented

## File Structure Guidelines

```
app/
  (auth)/              # Auth pages (public)
  (dashboard)/         # Protected pages
    chat/              # Main chat interface
    connections/       # Composio connection management
  api/
    auth/              # Snapchat OAuth endpoints
    chat/              # Main chat API (streaming)
    title/             # Title generation
    composio/          # Composio OAuth flows

lib/
  appwrite/            # Appwrite client, database ops, server auth
  attachments/         # PDF adapter for file parsing
  composio/            # Composio client + toolkit config
  files/               # File processing utilities
  groq/
    context.ts         # Context optimization (CRITICAL)
    naming.ts          # Title generation
  snapchat/            # Snapchat OAuth implementation

components/
  assistant-ui/        # Assistant UI overrides/extensions
  chat/                # Custom chat components (sidebar, etc)
  ui/                  # Shadcn UI components (19 used)
```

## Environment Variables Required

```
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=<project_id>
NEXT_PUBLIC_DATABASE_ID=<database_id>
NEXT_PUBLIC_CHATS_COLLECTION_ID=chats
NEXT_PUBLIC_MESSAGES_COLLECTION_ID=messages

# Groq (required fallback)
GROQ_API_KEY=<groq_api_key>

# xAI (optional, recommended for 2M context + X Search)
XAI_API_KEY=<xai_api_key>

# Optional: Composio (for tools)
COMPOSIO_API_KEY=<composio_key>

# Optional: Snapchat OAuth
SNAPCHAT_CLIENT_ID=<client_id>
SNAPCHAT_CLIENT_SECRET=<client_secret>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Recent Optimizations (Dec 2025)

1. **Context optimization** - Reduced API costs by 60-80% via intelligent message windowing
2. **Bundle size** - Removed 36 unused UI components, 70+ npm packages
3. **Database queries** - Limited to 50 recent messages instead of 1000+
4. **Title generation** - Reduced from 200 to 100 chars analysis
5. **Code cleanup** - From ~150 files to 67 core files

## Performance Priorities

1. **Streaming first** - Never wait for full responses
2. **Optimistic updates** - Show changes immediately
3. **Minimal tokens** - Always consider API costs when handling messages
4. **Server Components** - Use RSC where possible for faster loading
5. **Suspense boundaries** - Prevent waterfalls
