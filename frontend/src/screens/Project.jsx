import { useState, useEffect, useContext, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import { UserContext } from '../context/UserContext'
import Markdown from "markdown-to-jsx"
import Editor from '@monaco-editor/react'
import { getWebContainer } from "../config/webContainer"

const Project = () => {
    const { projectId } = useParams()
    const { user } = useContext(UserContext)

    const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false)
    const [isAddCollaboratorOpen, setIsAddCollaboratorOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [allUsers, setAllUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [members, setMembers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState([])
    const [openFiles, setOpenFiles] = useState([])
    const [activeFile, setActiveFile] = useState(null)
    const [webContainer, setWebContainer] = useState(null)
    const [isRunning, setIsRunning] = useState(false)
    const [runLogs, setRunLogs] = useState('')
    const [iframeUrl, setIframeUrl] = useState('')
    const [editableUrl, setEditableUrl] = useState('')
    const [iframeDoc, setIframeDoc] = useState('')
    const [hasRunPreview, setHasRunPreview] = useState(false)

    const activeFileRef = useRef(null)
    const updateTimeoutRef = useRef(null)
    const persistTimerRef = useRef(null)
    const loadedProjectRef = useRef(false)
    const runningProcessRef = useRef(null)

    const sanitizeFileName = useCallback((rawName = '') => {
        return String(rawName)
            .replace(/\*\*/g, '')
            .replace(/^["'`]+|["'`]+$/g, '')
            .trim()
    }, [])

    const applyFileTreeFromJson = useCallback((jsonData) => {
        if (!jsonData || typeof jsonData !== 'object' || !jsonData.fileTree || typeof jsonData.fileTree !== 'object') {
            return false
        }

        Object.entries(jsonData.fileTree).forEach(([rawFileName, fileData], index) => {
            const fileName = sanitizeFileName(rawFileName)
            if (!fileName) return
            const ext = fileName.split('.').pop()
            const contents = typeof fileData?.contents === 'string' ? fileData.contents : ''
            const newFile = {
                id: Date.now() + index,
                name: fileName,
                content: contents,
                language: ext
            }
            setFileTree(prev => {
                const existingIndex = prev.findIndex(f => f.name === fileName)
                if (existingIndex !== -1) {
                    const updated = [...prev]
                    updated[existingIndex] = { ...updated[existingIndex], content: contents, language: ext }
                    return updated
                }
                return [...prev, newFile]
            })
        })

        return true
    }, [sanitizeFileName])

    const extractFilesFromMessage = useCallback((data) => {
        const message = data.message
        if (!message || typeof message !== 'string') return

        try {
            const jsonMatch = message.match(/\{[\s\S]*"fileTree"[\s\S]*\}/)
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0])
                const applied = applyFileTreeFromJson(jsonData)
                if (applied) {
                    return
                }
            }
            // Handle escaped JSON payloads sometimes returned by AI.
            const escapedJsonMatch = message.match(/"\{[\s\S]*\\"fileTree\\"[\s\S]*\}"/)
            if (escapedJsonMatch) {
                const unescaped = JSON.parse(escapedJsonMatch[0])
                const jsonData = JSON.parse(unescaped)
                const applied = applyFileTreeFromJson(jsonData)
                if (applied) return
            }
        } catch {
            // Continue with markdown/fenced parsing fallbacks.
        }

        let filePattern = /\*\*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+):\*\*\s*```(\w+)?\n([\s\S]*?)```/g
        let matches = [...message.matchAll(filePattern)]
        if (matches.length === 0) {
            filePattern = /\*\*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)\*\*\s*```(\w+)?\n([\s\S]*?)```/g
            matches = [...message.matchAll(filePattern)]
        }
        if (matches.length === 0) {
            // Fallback: filename on plain line, followed by fenced code block.
            filePattern = /(?:^|\n)\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)\s*:?\s*\n```(\w+)?\n([\s\S]*?)```/g
            matches = [...message.matchAll(filePattern)]
        }

        if (matches.length > 0) {
            matches.forEach((match, index) => {
                const fileName = sanitizeFileName(match[1].trim())
                if (!fileName) return
                const language = match[2] || fileName.split('.').pop()
                const code = match[3]
                const newFile = {
                    id: Date.now() + index,
                    name: fileName,
                    content: code.trim(),
                    language: language
                }
                setFileTree(prev => {
                    const existingIndex = prev.findIndex(f => f.name === fileName)
                    if (existingIndex !== -1) {
                        const updated = [...prev]
                        updated[existingIndex] = { ...updated[existingIndex], content: code.trim(), language }
                        return updated
                    }
                    return [...prev, newFile]
                })
            })
        } else {
            const inferFileNameFromContext = (fullText, blockIndex, language, fallbackIndex) => {
                const context = fullText.slice(Math.max(0, blockIndex - 220), blockIndex)

                const patterns = [
                    /\*\*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)\*\*\s*:?$/m,
                    /(?:file|filename|path)\s*:\s*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)/im,
                    /([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)\s*:?\s*$/m
                ]

                for (const pattern of patterns) {
                    const m = context.match(pattern)
                    if (m && m[1]) {
                        const cleaned = sanitizeFileName(m[1])
                        if (cleaned) return cleaned
                    }
                }

                if (language === 'html') return 'index.html'
                if (language === 'css') return 'style.css'
                if (language === 'javascript' || language === 'js') return 'script.js'

                const extensionMap = {
                    javascript: 'js',
                    typescript: 'ts',
                    python: 'py',
                    java: 'java',
                    cpp: 'cpp',
                    c: 'c',
                    csharp: 'cs',
                    html: 'html',
                    css: 'css',
                    json: 'json',
                    markdown: 'md',
                    bash: 'sh',
                    shell: 'sh',
                    sql: 'sql',
                    env: 'env',
                    jsx: 'jsx',
                    tsx: 'tsx'
                }
                const ext = extensionMap[language] || language || 'txt'
                return `untitled-${Date.now()}-${fallbackIndex}.${ext}`
            }

            const simplePattern = /```(\w+)\n([\s\S]*?)```/g
            const simpleMatches = [...message.matchAll(simplePattern)]
            simpleMatches.forEach((match, index) => {
                const language = (match[1] || 'txt').toLowerCase()
                const code = match[2]
                if (['filetree', 'commands', 'bash', 'sh'].includes(language)) return

                if (language === 'json' && code.includes('"fileTree"')) {
                    try {
                        const parsed = JSON.parse(code)
                        const applied = applyFileTreeFromJson(parsed)
                        if (applied) return
                    } catch {
                        // Continue with fallback untitled file creation.
                    }
                }
                const blockStartIndex = typeof match.index === 'number' ? match.index : 0
                const fileName = inferFileNameFromContext(message, blockStartIndex, language, index)
                const newFile = {
                    id: Date.now() + index,
                    name: fileName,
                    content: code.trim(),
                    language: language
                }
                setFileTree(prev => {
                    const existingUntitled = prev.find(f => f.name.startsWith('untitled') && f.language === language)
                    if (existingUntitled) {
                        const updated = [...prev]
                        const idx = prev.indexOf(existingUntitled)
                        updated[idx] = { ...updated[idx], content: code.trim() }
                        return updated
                    }
                    if (prev.some(f => f.content === code.trim())) return prev
                    return [...prev, newFile]
                })
            })
        }
    }, [sanitizeFileName, applyFileTreeFromJson])

    const closePreview = useCallback(() => {
        if (runningProcessRef.current?.kill) {
            try {
                runningProcessRef.current.kill()
            } catch {
                // Ignore stop errors.
            }
            runningProcessRef.current = null
        }
        setHasRunPreview(false)
        setIframeDoc('')
        setIframeUrl('')
        setEditableUrl('')
        setIsRunning(false)
        setRunLogs((prev) => `${prev}\nPreview closed.\n`)
    }, [])

    useEffect(() => {
        activeFileRef.current = activeFile
    }, [activeFile])

    useEffect(() => {
        let mounted = true
        getWebContainer()
            .then((container) => {
                if (!mounted) return
                setWebContainer(container)
                container.on('server-ready', (_, url) => {
                    setIframeDoc('')
                    setIframeUrl(url)
                    setEditableUrl(url)
                })
            })
            .catch((err) => console.error('WebContainer boot failed:', err))
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        axios.get(`/projects/get-project/${projectId}`).then((res) => {
            const project = res.data.project
            if (!project) return
            setMembers(project.users || [])
            const savedFiles = Array.isArray(project.files) ? project.files : []
            const normalizedFiles = savedFiles.map((file, index) => ({
                id: `${sanitizeFileName(file.name)}-${index}-${Date.now()}`,
                name: sanitizeFileName(file.name),
                content: file.content || '',
                language: file.language || (sanitizeFileName(file.name).split('.').pop() || 'plaintext')
            })).filter(file => file.name)
            setFileTree(normalizedFiles)
            loadedProjectRef.current = true

            if (project._id) {
                initializeSocket(project._id)

                receiveMessage('project-message', (data) => {
                    setMessages(prev => {
                        if (data.isChunk) {
                            const idx = prev.findIndex(m => m._id === data._id)
                            if (idx === -1) return prev
                            const next = [...prev]
                            next[idx] = { ...next[idx], message: `${next[idx].message || ''}${data.message || ''}` }
                            const completeFencePairs = ((next[idx].message.match(/```/g) || []).length % 2) === 0
                            const hasCodeFence = next[idx].message.includes('```')
                            if (
                                next[idx].message.includes('"fileTree"') ||
                                (hasCodeFence && completeFencePairs)
                            ) {
                                extractFilesFromMessage(next[idx])
                            }
                            return next
                        }
                        if (data.message && (data.message.includes('```') || data.message.includes('"fileTree"'))) {
                            extractFilesFromMessage(data)
                        }
                        if (prev.some(m => m._id === data._id)) return prev
                        return [...prev, data]
                    })
                })

                receiveMessage('file-update', (data) => {
                    setFileTree(prev => prev.map(f => f.name === data.fileName ? { ...f, content: data.content } : f))
                    setOpenFiles(prev => prev.map(f => f.name === data.fileName ? { ...f, content: data.content } : f))
                    setActiveFile(prev => prev && prev.name === data.fileName ? { ...prev, content: data.content } : prev)
                })

                receiveMessage('file-created', (data) => {
                    setFileTree(prev => prev.some(f => f.name === data.file.name) ? prev : [...prev, data.file])
                })

                receiveMessage('file-deleted', (data) => {
                    setFileTree(prev => prev.filter(f => f.name !== data.fileName))
                    setOpenFiles(prev => prev.filter(f => f.name !== data.fileName))
                    setActiveFile(prev => prev && prev.name === data.fileName ? null : prev)
                })
            }
        }).catch((err) => {
            console.log('Error fetching project:', err.response?.data || err.message)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create project.'
            alert(errorMessage)
        })
    }, [projectId, sanitizeFileName, extractFilesFromMessage])

    useEffect(() => {
        if (!loadedProjectRef.current) return
        if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
        persistTimerRef.current = setTimeout(() => {
            const files = fileTree.map(({ name, content, language }) => ({ name, content, language }))
            axios.put(`/projects/files/${projectId}`, { files }).catch((err) => {
                console.error('Unable to persist files:', err.response?.data || err.message)
            })
        }, 500)
        return () => {
            if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
        }
    }, [fileTree, projectId])

    const openFile = (file) => {
        if (!openFiles.find(f => f.id === file.id)) {
            setOpenFiles(prev => [...prev, file])
        }
        setActiveFile(file)
    }

    const closeFile = (fileId) => {
        setOpenFiles(prev => prev.filter(f => f.id !== fileId))
        if (activeFile?.id === fileId) {
            setActiveFile(openFiles[0] || null)
        }
    }

    const updateFileContent = (content) => {
        const currentActiveFile = activeFileRef.current
        if (!currentActiveFile) return
        if (currentActiveFile.content === content) return // Prevent infinite loop when receiving socket updates
        
        const currentFileName = currentActiveFile.name
        const currentFileId = currentActiveFile.id
        
        // Update in fileTree
        setFileTree(prev => prev.map(f => 
            f.name === currentFileName ? { ...f, content } : f
        ))
        
        // Update in openFiles
        setOpenFiles(prev => prev.map(f => 
            f.name === currentFileName ? { ...f, content } : f
        ))
        
        // Update activeFile
        setActiveFile(prev => ({ ...prev, content }))
        
        // Debounce socket emit to avoid too many updates
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
        }
        
        updateTimeoutRef.current = setTimeout(() => {
            console.log('Sending file update:', currentFileName)
            // Emit changes to other users via socket
            sendMessage('file-update', {
                fileId: currentFileId,
                fileName: currentFileName,
                content: content,
                updatedBy: user.email
            })
        }, 300) // Reduced to 300ms for smoother updates
    }

    const createNewFile = () => {
        const fileName = prompt('Enter file name (e.g., index.js, style.css, .env):')
        if (!fileName || !fileName.trim()) return
        
        const sanitizedName = sanitizeFileName(fileName)
        if (!sanitizedName) return
        const ext = sanitizedName.split('.').pop() || 'txt'
        const newFile = {
            id: Date.now(),
            name: sanitizedName,
            content: '',
            language: ext
        }
        
        // Add to fileTree
        setFileTree(prev => [...prev, newFile])
        
        // Open the new file
        openFile(newFile)
        
        // Broadcast to other users
        sendMessage('file-created', {
            file: newFile,
            createdBy: user.email
        })
    }

    const deleteFile = (fileId, fileName) => {
        if (!confirm(`Delete ${fileName}?`)) return
        
        // Remove from fileTree
        setFileTree(prev => prev.filter(f => f.id !== fileId))
        
        // Remove from openFiles
        setOpenFiles(prev => prev.filter(f => f.id !== fileId))
        
        // Clear activeFile if it's the deleted one
        if (activeFile?.id === fileId) {
            setActiveFile(null)
        }
        
        // Broadcast to other users
        sendMessage('file-deleted', {
            fileId: fileId,
            fileName: fileName,
            deletedBy: user.email
        })
    }

    const getLanguageFromFileName = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase()
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'shell',
            'env': 'plaintext'
        }
        return languageMap[ext] || 'plaintext'
    }

    const toggleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId))
        } else {
            setSelectedUsers([...selectedUsers, userId])
        }
    }

    useEffect(() => {
        if (isAddCollaboratorOpen) {
            axios.get('/users/all').then((res) => {
                console.log('All users:', res.data)
                const allUsersData = res.data.users || []
                const memberIds = members.map(m => m._id || m)
                const availableUsers = allUsersData.filter(user => !memberIds.includes(user._id))
                setAllUsers(availableUsers)
            }).catch((err) => {
                console.log('Error fetching users:', err.response?.data || err.message)
                const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch users.'
                alert(errorMessage)
            })
        }
    }, [isAddCollaboratorOpen, members])

    const handleAddCollaborators = () => {
        if (selectedUsers.length === 0) return

        axios.put('/projects/add-user', {
            projectId,
            users: selectedUsers
        }).then((res) => {
            console.log('Collaborators added:', res.data)
            setMembers(res.data.project.users || [])
            setIsAddCollaboratorOpen(false)
            setSelectedUsers([])
        }).catch((err) => {
            console.log('Error adding collaborators:', err.response?.data || err.message)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to add collaborators.'
            alert(errorMessage)
        })
    }

    function send() {
        if (!message.trim()) return;
        console.log('Message:', message)
        const newMsg = {
            _id: Date.now().toString(),
            sender: user.email,
            message: message
        }
        sendMessage('project-message', newMsg)
        setMessages(prev => [...prev, newMsg])
        setMessage("")
    }

    const toWebContainerTree = () => {
        const tree = {}
        fileTree.forEach((file) => {
            const safeName = sanitizeFileName(file.name)
            if (!safeName) return
            tree[safeName] = { file: { contents: file.content || '' } }
        })
        return tree
    }

    const runInWebContainer = async () => {
        if (!webContainer || fileTree.length === 0) return
        try {
            setIsRunning(true)
            setHasRunPreview(true)
            setRunLogs('Starting...\n')
            setIframeDoc('')
            setIframeUrl('')
            setEditableUrl('')

            if (runningProcessRef.current?.kill) {
                try {
                    runningProcessRef.current.kill()
                } catch {
                    // Ignore process kill failures before starting a fresh run.
                }
                runningProcessRef.current = null
            }

            const normalizedTree = toWebContainerTree()
            let packageFile = fileTree.find((f) => f.name === 'package.json')
            const hasPackageJson = Boolean(packageFile)
            const htmlFile = fileTree.find((f) => f.name.endsWith('.html'))

            let runTarget = hasPackageJson ? 'node' : 'html'
            if (hasPackageJson && htmlFile) {
                const choice = (prompt('Both package.json and HTML found.\nType "node" to run package scripts or "html" to preview HTML file.', 'node') || 'node')
                    .trim()
                    .toLowerCase()
                runTarget = choice === 'html' ? 'html' : 'node'
            }

            if (!hasPackageJson) {
                const hasNodeSource = fileTree.some((file) => {
                    const name = file.name.toLowerCase()
                    const isJsLike = name.endsWith('.js') || name.endsWith('.mjs') || name.endsWith('.cjs')
                    return isJsLike && !name.endsWith('.test.js')
                })
                const hasHtml = fileTree.some((f) => f.name.endsWith('.html'))

                if (hasNodeSource && !hasHtml) {
                    const autoPackageJson = {
                        name: "webcontainer-app",
                        version: "1.0.0",
                        private: true,
                        main: fileTree.some(f => f.name === 'server.js') ? "server.js" : (fileTree.some(f => f.name === 'app.js') ? "app.js" : "index.js"),
                        scripts: {
                            start: fileTree.some(f => f.name === 'server.js') ? "node server.js" : (fileTree.some(f => f.name === 'app.js') ? "node app.js" : "node index.js")
                        }
                    }
                    const packageContent = JSON.stringify(autoPackageJson, null, 2)
                    normalizedTree['package.json'] = { file: { contents: packageContent } }
                    packageFile = { name: 'package.json', content: packageContent, language: 'json' }

                    setFileTree(prev => prev.some(f => f.name === 'package.json')
                        ? prev
                        : [...prev, { id: Date.now(), name: 'package.json', content: packageContent, language: 'json' }]
                    )
                    setRunLogs((prev) => `${prev}Auto-created package.json for Node project.\n`)
                }
            }

            await webContainer.mount(normalizedTree)

            const hasRunnablePackage = Boolean(packageFile)

            if (runTarget === 'html' || !hasRunnablePackage) {
                const html = htmlFile || fileTree.find((f) => f.name.endsWith('.html'))
                if (html) {
                    const css = fileTree.find((f) => f.name === 'style.css')?.content || ''
                    const js = fileTree.find((f) => f.name === 'script.js')?.content || ''
                    const mergedHtml = `
${html.content || ''}
${css ? `\n<style>\n${css}\n</style>\n` : ''}
${js ? `\n<script>\n${js}\n</script>\n` : ''}
`
                    setIframeUrl('')
                    setEditableUrl('')
                    setIframeDoc(mergedHtml || '<h1>No HTML content</h1>')
                    setRunLogs('Rendered HTML/CSS/JS in iframe preview.\n')
                } else {
                    setRunLogs('No package.json or HTML file found to run.\n')
                }
                return
            }

            const install = await webContainer.spawn('npm', ['install'])
            install.output.pipeTo(new WritableStream({
                write(data) {
                    setRunLogs((prev) => prev + data)
                }
            }))
            const installExit = await install.exit
            if (installExit !== 0) {
                setRunLogs((prev) => prev + '\nnpm install failed.\n')
                return
            }

            let startCommand = ['run', 'start']
            try {
                const pkg = JSON.parse(packageFile.content || '{}')
                if (pkg?.scripts?.start) startCommand = ['run', 'start']
                else if (pkg?.scripts?.dev) startCommand = ['run', 'dev']
            } catch {
                startCommand = ['run', 'start']
            }

            const startProcess = await webContainer.spawn('npm', startCommand)
            runningProcessRef.current = startProcess
            startProcess.output.pipeTo(new WritableStream({
                write(data) {
                    setRunLogs((prev) => prev + data)
                }
            }))
        } catch (err) {
            setRunLogs((prev) => `${prev}\nRun error: ${err.message}\n`)
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
            {/* Left Side - Chat Panel */}
            <div className="w-96 border-r flex flex-col" style={{ backgroundColor: '#1a1a1a', borderColor: '#404040' }}>
                {/* Chat Header */}
                <div className="px-6 py-4 flex justify-between items-center gap-2" style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #404040' }}>
                    <div className="flex items-center gap-2">
                        <img src="/freya2.png" alt="Freya Logo" className="h-7 w-7 md:h-13 md:w-13 object-contain" />
                        <h2 className="text-lg font-semibold" style={{ color: '#f5f5f5' }}>Project Chat</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAddCollaboratorOpen(true)}
                            className="px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-1"
                            style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add</span>
                        </button>
                        <button
                            onClick={() => setIsMembersPanelOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm"
                            style={{ backgroundColor: '#404040', color: '#f5f5f5' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#505050'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#404040'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{members.length}</span>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#1a1a1a' }}>
                    {messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex ${msg.sender === user?.email ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm overflow-hidden`} 
                                style={{ 
                                    backgroundColor: msg.sender === user?.email 
                                        ? '#1a4d2e' // Dark green for sent messages (Gmail-style)
                                        : msg.sender === 'Freya-AI' 
                                            ? '#2a2a2a' // Dark gray for AI messages
                                            : '#404040', // Medium gray for other users
                                    color: '#f5f5f5', // Clear white text for all messages
                                    border: `1px solid ${msg.sender === user?.email ? '#2d5f3f' : '#505050'}`
                                }}
                            >
                                <p className="text-xs font-medium mb-1" style={{ color: '#d4d4d4' }}>{msg.sender}</p>
                                <div className="text-sm markdown-content" style={{ color: '#f5f5f5' }}>
                                    {msg.message ? (
                                        <Markdown
                                            options={{
                                                disableParsingRawHTML: true
                                            }}
                                        >
                                            {(() => {
                                                if (msg.sender !== 'Freya-AI') return msg.message;
                                                
                                                let displayMessage = msg.message;
                                                
                                                // Handle JSON format
                                                try {
                                                    const jsonMatch = displayMessage.match(/\{[\s\S]*"fileTree"[\s\S]*\}/);
                                                    if (jsonMatch) {
                                                        const jsonData = JSON.parse(jsonMatch[0]);
                                                        return jsonData.text || "I've generated the files for you. Check the explorer!";
                                                    }
                                                } catch {
                                                    displayMessage = msg.message;
                                                }
                                                
                                                // Handle Markdown format - remove file blocks and ALL code blocks
                                                const filePattern = /\*\*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+):\*\*\s*```(\w+)?\n([\s\S]*?)```/g;
                                                displayMessage = displayMessage.replace(filePattern, (_match, fileName) => {
                                                    return `*File: ${fileName} (view in explorer)*`;
                                                });
                                                
                                                // Also hide any remaining naked code blocks
                                                displayMessage = displayMessage.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang) => {
                                                    if (lang === 'filetree' || lang === 'commands') return '';
                                                    return `*Code block (${lang || 'text'}) - view in explorer*`;
                                                });
                                                
                                                return displayMessage.trim() || "I've generated the files for you. Check the explorer!";
                                            })()}
                                        </Markdown>
                                    ) : (
                                        <span className="animate-pulse">Thinking...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="border-t p-4" style={{ backgroundColor: '#0a0a0a', borderColor: '#404040' }}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && send()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
                            style={{ borderColor: '#404040', backgroundColor: '#2a2a2a', color: '#f5f5f5', outlineColor: '#d4af37' }}
                        />
                        <button
                            onClick={send}
                            className="px-4 py-2 rounded-lg transition-colors shadow-sm flex-shrink-0"
                            style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side - VS Code Interface */}
            <div className="flex-1 flex">
                {/* File Explorer */}
                <div className="w-64 border-r flex flex-col" style={{ backgroundColor: '#0a0a0a', borderColor: '#404040' }}>
                    <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: '#404040' }}>
                        <h3 className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>EXPLORER</h3>
                        <button
                            onClick={createNewFile}
                            className="transition-colors"
                            style={{ color: '#d4af37' }}
                            onMouseEnter={(e) => e.target.style.color = '#f4cf47'}
                            onMouseLeave={(e) => e.target.style.color = '#d4af37'}
                            title="New File"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {fileTree.length === 0 ? (
                            <p className="text-xs p-4" style={{ color: '#d4d4d4' }}>No files yet</p>
                        ) : (
                            <div className="py-2">
                                {fileTree.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`group px-4 py-2 text-sm cursor-pointer flex items-center justify-between`}
                                        style={{ 
                                            backgroundColor: activeFile?.id === file.id ? '#404040' : 'transparent',
                                            color: activeFile?.id === file.id ? '#d4af37' : '#f5f5f5'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (activeFile?.id !== file.id) {
                                                e.currentTarget.style.backgroundColor = '#2a2a2a'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeFile?.id !== file.id) {
                                                e.currentTarget.style.backgroundColor = 'transparent'
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2" onClick={() => openFile(file)}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>{file.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteFile(file.id, file.name)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: '#d4af37' }}
                                            title="Delete file"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Play Chess Button at Bottom */}
                    <div className="px-4 py-3 border-t" style={{ borderColor: '#404040' }}>
                        <button
                            onClick={() => window.open('https://chess-arena-game.onrender.com/', '_blank')}
                            className="w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 22H5v-2h14v2M17.16 8.26A2.5 2.5 0 0 0 15 3a2.5 2.5 0 0 0-2.16 5.26L9.5 11.5l-3-1.5v-2c.86-.5 1.5-1.43 1.5-2.5A2.5 2.5 0 0 0 5.5 3 2.5 2.5 0 0 0 3 5.5c0 1.07.64 2 1.5 2.5v2l3 1.5L7 13l-3.5 1.5v2c-.86.5-1.5 1.43-1.5 2.5A2.5 2.5 0 0 0 4.5 22 2.5 2.5 0 0 0 7 19.5c0-1.07-.64-2-1.5-2.5v-2L9 13.5l.5 1.5-1.5 3h8l-1.5-3 .5-1.5 3.5 1.5v2c-.86.5-1.5 1.43-1.5 2.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5c0-1.07-.64-2-1.5-2.5v-2L17 13l-.5-1.5 3-1.5v-2c.86-.5 1.5-1.43 1.5-2.5A2.5 2.5 0 0 0 18.5 3a2.5 2.5 0 0 0-2.16 5.26z"/>
                            </svg>
                            <span>Play Chess</span>
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
                    <div className="px-4 py-2 border-b flex items-center justify-between gap-3" style={{ backgroundColor: '#0a0a0a', borderColor: '#404040' }}>
                        <h3 className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>EDITOR</h3>
                        <button
                            onClick={runInWebContainer}
                            disabled={isRunning || fileTree.length === 0}
                            className="px-3 py-1.5 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: isRunning || fileTree.length === 0 ? '#404040' : '#d4af37', color: isRunning || fileTree.length === 0 ? '#d4d4d4' : '#0a0a0a' }}
                            onMouseEnter={(e) => {
                                if (!e.target.disabled) {
                                    e.target.style.backgroundColor = '#f4cf47'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!e.target.disabled) {
                                    e.target.style.backgroundColor = '#d4af37'
                                }
                            }}
                        >
                            {isRunning ? 'Running...' : 'Run'}
                        </button>
                    </div>
                    {/* Tabs */}
                    {openFiles.length > 0 && (
                        <div className="flex border-b overflow-x-auto" style={{ backgroundColor: '#0a0a0a', borderColor: '#404040' }}>
                            {openFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-2 px-4 py-2 border-r cursor-pointer`}
                                    style={{ 
                                        backgroundColor: activeFile?.id === file.id ? '#1a1a1a' : '#0a0a0a',
                                        color: activeFile?.id === file.id ? '#d4af37' : '#f5f5f5',
                                        borderColor: '#404040'
                                    }}
                                    onClick={() => setActiveFile(file)}
                                    onMouseEnter={(e) => {
                                        if (activeFile?.id !== file.id) {
                                            e.currentTarget.style.backgroundColor = '#2a2a2a'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeFile?.id !== file.id) {
                                            e.currentTarget.style.backgroundColor = '#0a0a0a'
                                        }
                                    }}
                                >
                                    <span className="text-sm">{file.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            closeFile(file.id)
                                        }}
                                        style={{ color: '#d4d4d4' }}
                                        onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.color = '#d4d4d4'}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden grid grid-cols-2">
                        <div className="overflow-auto border-r" style={{ borderColor: '#404040' }}>
                            {activeFile ? (
                                <Editor
                                    height="100%"
                                    language={getLanguageFromFileName(activeFile.name)}
                                    value={activeFile.content}
                                    theme="vs-dark"
                                    onChange={(value) => updateFileContent(value || '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        fontFamily: 'Consolas, "Courier New", monospace',
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        wordWrap: 'on',
                                        tabSize: 2,
                                        renderWhitespace: 'selection',
                                        bracketPairColorization: { enabled: true },
                                        padding: { top: 16, bottom: 16 }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full" style={{ color: '#d4d4d4' }}>
                                    <p>No file selected</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
                            {hasRunPreview ? (
                                <>
                                    <div className="p-2 border-b flex gap-2" style={{ borderColor: '#404040' }}>
                                        <input
                                            type="text"
                                            value={editableUrl}
                                            onChange={(e) => setEditableUrl(e.target.value)}
                                            placeholder="Preview URL"
                                            className="flex-1 px-2 py-1 rounded text-xs border"
                                            style={{ backgroundColor: '#1a1a1a', color: '#f5f5f5', borderColor: '#404040' }}
                                        />
                                        <button
                                            onClick={() => {
                                                setIframeDoc('')
                                                setIframeUrl(editableUrl)
                                            }}
                                            className="px-2 py-1 text-xs rounded"
                                            style={{ backgroundColor: '#404040', color: '#f5f5f5' }}
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={closePreview}
                                            className="px-2 py-1 text-xs rounded"
                                            style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="flex-1 bg-white">
                                        {iframeDoc ? (
                                            <iframe title="preview" className="w-full h-full" srcDoc={iframeDoc} />
                                        ) : (
                                            <iframe title="preview" className="w-full h-full" src={iframeUrl || 'about:blank'} />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1" style={{ backgroundColor: '#0a0a0a' }} />
                            )}
                            <pre className="h-28 overflow-auto p-2 text-xs border-t" style={{ color: '#f5f5f5', backgroundColor: '#1a1a1a', borderColor: '#404040' }}>{runLogs}</pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Collaborators Modal */}
            {isAddCollaboratorOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                    onClick={() => setIsAddCollaboratorOpen(false)}
                >
                    <div
                        className="rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
                        style={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 flex justify-between items-center rounded-t-lg" style={{ backgroundColor: '#0a0a0a' }}>
                            <h3 className="text-lg font-semibold" style={{ color: '#f5f5f5' }}>Add Collaborators</h3>
                            <button
                                onClick={() => setIsAddCollaboratorOpen(false)}
                                className="text-2xl leading-none"
                                style={{ color: '#d4d4d4' }}
                                onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.color = '#d4d4d4'}
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-2">
                                {allUsers.length === 0 ? (
                                    <p className="text-center py-8" style={{ color: '#d4d4d4' }}>Loading users...</p>
                                ) : (
                                    allUsers.map((user) => (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleUserSelection(user._id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-2`}
                                            style={{ 
                                                backgroundColor: '#1a1a1a',
                                                borderColor: selectedUsers.includes(user._id) ? '#d4af37' : '#404040'
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}>
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate" style={{ color: '#f5f5f5' }}>{user.email}</p>
                                            </div>
                                            {selectedUsers.includes(user._id) && (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#d4af37' }}>
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t flex gap-3" style={{ borderColor: '#404040' }}>
                            <button
                                onClick={() => setIsAddCollaboratorOpen(false)}
                                className="flex-1 px-4 py-2 border rounded-lg transition-colors"
                                style={{ borderColor: '#404040', color: '#f5f5f5', backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#404040'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCollaborators}
                                disabled={selectedUsers.length === 0}
                                className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: selectedUsers.length === 0 ? '#404040' : '#d4af37', color: selectedUsers.length === 0 ? '#d4d4d4' : '#0a0a0a' }}
                                onMouseEnter={(e) => {
                                    if (!e.target.disabled) {
                                        e.target.style.backgroundColor = '#f4cf47'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!e.target.disabled) {
                                        e.target.style.backgroundColor = '#d4af37'
                                    }
                                }}
                            >
                                Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Side Panel */}
            <div className={`fixed right-0 top-0 h-full w-80 shadow-2xl border-l transform transition-transform duration-300 ease-in-out z-50 ${isMembersPanelOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ backgroundColor: '#2a2a2a', borderColor: '#404040' }}>
                <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: '#0a0a0a' }}>
                    <h2 className="text-lg font-semibold" style={{ color: '#f5f5f5' }}>Members</h2>
                    <button
                        onClick={() => setIsMembersPanelOpen(false)}
                        className="text-3xl leading-none transition-colors"
                        style={{ color: '#d4d4d4' }}
                        onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.color = '#d4d4d4'}
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto p-4 h-full pb-20">
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <p className="text-center py-8" style={{ color: '#d4d4d4' }}>No members yet</p>
                        ) : (
                            members.map((member, index) => (
                                <div
                                    key={member._id || index}
                                    className="rounded-lg px-4 py-3 transition-colors"
                                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #404040' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0" style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}>
                                            {member.email ? member.email.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: '#f5f5f5' }}>{member.email || 'Unknown User'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {isMembersPanelOpen && (
                <div
                    className="fixed inset-0 z-40 transition-opacity duration-300"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                    onClick={() => setIsMembersPanelOpen(false)}
                ></div>
            )}
        </div>
    )
}

export default Project