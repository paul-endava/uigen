# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

UIGen is an AI-powered React component generator with live preview. Users describe React components in natural language; Claude AI generates them in real-time using a virtual file system (no files written to disk). Features include a Monaco code editor, sandboxed iframe preview, and project persistence for authenticated users.

## Commands

```bash
npm run setup        # First-time setup: install deps + Prisma generate + migrations
npm run dev          # Dev server with Turbopack
npm run dev:daemon   # Dev server in background (logs to logs.txt)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest
npm run db:reset     # Force reset SQLite database (destructive)
```

**Running a single test:**
```bash
npx vitest run src/path/to/file.test.ts
```

**Required env var:** `ANTHROPIC_API_KEY` in `.env`. Without it, the app falls back to a `MockLanguageModel` that generates static demo components.

## Architecture

### Three-Panel Layout
- Left (35%): `ChatInterface` — user prompts and AI message history
- Right (65%): Toggle between `PreviewFrame` (iframe) and `CodeEditor` (Monaco) + `FileTree`

### AI Generation Flow
1. User submits prompt → `POST /api/chat` with serialized `VirtualFileSystem`
2. Claude streams responses using two tools:
   - `str_replace_editor` (`/src/lib/tools/str-replace.ts`): `view`, `create`, `str_replace`, `insert`, `undo_edit`
   - `file_manager` (`/src/lib/tools/file-manager.ts`): `rename`, `delete`
3. Tool calls update the in-memory `VirtualFileSystem`
4. `FileSystemContext` propagates changes to `PreviewFrame`, `FileTree`, and `CodeEditor`
5. `PreviewFrame` transpiles JSX client-side via Babel standalone, resolves imports from esm.sh CDN, renders in sandboxed iframe

### Virtual File System
- Implemented in `/src/lib/file-system.ts` as an in-memory `Map`
- No disk I/O — all paths normalized with leading `/`
- Serialized to JSON for Prisma storage (`Project.data`) and API requests

### State Management
Two React Contexts (both in `/src/lib/contexts/`):
- `FileSystemContext` — `VirtualFileSystem` instance, selected file, file operations, refresh trigger
- `ChatContext` — wraps Vercel AI SDK's `useChat()`, handles tool call callbacks, anonymous work tracking

### Authentication
- JWT sessions in HTTP-only cookies (7-day expiry), verified by `src/middleware.ts`
- Server actions in `/src/actions/` handle sign-up/sign-in (bcrypt, 10 rounds)
- Anonymous users lose state on refresh; authenticated users persist projects to SQLite via Prisma

### Database
SQLite via Prisma at `prisma/dev.db`. Two models:
- `User` — email + hashed password
- `Project` — `messages` (JSON) + `data` (serialized VirtualFileSystem JSON), optional `userId`

### AI Provider (`/src/lib/provider.ts`)
- Uses Claude Haiku 4.5 with prompt caching on the system message
- Falls back to `MockLanguageModel` when `ANTHROPIC_API_KEY` is absent

### Preview Entry Point Detection
`PreviewFrame` looks for `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` as the component root.

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Streaming AI endpoint — tool execution + project save |
| `src/lib/file-system.ts` | Virtual FS implementation |
| `src/lib/contexts/` | React state contexts |
| `src/lib/tools/` | AI tool definitions |
| `src/lib/transform/jsx-transformer.ts` | Babel + esm.sh import resolution |
| `src/lib/provider.ts` | Claude model + mock fallback |
| `src/lib/prompts/` | System prompts for Claude |
| `src/actions/` | Server actions (auth, project management) |
| `prisma/schema.prisma` | Database schema |
