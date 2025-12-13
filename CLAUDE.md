# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aurora is a Next.js 16 chat application (named "friendai" in package.json) that integrates:
- **Appwrite** for backend services (authentication, database)
- **Groq API** for AI chat completions with fallback model chains
- **PDF.js** for document processing (max 5 pages)
- **Radix UI** components with Tailwind CSS styling
- **Edge runtime** for chat API route

## Development Commands

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Configuration

Required environment variables (see `.env.example`):
- **Appwrite**: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT`, `APPWRITE_API_KEY`
- **Appwrite Collections**: `NEXT_PUBLIC_DATABASE_ID`, `NEXT_PUBLIC_CHATS_COLLECTION_ID`, `NEXT_PUBLIC_MESSAGES_COLLECTION_ID`
- **Groq**: `GROQ_API_KEY` (server-side only)
- **Snapchat OAuth**: `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET`, `NEXT_PUBLIC_OAUTH_REDIRECT_URI`
- **Composio**: `COMPOSIO_API_KEY`
- **App**: `NEXT_PUBLIC_APP_URL`

## Architecture

### Directory Structure

- `app/` - Next.js 16 App Router structure
  - `(auth)/` - Login and signup pages (route group)
  - `(dashboard)/` - Protected chat interface
  - `api/chat/route.ts` - Edge runtime streaming chat endpoint
- `lib/` - Core business logic
  - `appwrite/` - Client-side Appwrite SDK (authentication, database operations)
  - `groq/` - Server-side Groq API client with model fallback chain
  - `files/` - File processing utilities (images, PDFs, text)
- `components/` - React components
  - `chat/` - Chat-specific components (messages, input, sidebar, markdown)
  - `ui/` - Reusable UI components (shadcn/ui based)
- `hooks/` - Custom React hooks (`useChat`, `use-mobile`)
- `types/` - TypeScript type definitions

### Key Architecture Patterns

**Groq Model Fallback Chain** (`lib/groq/client.ts`):
- Tries models in sequence: `openai/gpt-oss-120b` → `qwen/qwen3-32b` → `openai/gpt-oss-20b`
- If one model fails (rate limit, error), automatically tries the next
- Both streaming and non-streaming completion support

**Chat API Edge Runtime** (`app/api/chat/route.ts`):
- Deployed to Edge runtime for low latency
- 30-second max duration
- Returns streaming text responses using `ReadableStream`
- Model used is returned in `X-Model-Used` header

**Optimistic UI Pattern** (`hooks/useChat.ts`):
- User messages added to UI immediately before API call
- On error: message removed from UI, content saved to `lastFailedMessage` for retry
- Streaming response displayed in real-time via `streamingMessage` state
- Rate limit detection with user-friendly error messages

**File Processing** (`lib/files/processor.ts`):
- Client-side only (`"use client"`)
- PDF.js worker loaded dynamically from `/pdf.worker.min.mjs`
- **PDF limit: 5 pages maximum** to avoid token limits
- Supported formats: images (base64), PDFs (text extraction), text files, JSON
- Word documents: placeholder support only
- Files formatted for AI with metadata (type, name)

**Authentication Flow** (`lib/appwrite/client.ts`):
- Client-side Appwrite SDK
- Email/password authentication
- Auto sign-in after registration
- Session management with `getCurrentUser()` check

**Database Operations** (`lib/appwrite/database.ts`):
- Client-side database queries using Appwrite SDK
- Chats: ordered by `updatedAt`, limited to 100
- Messages: ordered by `createdAt`, limited to 1000 per chat
- Files stored as JSON strings in message documents

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` resolves to project root

### Styling

- Tailwind CSS with custom theme in `tailwind.config.ts`
- CSS variables for theming (defined in `app/globals.css`)
- Dark mode support via `class` strategy
- Component styling uses shadcn/ui conventions with `cn()` utility

## Important Implementation Notes

- The chat page (`app/(dashboard)/chat/page.tsx`) has TODOs for Appwrite integration (chat creation, selection, message persistence)
- PDF.js worker must be available at `/pdf.worker.min.mjs` in public directory
- Edge runtime restricts available Node.js APIs in chat route
- Groq API key must be server-side only (not in `NEXT_PUBLIC_*` variables)
- Message content includes file data when sent to AI, but UI displays only user text + file metadata
- Chat messages use Markdown rendering with syntax highlighting (highlight.js, react-markdown)
