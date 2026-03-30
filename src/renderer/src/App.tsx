import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Bold,
  Bot,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  GitBranch,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  ListChecks,
  MessageSquare,
  MoreHorizontal,
  Network,
  Plus,
  Quote,
  Search,
  Settings,
  Sparkles,
  SquareCode,
  X
} from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import heroImage from './assets/image.png'
import logoIcon from './assets/logo-icon.svg'

type TreeNodeItem = {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: TreeNodeItem[]
}

type TabItem = {
  id: string
  title: string
}

type NoteData = {
  id: string
  title: string
  folder: string
  fileName: string
  content: string
  links: string[]
}

type RightPaneTab = 'assistant' | 'graph'

type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  isSummary?: boolean
  sources?: string[]
}

type SlashCommand = {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  action: () => void
}

type NoteIndexStatus = 'indexed' | 'pending' | 'not-indexed'

type SearchResult = {
  noteId: string
  title: string
  folder: string
  score: number
  snippet: string
}

const baseTreeData: TreeNodeItem[] = [
  {
    id: 'workspace',
    name: 'Workspace',
    type: 'folder',
    children: []
  },
  {
    id: 'ai-stack',
    name: 'AI Stack',
    type: 'folder',
    children: [
      { id: 'llama3-gateway-md', name: 'llama3_local_gateway.md', type: 'file' },
      { id: 'chromadb-setup-md', name: 'chromadb_setup.md', type: 'file' },
      { id: 'semantic-indexing-md', name: 'semantic_indexing.md', type: 'file' }
    ]
  },
  {
    id: 'sync-layer',
    name: 'Sync Layer',
    type: 'folder',
    children: [{ id: 'crdt-sync-engine-md', name: 'crdt_sync_engine.md', type: 'file' }]
  }
]

const baseNotesData: Record<string, NoteData> = {
  'smartnotes-md': {
    id: 'smartnotes-md',
    title: 'SmartNotes.md',
    folder: 'Workspace',
    fileName: 'SmartNotes.md',
    links: ['electron-architecture-md', 'semantic-indexing-md', 'crdt-sync-engine-md'],
    content: `
      <h1>SmartNotes Blueprint</h1>
      <p>
        SmartNotes is an offline-first thinking workspace with local AI, semantic retrieval,
        and conflict-safe sync for multi-device usage.
      </p>
      <h2>Core Modules</h2>
      <ul>
        <li>Electron shell for desktop workflows and filesystem access.</li>
        <li>Local Llama 3 gateway to run contextual prompts privately.</li>
        <li>ChromaDB for vector search over markdown knowledge vaults.</li>
        <li>CRDT-based sync layer for concurrent edits without data loss.</li>
      </ul>
      <blockquote>
        Knowledge should stay local, connected, and instantly retrievable.
      </blockquote>
      <h3>Milestones</h3>
      <p>
        M1: markdown parsing and note indexing. M2: local semantic search pipeline.
        M3: assistant workflows grounded in graph links and project context.
      </p>
    `
  },
  'electron-architecture-md': {
    id: 'electron-architecture-md',
    title: 'electron_architecture.md',
    folder: 'Workspace',
    fileName: 'electron_architecture.md',
    links: ['smartnotes-md', 'llama3-gateway-md', 'crdt-sync-engine-md'],
    content: `
      <h1>Electron Architecture</h1>
      <p>
        Process boundaries are split into main, preload, and renderer for security and
        maintainability.
      </p>
      <h2>System Design</h2>
      <ul>
        <li>Main process: workspace bootstrap, note indexing, IPC command routing.</li>
        <li>Preload bridge: typed APIs exposed to renderer with strict channel guards.</li>
        <li>Renderer: editor UI, AI panel, and knowledge graph interactions.</li>
      </ul>
      <p>
        The watcher service emits change events so indexing can run incrementally.
      </p>
    `
  },
  'llama3-gateway-md': {
    id: 'llama3-gateway-md',
    title: 'llama3_local_gateway.md',
    folder: 'AI Stack',
    fileName: 'llama3_local_gateway.md',
    links: ['smartnotes-md', 'semantic-indexing-md'],
    content: `
      <h1>Llama 3 Local Gateway</h1>
      <p>
        The gateway runs local inference with prompt templates tuned for note summarization,
        task extraction, and architecture Q&A.
      </p>
      <h2>Prompt Contract</h2>
      <ul>
        <li>Input: active note body + linked note snippets + user instruction.</li>
        <li>Output: concise markdown with confidence labels and references.</li>
      </ul>
      <p>
        Requests are streamed to the right pane and saved into a local assistant history.
      </p>
    `
  },
  'chromadb-setup-md': {
    id: 'chromadb-setup-md',
    title: 'chromadb_setup.md',
    folder: 'AI Stack',
    fileName: 'chromadb_setup.md',
    links: ['semantic-indexing-md', 'smartnotes-md'],
    content: `
      <h1>ChromaDB Setup</h1>
      <p>
        ChromaDB stores embeddings for every note block and heading to support contextual
        retrieval across the workspace.
      </p>
      <h2>Index Strategy</h2>
      <ul>
        <li>Chunk markdown by semantic sections instead of fixed token windows.</li>
        <li>Attach metadata: note_id, heading, tags, updated_at, and backlinks.</li>
        <li>Re-index only changed chunks via watcher-triggered jobs.</li>
      </ul>
    `
  },
  'semantic-indexing-md': {
    id: 'semantic-indexing-md',
    title: 'semantic_indexing.md',
    folder: 'AI Stack',
    fileName: 'semantic_indexing.md',
    links: ['chromadb-setup-md', 'smartnotes-md', 'llama3-gateway-md'],
    content: `
      <h1>Semantic Indexing</h1>
      <p>
        The indexing pipeline turns markdown notes into embeddings and backlink-aware
        retrieval candidates.
      </p>
      <h2>Pipeline</h2>
      <ul>
        <li>Parse markdown AST and collect headings, links, and task blocks.</li>
        <li>Generate embeddings with local model runtime.</li>
        <li>Persist vectors and relation edges for graph and search views.</li>
      </ul>
      <blockquote>
        Search quality improves when graph context and embeddings are ranked together.
      </blockquote>
    `
  },
  'crdt-sync-engine-md': {
    id: 'crdt-sync-engine-md',
    title: 'crdt_sync_engine.md',
    folder: 'Sync Layer',
    fileName: 'crdt_sync_engine.md',
    links: ['smartnotes-md', 'electron-architecture-md'],
    content: `
      <h1>CRDT Sync Engine</h1>
      <p>
        Conflict-free replicated data types merge note edits from multiple devices without
        locking or overwrites.
      </p>
      <h2>Sync Lifecycle</h2>
      <ul>
        <li>Collect local operations and maintain lamport clocks.</li>
        <li>Exchange deltas through peer transport or relay service.</li>
        <li>Resolve structure and text operations deterministically.</li>
      </ul>
      <p>
        The merge output updates markdown and graph edges in one transaction.
      </p>
    `
  }
}

