# AI Cowork Studio

> Your personal AI workspace — build intelligent agents, connect to external services, and chat with context-aware AI.

Inspired by [Microsoft Power CAT Copilot Studio Kit](https://github.com/microsoft/Power-CAT-Copilot-Studio-Kit).

---

## Features

| Feature | Description |
|---|---|
| **Google OAuth** | Sign in securely with your Google account |
| **Projects** | Organise agents and documents into workspaces |
| **AI Agents** | Create agents with custom system prompts powered by Claude |
| **Multi-model** | Choose Claude Opus 4.6, Sonnet 4.6, or Haiku 4.5 per agent |
| **RAG Documents** | Upload PDFs, Word docs, and text files as agent knowledge |
| **External Connectors** | Connect to Gmail, OneDrive, Google Drive, Slack, Notion |
| **MCP Servers** | Integrate local (stdio) and remote (SSE) MCP servers |
| **Streaming Chat** | Real-time streamed responses with conversation history |

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router, TypeScript)
- **Auth**: [Auth.js v5](https://authjs.dev) + Google OAuth
- **Database**: PostgreSQL via [Prisma ORM](https://prisma.io)
- **AI**: [Anthropic Claude API](https://anthropic.com) (`@anthropic-ai/sdk`)
- **MCP**: [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)
- **UI**: Tailwind CSS + Radix UI (shadcn-style components)

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd ai-cowork-studio
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) |

#### Google OAuth setup

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)

### 3. Set up the database

```bash
# Start PostgreSQL (or use docker-compose)
docker-compose up postgres -d

# Push the schema
npm run db:push
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker Compose

Run the full stack (app + PostgreSQL) with:

```bash
cp .env.example .env
# fill in .env
docker-compose up
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Google sign-in page
│   ├── (dashboard)/           # Protected dashboard
│   │   ├── page.tsx           # Overview
│   │   ├── projects/          # Project CRUD
│   │   ├── agents/[id]/       # Agent chat + settings + connectors
│   │   └── settings/          # Account & workspace info
│   └── api/
│       ├── auth/[...nextauth]/ # Auth.js handler
│       ├── projects/          # Project REST API
│       ├── agents/            # Agent REST API
│       ├── chat/              # Streaming chat (SSE)
│       ├── documents/         # Document upload & RAG indexing
│       └── connectors/        # Connector CRUD
├── components/
│   ├── ui/                    # shadcn-style primitives
│   └── layout/                # Sidebar & header
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── db.ts                  # Prisma client
│   ├── anthropic.ts           # Claude streaming & chat
│   ├── mcp.ts                 # MCP client (local + remote)
│   ├── rag.ts                 # Document parsing & retrieval
│   └── utils.ts               # Helpers
├── types/                     # Shared TypeScript types
prisma/
└── schema.prisma              # Database schema
```

---

## MCP Server Configuration

Add MCP connectors to any agent under the **Connectors** tab.

**Local (stdio):**
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-filesystem", "/path/to/dir"]
}
```

**Remote (SSE):**
```json
{
  "url": "https://my-mcp-server.example.com/sse",
  "headers": { "Authorization": "Bearer my-token" }
}
```

---

## Supported Document Formats

| Format | Extension |
|---|---|
| PDF | `.pdf` |
| Word | `.docx`, `.doc` |
| Plain text | `.txt` |
| Markdown | `.md` |
| CSV | `.csv` |

Max file size: 10 MB (configurable via `MAX_FILE_SIZE_MB` env var).

---

## License

[MIT](./LICENSE)
