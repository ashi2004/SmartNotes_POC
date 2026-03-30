# Smart Notes Desktop (Electron App)

## What Is Smart Notes?
Smart Notes is a local-first knowledge workspace that helps you capture ideas, connect notes, and use AI workflows around your personal context.

It combines:
- Note-taking and editing
- Graph-style context linking
- AI-assisted summaries and workflows
- Search and retrieval across connected notes
- Local + cloud-ready model settings

## Core Features (MVP)
- Full desktop workspace with left note tree, main editor, and right AI/graph panel
- Knowledge Graph tab with linked note navigation
- AI summary generation and append-to-document action
- Slash command shortcuts inside editor
- Space-trigger quick AI prompt
- Cmd/Ctrl+K unified search overlay with scoring
- Workspace import for markdown/text files
- P2P linking
- Settings panel for local/cloud provider configuration
- Note options menu and source-linked assistant responses
- Browser extension integration with Smart Notes and quick actions

## Run Locally
1. Install dependencies:
```bash
npm install
```
2. Start development app:
```bash
npm run dev
```
3. Optional checks:
```bash
npm run lint
npm run typecheck
```

## Build
```bash
npm run build
```

Platform packages:
```bash
npm run build:win
npm run build:mac
npm run build:linux
```