const noteIndexStatusById: Record<string, NoteIndexStatus> = {
  'smartnotes-md': 'indexed',
  'electron-architecture-md': 'indexed',
  'llama3-gateway-md': 'pending',
  'chromadb-setup-md': 'indexed',
  'semantic-indexing-md': 'indexed',
  'crdt-sync-engine-md': 'not-indexed'
}

const initialTabs: TabItem[] = [{ id: 'smartnotes-md', title: 'SmartNotes.md' }]

function buildGraphNodes(
  notes: Record<string, NoteData>
): { id: string; label: string; x: number; y: number }[] {
  const entries = Object.values(notes)
  const radius = 112
  const centerX = 168
  const centerY = 145

  return entries.map((note, index) => {
    const angle = (Math.PI * 2 * index) / entries.length
    return {
      id: note.id,
      label: note.fileName,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    }
  })
}

function buildGraphEdges(notes: Record<string, NoteData>): { from: string; to: string }[] {
  return Object.values(notes).flatMap((note) =>
    note.links.map((target) => ({ from: note.id, to: target }))
  )
}

function plainTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function markdownToHtml(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('')
}

function getSearchResults(notes: Record<string, NoteData>, query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return Object.values(notes)
    .map((note) => {
      const plain = plainTextFromHtml(note.content).toLowerCase()
      const titleScore = note.fileName.toLowerCase().includes(normalized) ? 0.5 : 0
      const textHits = plain.split(normalized).length - 1
      const score = Math.min(0.99, titleScore + Math.min(0.49, textHits * 0.12) + 0.35)
      return {
        noteId: note.id,
        title: note.fileName,
        folder: note.folder,
        score,
        snippet: plainTextFromHtml(note.content).slice(0, 150)
      }
    })
    .filter((item) => item.score > 0.36)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

function createSummaryText(content: string): string {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const sentences = plain
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const chosen = sentences.slice(0, 3)
  if (chosen.length === 0) {
    return 'This note captures technical direction and execution priorities. It outlines the architecture, indexing path, and practical next actions for shipping Smart Notes.'
  }
  return chosen.join(' ')
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  activeFile,
  onSelectFile,
  noteStatusById
}: {
  node: TreeNodeItem
  depth: number
  expanded: Record<string, boolean>
  onToggle: (id: string) => void
  activeFile: string
  onSelectFile: (id: string) => void
  noteStatusById: Record<string, NoteIndexStatus>
}): React.JSX.Element {
  const isFolder = node.type === 'folder'
  const isOpen = expanded[node.id]
  const isActive = node.id === activeFile

  return (
    <div>
      <button
        className={`group tree-node-btn ${isActive ? 'tree-node-active' : 'tree-node-default'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => {
          if (isFolder) {
            onToggle(node.id)
            return
          }
          onSelectFile(node.id)
        }}
      >
        {isFolder ? (
          isOpen ? (
            <ChevronDown size={14} className="tree-node-icon" />
          ) : (
            <ChevronRight size={14} className="tree-node-icon" />
          )
        ) : (
          <span className="w-[14px]" />
        )}
        {isFolder ? (
          <>
            {isOpen ? (
              <FolderOpen size={13} className="tree-folder-icon" />
            ) : (
              <Folder size={13} className="tree-folder-icon" />
            )}
            <span>{node.name}</span>
          </>
        ) : (
          <>
            <span
              className={`note-index-dot note-index-${noteStatusById[node.id] ?? 'not-indexed'}`}
              aria-label={`index status ${noteStatusById[node.id] ?? 'not-indexed'}`}
            />
            <FileText size={13} className={isActive ? 'tree-file-active' : 'tree-file-default'} />
            <span>{node.name}</span>
          </>
        )}
      </button>
      {isFolder && isOpen && node.children ? (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              activeFile={activeFile}
              onSelectFile={onSelectFile}
              noteStatusById={noteStatusById}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function App(): React.JSX.Element {
  const workspaceFileInputRef = useRef<HTMLInputElement>(null)
  const noteMenuRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'welcome' | 'workspace'>('welcome')
  const [tabs, setTabs] = useState<TabItem[]>(initialTabs)
  const [activeFile, setActiveFile] = useState<string>('smartnotes-md')
  const [rightTab, setRightTab] = useState<RightPaneTab>('assistant')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [uploadedNotes, setUploadedNotes] = useState<Record<string, NoteData>>({})
  const [cloudProvidersEnabled, setCloudProvidersEnabled] = useState(false)
  const [cloudProvider, setCloudProvider] = useState<'gemini' | 'openai'>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [automaticIndexing, setAutomaticIndexing] = useState(true)
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: 'Ask anything about your notes. I can summarize, extract tasks, and map linked context.'
    }
  ])
  const [appendedSummaryByNote, setAppendedSummaryByNote] = useState<Record<string, boolean>>({})
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [quickAiOpen, setQuickAiOpen] = useState(false)
  const [quickAiInput, setQuickAiInput] = useState('')
  const [showEditorHint, setShowEditorHint] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const [searchOverlayInput, setSearchOverlayInput] = useState('')
  const [pairingCode] = useState('SN-P2P-47KQ')
  const [isPairing, setIsPairing] = useState(false)
  const [pairProgress, setPairProgress] = useState(0)
  const [noteMenuOpen, setNoteMenuOpen] = useState(false)

  const [embeddingModel, setEmbeddingModel] = useState('Embedding Model')

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    workspace: true,
    'ai-stack': true,
    'sync-layer': true
  })
  const [noteContents, setNoteContents] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {}
    Object.values(baseNotesData).forEach((note) => {
      initialState[note.id] = note.content
    })
    return initialState
  })

  const allNotes = useMemo(() => ({ ...baseNotesData, ...uploadedNotes }), [uploadedNotes])

  const treeData = useMemo(() => {
    const workspaceNotes = Object.values(allNotes)
      .filter((note) => note.folder === 'Workspace')
      .map((note) => ({ id: note.id, name: note.fileName, type: 'file' as const }))

    return baseTreeData.map((node) =>
      node.id === 'workspace' ? { ...node, children: workspaceNotes } : node
    )
  }, [allNotes])

  const mergedNoteStatus = useMemo(() => {
    const uploadedStatuses: Record<string, NoteIndexStatus> = {}
    Object.keys(uploadedNotes).forEach((id) => {
      uploadedStatuses[id] = 'pending'
    })
    return { ...noteIndexStatusById, ...uploadedStatuses }
  }, [uploadedNotes])

  const editor = useEditor({
    extensions: [StarterKit],
    content: allNotes['smartnotes-md'].content,
    onUpdate: ({ editor: tiptapEditor }) => {
      const html = tiptapEditor.getHTML()
      setNoteContents((prev) => ({
        ...prev,
        [activeFile]: html
      }))
    },
    editorProps: {
      attributes: {
        class: 'editor-prose'
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
          setSlashMenuOpen(true)
          return false
        }

        if (event.key === 'Escape') {
          setSlashMenuOpen(false)
          setQuickAiOpen(false)
          setSearchOverlayOpen(false)
          return false
        }

        if (event.key === ' ') {
          const selection = view.state.selection
          const lineStart = selection.$from.start()
          const lineEnd = selection.$from.end()
          const lineText = view.state.doc.textBetween(lineStart, lineEnd, '', '').trim()
          if (selection.empty && lineText.length === 0) {
            setQuickAiOpen(true)
          }
        }

        return false
      }
    }
  })

  useEffect(() => {
    if (!editor) return
    const nextContent = noteContents[activeFile] ?? allNotes[activeFile]?.content
    if (nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false })
    }
  }, [activeFile, editor, noteContents, allNotes])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOverlayOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!editor) return

    const updateHint = (): void => {
      const selection = editor.state.selection
      if (!selection.empty) {
        setShowEditorHint(false)
        return
      }
      const lineStart = selection.$from.start()
      const lineEnd = selection.$from.end()
      const lineText = editor.state.doc.textBetween(lineStart, lineEnd, '', '').trim()
      setShowEditorHint(lineText.length === 0)
    }

    const hideHint = (): void => setShowEditorHint(false)

    editor.on('selectionUpdate', updateHint)
    editor.on('focus', updateHint)
    editor.on('blur', hideHint)
    updateHint()

    return () => {
      editor.off('selectionUpdate', updateHint)
      editor.off('focus', updateHint)
      editor.off('blur', hideHint)
    }
  }, [editor])

  useEffect(() => {
    if (!isPairing) return
    const timer = window.setInterval(() => {
      setPairProgress((prev) => {
        const next = Math.min(100, prev + 10)
        if (next >= 100) {
          setIsPairing(false)
        }
        return next
      })
    }, 350)

    return () => window.clearInterval(timer)
  }, [isPairing])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent): void => {
      if (!noteMenuRef.current) return
      if (!noteMenuRef.current.contains(event.target as Node)) {
        setNoteMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [])

  const activeTabTitle = useMemo(() => {
    return tabs.find((tab) => tab.id === activeFile)?.title ?? 'SmartNotes.md'
  }, [tabs, activeFile])

  const activeNote = allNotes[activeFile]

  const graphNodes = useMemo(() => buildGraphNodes(allNotes), [allNotes])
  const graphEdges = useMemo(() => buildGraphEdges(allNotes), [allNotes])

  const closeTab = (tabId: string): void => {
    if (tabs.length === 1) return

    setTabs((prev) => prev.filter((tab) => tab.id !== tabId))

    if (activeFile === tabId) {
      const fallback = tabs.find((tab) => tab.id !== tabId)
      if (fallback) setActiveFile(fallback.id)
    }
  }

  const selectFile = (fileId: string): void => {
    if (!allNotes[fileId]) return
    setActiveFile(fileId)
    if (!tabs.find((tab) => tab.id === fileId)) {
      setTabs((prev) => [...prev, { id: fileId, title: allNotes[fileId].fileName }])
    }
    setSearchOverlayOpen(false)
  }

  const handleWorkspaceImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileContent = await file.text()
    const sanitizedName = file.name.replace(/\s+/g, '_').toLowerCase()
    const noteId = `workspace-${Date.now()}-${sanitizedName.replace(/[^a-z0-9_.-]/g, '')}`
    const htmlContent = markdownToHtml(fileContent)
    const newNote: NoteData = {
      id: noteId,
      title: file.name,
      folder: 'Workspace',
      fileName: file.name,
      content: htmlContent,
      links: ['smartnotes-md']
    }

    setUploadedNotes((prev) => ({
      ...prev,
      [noteId]: newNote
    }))

    setNoteContents((prev) => ({
      ...prev,
      [noteId]: htmlContent
    }))

    setTabs((prev) => [...prev, { id: noteId, title: newNote.fileName }])
    setActiveFile(noteId)

    event.target.value = ''
  }

  const runOverlaySearch = (): SearchResult[] => {
    return getSearchResults(allNotes, searchOverlayInput)
  }

  const startPairing = (): void => {
    setPairProgress(0)
    setIsPairing(true)
  }

  const insertCommandContent = (commandId: string): void => {
    if (!editor) return

    if (commandId === 'highlight') {
      editor.chain().focus().insertContent('<p><strong>Highlighted:</strong> key insight goes here.</p>').run()
    }

    if (commandId === 'add-media') {
      editor
        .chain()
        .focus()
        .insertContent('<p>[Media] Add image or file reference here.</p>')
        .run()
    }

    if (commandId === 'add-code') {
      editor
        .chain()
        .focus()
        .insertContent('<pre><code class="language-ts">// Write code here\nconst result = true</code></pre>')
        .run()
    }

    if (commandId === 'continue-writing') {
      editor
        .chain()
        .focus()
        .insertContent('<p>Continue this section with implementation details and examples.</p>')
        .run()
    }

    if (commandId === 'extract-actions') {
      editor
        .chain()
        .focus()
        .insertContent('<ul><li>[ ] Action item one</li><li>[ ] Action item two</li></ul>')
        .run()
    }

    setSlashMenuOpen(false)
  }

  const handleSummarizeCurrentNote = (): void => {
    const currentContent = noteContents[activeFile] ?? allNotes[activeFile].content
    const summary = createSummaryText(currentContent)

    setRightTab('assistant')
    setAssistantMessages((prev) => [
      ...prev,
      {
        id: `user-summary-${Date.now()}`,
        role: 'user',
        text: `Summarize this note: ${allNotes[activeFile].fileName}`
      },
      {
        id: `assistant-summary-${Date.now()}`,
        role: 'assistant',
        text: summary,
        isSummary: true,
        sources: [activeFile]
      }
    ])
  }

  const handleAppendSummary = (summaryText: string): void => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertContent(`<h2>AI Summary</h2><p>${summaryText}</p>`)
      .run()

    setAppendedSummaryByNote((prev) => ({
      ...prev,
      [activeFile]: true
    }))
  }

  const slashCommands: SlashCommand[] = [
    { id: 'highlight', label: 'Highlight', icon: Highlighter, action: () => insertCommandContent('highlight') },
    { id: 'add-media', label: 'Add media', icon: ImagePlus, action: () => insertCommandContent('add-media') },
    { id: 'add-code', label: 'Add code', icon: SquareCode, action: () => insertCommandContent('add-code') },
    {
      id: 'continue-writing',
      label: 'Continue writing',
      icon: Sparkles,
      action: () => insertCommandContent('continue-writing')
    },
    {
      id: 'extract-actions',
      label: 'Extract action items',
      icon: ListChecks,
      action: () => insertCommandContent('extract-actions')
    }
  ]

  const sendAssistantQuestion = (): void => {
    const question = assistantInput.trim()
    if (!question) return

    const lower = question.toLowerCase()
    setAssistantMessages((prev) => [
      ...prev,
      {
        id: `user-q-${Date.now()}`,
        role: 'user',
        text: question
      }
    ])

    if (lower.includes('what is smart notes')) {
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `assistant-q-${Date.now()}`,
          role: 'assistant',
          text: 'Smart Notes is an offline-first knowledge workspace that combines markdown notes, semantic search, and local AI assistance to help you connect ideas and retrieve context quickly.',
          sources: ['smartnotes-md', 'semantic-indexing-md']
        }
      ])
      setAssistantInput('')
      return
    }

    const response = `This note focuses on ${allNotes[activeFile].fileName} and its related architecture context. You can use the linked notes to expand implementation details and decisions.`
    setAssistantMessages((prev) => [
      ...prev,
      {
        id: `assistant-q-${Date.now()}`,
        role: 'assistant',
        text: response,
        sources: [activeFile]
      }
    ])
    setAssistantInput('')
  }

  if (view === 'welcome') {
    return (
      <div className="welcome-root">
        <div className="welcome-glow" />
        <section className="welcome-fullscreen">
          <div className="welcome-content">
            <img src={logoIcon} alt="Smart Notes" className="welcome-logo-inline" />
            <h1 className="welcome-title">Work smarter with SmartNotes,</h1>
            <p className="welcome-subtitle">Organize ideas, tasks, and context in one focused workspace.</p>

            <div className="welcome-actions">
              <button className="primary-btn" onClick={() => setView('workspace')}>
                <span>Getting Started</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="welcome-tilt-wrap" aria-hidden="true">
            <img src={heroImage} alt="SmartNotes preview" className="welcome-hero-image" />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="workspace-root">
      <div className="workspace-shell">
        <aside className="pane pane-left">
          <div className="pane-header pane-header-left">
            <div className="brand-block">
              <img src={logoIcon} alt="SmartNotes" className="brand-logo" />
              <div>
                <p className="brand-name">Smart Notes</p>
                <p className="brand-subtext">Knowledge Workspace</p>
              </div>
            </div>
            <button
              type="button"
              className="add-workspace-btn"
              onClick={() => workspaceFileInputRef.current?.click()}
            >
              <Plus size={14} />
              <span>Add Workspace</span>
            </button>
            <input
              ref={workspaceFileInputRef}
              type="file"
              accept=".md,.txt"
              className="hidden-file-input"
              onChange={handleWorkspaceImport}
            />
          </div>

          <div className="pane-content pane-content-left thin-scrollbar">
            {treeData.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expanded={expandedFolders}
                onToggle={(id) =>
                  setExpandedFolders((prev) => ({
                    ...prev,
                    [id]: !prev[id]
                  }))
                }
                activeFile={activeFile}
                onSelectFile={selectFile}
                noteStatusById={mergedNoteStatus}
              />
            ))}
          </div>

          <div className="pane-footer">
            <span className="pane-footer-note-status">
              <span className="note-index-dot note-index-indexed" />
              {Object.keys(allNotes).length} Notes
            </span>
            <button className="icon-btn" type="button" onClick={() => setSettingsOpen(true)}>
              <Settings size={14} />
            </button>
          </div>
        </aside>

        <main className="pane pane-main">
          <div className="main-topbar">
            <div>
              <p className="main-title">Smart Notes Workspace</p>
              <p className="main-subtitle">
                {activeNote.folder} / {activeNote.fileName}
              </p>
            </div>
            <div className="main-topbar-actions">
              <button
                type="button"
                className="main-search-box"
                onClick={() => {
                  setSearchOverlayOpen(true)
                  setSearchOverlayInput('')
                }}
              >
                <Search size={14} />
                <span>Search notes</span>
                <kbd>Ctrl K</kbd>
              </button>
              <div className="note-menu-wrap" ref={noteMenuRef}>
                <button
                  type="button"
                  className="note-menu-trigger"
                  onClick={() => setNoteMenuOpen((prev) => !prev)}
                >
                  <MoreHorizontal size={16} />
                </button>
                {noteMenuOpen ? (
                  <div className="note-menu-popover">
                    <button type="button">Copy link</button>
                    <button type="button">Copy page contents</button>
                    <button type="button">Duplicate</button>
                    <button type="button">Move to</button>
                    <button type="button">Import</button>
                    <button type="button">Export</button>
                  </div>
                ) : null}
              </div>
              <div className="main-status">AI LOCAL SYNC</div>
            </div>
          </div>

          <div className="tabs-row thin-scrollbar">
            <div className="tabs-wrap">
              {tabs.map((tab) => {
                const isActive = tab.id === activeFile
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFile(tab.id)}
                    className={`group tab-btn ${isActive ? 'tab-btn-active' : 'tab-btn-default'}`}
                  >
                    <span>{tab.title}</span>
                    <span
                      role="button"
                      className="tab-close"
                      onClick={(event) => {
                        event.stopPropagation()
                        closeTab(tab.id)
                      }}
                    >
                      <X size={13} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-toolbar">
            <div className="toolbar-group">
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                type="button"
              >
                <Bold size={14} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                type="button"
              >
                <Italic size={14} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                type="button"
              >
                <Heading1 size={14} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                type="button"
              >
                <Heading2 size={14} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                type="button"
              >
                <Heading3 size={14} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                type="button"
              >
                <List size={14} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                type="button"
              >
                <Quote size={14} />
              </button>
            </div>
            <button className="graph-jump-btn" type="button" onClick={() => setRightTab('graph')}>
              <Network size={15} />
              <span>Open Knowledge Graph</span>
            </button>
          </div>

          <div className="editor-wrap thin-scrollbar">
            <div className="editor-shell">
              <p className="editor-file-label">{activeTabTitle}</p>
              <EditorContent editor={editor} className="editor-content" />
            </div>

            <div className="floating-meta">
              <div className="meta-card">
                <span>{allNotes[activeFile].links.length} links</span>
                <span>tech note</span>
                <button
                  className="meta-action"
                  type="button"
                  onClick={handleSummarizeCurrentNote}
                >
                  Summarize note
                </button>
              </div>
            </div>

            {slashMenuOpen ? (
              <div className="slash-menu">
                {slashCommands.map((command) => {
                  const Icon = command.icon
                  return (
                    <button key={command.id} type="button" className="slash-item" onClick={command.action}>
                      <Icon size={15} />
                      <span>{command.label}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}

            {quickAiOpen ? (
              <div className="quick-ai-wrap">
                <div className="quick-ai-head">Press space for AI or / for commands</div>
                <div className="quick-ai-input-row">
                  <img src={logoIcon} alt="Smart Notes" className="quick-ai-logo" />
                  <input
                    value={quickAiInput}
                    onChange={(event) => setQuickAiInput(event.target.value)}
                    placeholder="Edit with AI (@ mention to use a skill)"
                  />
                  <button type="button" onClick={() => setQuickAiOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : null}

            {showEditorHint && !quickAiOpen && !slashMenuOpen ? (
              <div className="editor-context-hint">Press space for AI or / for commands</div>
            ) : null}
          </div>
        </main>

        <aside className="pane pane-right">
          <div className="pane-header pane-header-right">
            <button
              type="button"
              className={`right-tab-btn ${rightTab === 'assistant' ? 'right-tab-btn-active' : ''}`}
              onClick={() => setRightTab('assistant')}
            >
              AI Assistant
            </button>
            <button
              type="button"
              className={`right-tab-btn ${rightTab === 'graph' ? 'right-tab-btn-active' : ''}`}
              onClick={() => setRightTab('graph')}
            >
              Knowledge Graph
            </button>
          </div>

          {rightTab === 'assistant' ? (
            <div className="assistant-pane">
              <div className="assistant-chat thin-scrollbar">
                {assistantMessages.map((message) => (
                  <div
                    key={message.id}
                    className={message.role === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-assistant'}
                  >
                    {message.role === 'assistant' ? (
                      <div className="assistant-message-head">
                        <Bot size={14} />
                        <span>Smart AI</span>
                      </div>
                    ) : (
                      <div className="assistant-message-head">
                        <MessageSquare size={14} />
                        <span>You</span>
                      </div>
                    )}
                    <p>{message.text}</p>
                    {message.isSummary ? (
                      <button
                        className="append-summary-btn"
                        type="button"
                        disabled={Boolean(appendedSummaryByNote[activeFile])}
                        onClick={() => handleAppendSummary(message.text)}
                      >
                        {appendedSummaryByNote[activeFile] ? 'Appended to doc' : 'Append this to doc'}
                      </button>
                    ) : null}
                    {message.sources?.length ? (
                      <div className="assistant-sources-block">
                        <span>Sources</span>
                        <div className="source-pills">
                          {message.sources.map((sourceId) => (
                            <button key={sourceId} type="button" onClick={() => selectFile(sourceId)}>
                              {allNotes[sourceId]?.fileName ?? sourceId}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="assistant-input-wrap">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  placeholder="Ask your notes anything..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      sendAssistantQuestion()
                    }
                  }}
                />
                <button type="button" onClick={sendAssistantQuestion}>Ask AI</button>
              </div>
              <div className="assistant-model-footer">Local model: Qwen 2.5 3B · Offline mode</div>
            </div>
          ) : (
            <div className="graph-pane">
              <p className="graph-title">Knowledge Graph</p>
              <p className="graph-subtitle">
                Click any node to open that note and inspect linked context.
              </p>

              <svg
                viewBox="0 0 340 290"
                className="graph-canvas"
                role="img"
                aria-label="Knowledge graph of notes"
              >
                {graphEdges.map((edge) => {
                  const fromNode = graphNodes.find((node) => node.id === edge.from)
                  const toNode = graphNodes.find((node) => node.id === edge.to)
                  if (!fromNode || !toNode) return null

                  const isActiveEdge = edge.from === activeFile || edge.to === activeFile
                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      className={isActiveEdge ? 'graph-edge graph-edge-active' : 'graph-edge'}
                    />
                  )
                })}

                {graphNodes.map((node) => {
                  const isActiveNode = node.id === activeFile
                  return (
                    <g
                      key={node.id}
                      onClick={() => selectFile(node.id)}
                      className="graph-node-group"
                      role="button"
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isActiveNode ? 23 : 18}
                        className={isActiveNode ? 'graph-node graph-node-active' : 'graph-node'}
                      />
                      <text x={node.x} y={node.y + 33} textAnchor="middle" className="graph-label">
                        {node.label.replace('.md', '')}
                      </text>
                    </g>
                  )
                })}
              </svg>

              <div className="graph-meta">
                <GitBranch size={14} />
                <span>{graphEdges.length} relationships mapped</span>
              </div>
            </div>
          )}
        </aside>

        {settingsOpen ? (
          <div className="settings-overlay" onClick={() => setSettingsOpen(false)}>
            <section className="settings-panel" onClick={(event) => event.stopPropagation()}>
              <div className="settings-header">
                <div>
                  <p className="settings-title">AI Settings</p>
                  <p className="settings-subtitle">Configure model runtime and provider access.</p>
                </div>
                <button className="icon-btn" type="button" onClick={() => setSettingsOpen(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">Embedding Model</p>
                <p className="settings-section-subtitle">
                  Choose the vector model used for semantic similarity.
                </p>
                <select
                  id="embedding-model"
                  className="settings-input"
                  value={embeddingModel}
                  onChange={(event) => setEmbeddingModel(event.target.value)}
                >
                  <option value="MiniLM">Embedding Model</option>
                  <option value="nomic-embed">nomic-embed</option>
                </select>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">Indexing Configuration</p>
                <div className="settings-row-between">
                  <div>
                    <p className="settings-mini-title">Automatic Indexing</p>
                    <p className="settings-mini-subtitle">Reindex notes immediately after saving changes.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={automaticIndexing}
                      onChange={(event) => setAutomaticIndexing(event.target.checked)}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <p className="settings-section-title">AI Provider</p>
                <div className="provider-card">
                  <div>
                    <p className="provider-label">Local Provider</p>
                    <p className="provider-name">Ollama</p>
                    <p className="provider-sub">Connected to http://localhost:11434</p>
                  </div>
                  <span className="provider-active-pill">ACTIVE</span>
                </div>
                <div className="settings-row-between">
                  <div>
                    <p className="settings-mini-title">Allow Cloud Providers</p>
                    <p className="settings-mini-subtitle">Enable connections to Gemini and OpenAI.</p>
                  </div>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={cloudProvidersEnabled}
                      onChange={(event) => setCloudProvidersEnabled(event.target.checked)}
                    />
                    <span className="settings-slider" />
                  </label>
                </div>

                {cloudProvidersEnabled ? (
                  <>
                    <label className="settings-label" htmlFor="cloud-provider">
                      Cloud Provider
                    </label>
                    <select
                      id="cloud-provider"
                      className="settings-input"
                      value={cloudProvider}
                      onChange={(event) => setCloudProvider(event.target.value as 'gemini' | 'openai')}
                    >
                      <option value="gemini">Gemini (Default)</option>
                      <option value="openai">OpenAI</option>
                    </select>

                    <label className="settings-label" htmlFor="cloud-api-key">
                      API Key
                    </label>
                    <input
                      id="cloud-api-key"
                      type="password"
                      className="settings-input"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder={cloudProvider === 'openai' ? 'sk-...' : 'AIza...'}
                    />
                  </>
                ) : null}
              </div>

              <div className="settings-section">
                <p className="settings-section-title">Maintenance</p>
                <div className="settings-action-lines">
                  <button type="button" className="settings-secondary-btn">
                    Export / Backup
                  </button>
                  <button type="button" className="settings-secondary-btn">
                    Rebuild Index
                  </button>
                  <button type="button" className="settings-danger-btn">
                    Factory Reset
                  </button>
                </div>
                
              </div>

              <div className="settings-section">
                <p className="settings-section-title">P2P Device Pairing</p>
                <p className="settings-section-subtitle">
                  Pair your phone on the same network and transfer vault plus index.
                </p>
                <div className="settings-row-between">
                  <div>
                    <p className="settings-mini-title">Pairing Code</p>
                    <p className="provider-sub">{pairingCode}</p>
                  </div>
                  <button type="button" className="settings-secondary-btn" onClick={startPairing}>
                    Connect
                  </button>
                </div>
                {isPairing || pairProgress > 0 ? (
                  <div className="pair-progress-wrap">
                    <div className="pair-progress-label">
                      <span>Transferring Vault and Index</span>
                      <strong>{pairProgress}%</strong>
                    </div>
                    <div className="pair-progress-track">
                      <div className="pair-progress-fill" style={{ width: `${pairProgress}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {searchOverlayOpen ? (
          <div className="cmdk-overlay" onClick={() => setSearchOverlayOpen(false)}>
            <section className="cmdk-panel" onClick={(event) => event.stopPropagation()}>
              <div className="cmdk-input-row">
                <Search size={15} />
                <input
                  autoFocus
                  value={searchOverlayInput}
                  placeholder="Search across notes..."
                  onChange={(event) => setSearchOverlayInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      const results = runOverlaySearch()
                      if (results[0]) {
                        selectFile(results[0].noteId)
                      }
                    }
                  }}
                />
              </div>
              <div className="cmdk-results thin-scrollbar">
                {runOverlaySearch().map((result) => (
                  <button
                    type="button"
                    key={`${result.noteId}-${result.score}`}
                    className="cmdk-result-item"
                    onClick={() => selectFile(result.noteId)}
                  >
                    <div>
                      <p className="cmdk-title">{result.title}</p>
                      <p className="cmdk-subtitle">{result.folder} · {result.snippet}</p>
                    </div>
                    <span className="cmdk-score">{result.score.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default App
