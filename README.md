
# Smart Notes

Smart Notes is a local-first knowledge workspace that helps you capture ideas, connect notes, and use AI workflows around your personal context.

It combines:
- Note-taking and editing
- Graph-style context linking
- AI-assisted summaries and workflows
- Search and retrieval across connected notes
- Local + cloud-ready model settings

  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8cb17af2-a2bd-454b-92a2-aa084d689ed6" />

## What it does?

Smart Notes wraps your plain `.md` files with semantic search, an RAG pipeline, and a knowledge graph, all running on-device by default. Notes are automatically chunked, embedded, and indexed in the background the moment you open a workspace folder.

**Editor** - TipTap-based markdown editor with `[[WikiLink]]` note linking, slash commands (`/summarise`, `/expand`, `/fix grammar`), inline AI prompt via space trigger, and frontmatter parsed as a structured key-value panel.

**Hybrid Search (Cmd+K)** - combines BM25 keyword ranking with local vector similarity, merged via Reciprocal Rank Fusion. Results show source note, heading path, and a relevance score. Three modes: Semantic, Keyword, Hybrid.

**AI Panel** - ask questions about your notes and get streamed answers with inline citations (`[1]`, `[2]`) that jump to the exact source paragraph. Powered by Ollama locally or a BYOK cloud provider optionally. Repeated queries served from a local prompt cache instantly.

**Knowledge Graph** - interactive D3 force-directed graph where edges come from explicit `[[WikiLinks]]`, semantic similarity between notes, and co-citation patterns from AI sessions. Filterable by edge type, clickable to open notes.

**Context Sidebar** - Related tab surfaces the five closest notes to your current paragraph. Backlinks tab shows every note pointing to the current one. Auto-link suggestions appear inline as you write.

**Import / Export** - import from Obsidian vaults, Notion exports, and Roam JSON. Export notes to PDF, HTML, or the full vault as a ZIP.

**Browser Extension** - companion Chrome extension clips selected web text into your Inbox note via `Alt+S`, summarises pages, and surfaces related notes from your knowledge base.

## Tech Stack

- **Electron + electron-vite** — main/renderer process split, typed IPC bridge via Zod
- **React + TypeScript** — renderer UI, strict mode
- **TipTap** — ProseMirror-based extensible editor
- **SQLite** (`better-sqlite3`) — WAL mode, FTS5 keyword index, chunk + embedding storage, graph edges
- **Transformers.js** — local embedding inference in a Node.js worker thread
- **Ollama** — local LLM inference, auto-detected on startup
- **D3.js** — force-directed knowledge graph visualization
- **chokidar** — filesystem watcher for live incremental re-indexing

## Run Locally
```bash
npm install
npm run dev
```
```bash
npm run lint
npm run typecheck
```

## Build
```bash
npm run build
```

Platform installers:
```bash
npm run build:mac     
npm run build:win   
npm run build:linux 
```



