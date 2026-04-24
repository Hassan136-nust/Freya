import { useState, useEffect, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import { UserContext } from '../context/UserContext'
import Markdown from "markdown-to-jsx"
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import Editor from '@monaco-editor/react'

const Project = () => {
    const { projectId } = useParams()
    const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false)
    const [isAddCollaboratorOpen, setIsAddCollaboratorOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [allUsers, setAllUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [members, setMembers] = useState([])
    const [project, setProject] = useState(null)
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState([])
    const [openFiles, setOpenFiles] = useState([])
    const [activeFile, setActiveFile] = useState(null)
    const { user } = useContext(UserContext)
    const updateTimeoutRef = useRef(null)
    const activeFileRef = useRef(null)

    // Keep activeFileRef in sync with activeFile
    useEffect(() => {
        activeFileRef.current = activeFile
    }, [activeFile])
    const editorRef = useRef(null)

    // Fetch project details
    useEffect(() => {
        axios.get(`/projects/get-project/${projectId}`).then((res) => {
            console.log('Project details:', res.data)
            setProject(res.data.project)
            if (res.data.project && res.data.project.users) {
                console.log('Members:', res.data.project.users)
                setMembers(res.data.project.users)
            }

            // Initialize socket
            if (res.data.project && res.data.project._id) {
                const socketInstance = initializeSocket(res.data.project._id)
                console.log('Socket initialized for project:', res.data.project._id)
                
                // Listen for chat messages
                receiveMessage('project-message', (data) => {
                    console.log('Message received:', data)
                    
                    setMessages(prev => {
                        if (data.isChunk) {
                            const messageIndex = prev.findIndex(m => m._id === data._id);
                            if (messageIndex !== -1) {
                                const newMessages = [...prev];
                                newMessages[messageIndex] = {
                                    ...newMessages[messageIndex],
                                    message: newMessages[messageIndex].message + data.message
                                };
                                
                                // Check if complete message has code blocks
                                if (newMessages[messageIndex].message.includes('```')) {
                                    extractFilesFromMessage(newMessages[messageIndex])
                                }
                                
                                return newMessages;
                            }
                            return prev;
                        }
                        
                        // Check if new message contains code
                        if (data.message && data.message.includes('```')) {
                            extractFilesFromMessage(data)
                        }
                        
                        if (prev.some(m => m._id === data._id)) return prev;
                        return [...prev, data]
                    })
                })
                
                // Listen for file updates from other users
                console.log('Setting up file-update listener')
                receiveMessage('file-update', (data) => {
                    console.log('🔥 File update received from:', data.updatedBy, 'file:', data.fileName, 'fileId:', data.fileId)
                    console.log('Content length:', data.content?.length)
                    
                    // Update fileTree - match by fileName
                    setFileTree(prev => {
                        console.log('Current fileTree:', prev.map(f => ({ id: f.id, name: f.name })))
                        const updated = prev.map(f => {
                            if (f.name === data.fileName) {
                                console.log('✅ Updating file:', f.name)
                                return { ...f, content: data.content }
                            }
                            return f
                        })
                        return updated
                    })
                    
                    // Update openFiles
                    setOpenFiles(prev => prev.map(f => {
                        if (f.name === data.fileName) {
                            return { ...f, content: data.content }
                        }
                        return f
                    }))
                    
                    // Update activeFile if it's the one being edited
                    setActiveFile(prev => {
                        if (prev && prev.name === data.fileName) {
                            console.log('✅ Updating active file')
                            return { ...prev, content: data.content }
                        }
                        return prev
                    })
                })
                
                // Listen for new files created by other users
                receiveMessage('file-created', (data) => {
                    console.log('📁 New file created by:', data.createdBy, 'file:', data.file.name)
                    setFileTree(prev => {
                        // Check if file already exists
                        if (prev.some(f => f.name === data.file.name)) return prev
                        return [...prev, data.file]
                    })
                })
                
                // Listen for file deletions
                receiveMessage('file-deleted', (data) => {
                    console.log('🗑️ File deleted by:', data.deletedBy, 'file:', data.fileName)
                    setFileTree(prev => prev.filter(f => f.name !== data.fileName))
                    setOpenFiles(prev => prev.filter(f => f.name !== data.fileName))
                    setActiveFile(prev => {
                        if (prev && prev.name === data.fileName) {
                            return null
                        }
                        return prev
                    })
                })
            }
        }).catch((err) => {
            console.log('Error fetching project:', err.response?.data || err.message)
        })
    }, [projectId])

    // Extract files from AI message
    const extractFilesFromMessage = (data) => {
        const message = data.message
        
        console.log('Extracting files from message')
        
        // Try to parse JSON format first
        try {
            const jsonMatch = message.match(/\{[\s\S]*"fileTree"[\s\S]*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.fileTree) {
                    console.log('Found fileTree in JSON format');
                    Object.entries(jsonData.fileTree).forEach(([fileName, fileData], index) => {
                        const ext = fileName.split('.').pop();
                        const newFile = {
                            id: Date.now() + index,
                            name: fileName,
                            content: fileData.contents,
                            language: ext
                        };
                        
                        setFileTree(prev => {
                            const existingIndex = prev.findIndex(f => f.name === fileName);
                            if (existingIndex !== -1) {
                                const updated = [...prev];
                                updated[existingIndex] = { ...updated[existingIndex], content: fileData.contents };
                                return updated;
                            }
                            return [...prev, newFile];
                        });
                    });
                    return;
                }
            }
        } catch (e) {
            console.log('No JSON format found, trying markdown');
        }
        
        // Try markdown format: **filename.ext:** followed by code block
        let filePattern = /\*\*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+):\*\*\s*```(\w+)?\n([\s\S]*?)```/g;
        let matches = [...message.matchAll(filePattern)];
        
        // Alternative pattern: **filename.ext** followed by code block
        if (matches.length === 0) {
            filePattern = /\*\*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\*\*\s*```(\w+)?\n([\s\S]*?)```/g;
            matches = [...message.matchAll(filePattern)];
        }
        
        console.log('Found', matches.length, 'files with names in markdown');
        
        if (matches.length > 0) {
            matches.forEach((match, index) => {
                const fileName = match[1].trim();
                const language = match[2] || fileName.split('.').pop();
                const code = match[3];
                
                console.log('Extracted file:', fileName);
                
                const newFile = {
                    id: Date.now() + index,
                    name: fileName,
                    content: code.trim(),
                    language: language
                };
                
                setFileTree(prev => {
                    const existingIndex = prev.findIndex(f => f.name === fileName);
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], content: code.trim() };
                        return updated;
                    }
                    return [...prev, newFile];
                });
            });
        } else {
            // Fallback: simple code blocks
            const simplePattern = /```(\w+)\n([\s\S]*?)```/g;
            const simpleMatches = [...message.matchAll(simplePattern)];
            
            console.log('Found', simpleMatches.length, 'code blocks without names');
            
            simpleMatches.forEach((match, index) => {
                const language = (match[1] || 'txt').toLowerCase();
                const code = match[2];
                
                if (['filetree', 'commands', 'bash', 'sh'].includes(language)) return;
                
                const extensionMap = {
                    'javascript': 'js', 'typescript': 'ts', 'python': 'py',
                    'java': 'java', 'cpp': 'cpp', 'c': 'c', 'csharp': 'cs',
                    'html': 'html', 'css': 'css', 'json': 'json',
                    'markdown': 'md', 'bash': 'sh', 'shell': 'sh',
                    'sql': 'sql', 'env': 'env', 'jsx': 'jsx', 'tsx': 'tsx'
                };
                
                const ext = extensionMap[language.toLowerCase()] || language;
                const fileName = `untitled${fileTree.length + index + 1}.${ext}`;
                
                const newFile = {
                    id: Date.now() + index,
                    name: fileName,
                    content: code.trim(),
                    language: language
                };
                
                setFileTree(prev => {
                    const existingUntitled = prev.find(f => f.name.startsWith('untitled') && f.language === language);
                    if (existingUntitled) {
                        const updated = [...prev];
                        const idx = prev.indexOf(existingUntitled);
                        updated[idx] = { ...updated[idx], content: code.trim() };
                        return updated;
                    }
                    if (prev.some(f => f.content === code.trim())) return prev;
                    return [...prev, newFile];
                });
            });
        }
    }

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
        
        const ext = fileName.split('.').pop() || 'txt'
        const newFile = {
            id: Date.now(),
            name: fileName.trim(),
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

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor
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

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Left Side - Chat Panel */}
            <div className="w-96 bg-slate-100 border-r border-slate-300 flex flex-col">
                {/* Chat Header */}
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center gap-2">
                    <h2 className="text-slate-50 text-lg font-semibold">Project Chat</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAddCollaboratorOpen(true)}
                            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-slate-50 text-sm flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add</span>
                        </button>
                        <button
                            onClick={() => setIsMembersPanelOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{members.length}</span>
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex ${msg.sender === user?.email ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] ${msg.sender === user?.email ? 'bg-teal-600 text-slate-50' : msg.sender === 'Freya-AI' ? 'bg-black text-slate-50' : 'bg-slate-200 text-slate-800'} rounded-lg px-4 py-3 shadow-sm overflow-hidden`}>
                                <p className="text-xs font-medium mb-1 opacity-75">{msg.sender}</p>
                                <div className="text-sm markdown-content">
                                    {msg.message ? (
                                        <Markdown>
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
                                                } catch (e) {}
                                                
                                                // Handle Markdown format - remove file blocks and ALL code blocks
                                                const filePattern = /\*\*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+):\*\*\s*```(\w+)?\n([\s\S]*?)```/g;
                                                displayMessage = displayMessage.replace(filePattern, (match, fileName) => {
                                                    return `*File: ${fileName} (view in explorer)*`;
                                                });
                                                
                                                // Also hide any remaining naked code blocks
                                                displayMessage = displayMessage.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang) => {
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
                <div className="bg-slate-200 border-t border-slate-300 p-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && send()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 text-slate-900 text-sm"
                        />
                        <button
                            onClick={send}
                            className="px-4 py-2 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex-shrink-0"
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
                <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                    <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-slate-200 text-sm font-semibold">EXPLORER</h3>
                        <button
                            onClick={createNewFile}
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                            title="New File"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {fileTree.length === 0 ? (
                            <p className="text-slate-400 text-xs p-4">No files yet</p>
                        ) : (
                            <div className="py-2">
                                {fileTree.map((file) => (
                                    <div
                                        key={file.id}
                                        className={`group px-4 py-2 text-sm cursor-pointer hover:bg-slate-700 flex items-center justify-between ${activeFile?.id === file.id ? 'bg-slate-700 text-teal-400' : 'text-slate-300'
                                            }`}
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
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
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
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-slate-900">
                    {/* Tabs */}
                    {openFiles.length > 0 && (
                        <div className="flex bg-slate-800 border-b border-slate-700 overflow-x-auto">
                            {openFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-2 px-4 py-2 border-r border-slate-700 cursor-pointer ${activeFile?.id === file.id ? 'bg-slate-900 text-teal-400' : 'text-slate-300 hover:bg-slate-700'
                                        }`}
                                    onClick={() => setActiveFile(file)}
                                >
                                    <span className="text-sm">{file.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            closeFile(file.id)
                                        }}
                                        className="text-slate-400 hover:text-slate-200"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-auto">
                        {activeFile ? (
                            <Editor
                                height="100%"
                                language={getLanguageFromFileName(activeFile.name)}
                                value={activeFile.content}
                                theme="vs-dark"
                                onMount={handleEditorDidMount}
                                onChange={(value) => updateFileContent(value)}
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
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <p>No file selected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Collaborators Modal */}
            {isAddCollaboratorOpen && (
                <div
                    className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsAddCollaboratorOpen(false)}
                >
                    <div
                        className="bg-slate-100 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-slate-50 text-lg font-semibold">Add Collaborators</h3>
                            <button
                                onClick={() => setIsAddCollaboratorOpen(false)}
                                className="text-slate-300 hover:text-slate-50 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-2">
                                {allUsers.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">Loading users...</p>
                                ) : (
                                    allUsers.map((user) => (
                                        <div
                                            key={user._id}
                                            onClick={() => toggleUserSelection(user._id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUsers.includes(user._id)
                                                ? 'bg-teal-100 border-2 border-teal-600'
                                                : 'bg-slate-200 hover:bg-slate-300 border-2 border-transparent'
                                                }`}
                                        >
                                            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-slate-50 font-semibold flex-shrink-0">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                                            </div>
                                            {selectedUsers.includes(user._id) && (
                                                <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-300 flex gap-3">
                            <button
                                onClick={() => setIsAddCollaboratorOpen(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCollaborators}
                                disabled={selectedUsers.length === 0}
                                className="flex-1 px-4 py-2 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Members Side Panel */}
            <div className={`fixed right-0 top-0 h-full w-80 bg-slate-100 shadow-2xl border-l border-slate-300 transform transition-transform duration-300 ease-in-out z-50 ${isMembersPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-slate-50 text-lg font-semibold">Members</h2>
                    <button
                        onClick={() => setIsMembersPanelOpen(false)}
                        className="text-slate-300 hover:text-slate-50 text-3xl leading-none transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto p-4 h-full pb-20">
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No members yet</p>
                        ) : (
                            members.map((member, index) => (
                                <div
                                    key={member._id || index}
                                    className="bg-slate-200 rounded-lg px-4 py-3 hover:bg-slate-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-slate-50 font-semibold flex-shrink-0">
                                            {member.email ? member.email.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{member.email || 'Unknown User'}</p>
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
                    className="fixed inset-0 bg-slate-900 bg-opacity-40 z-40 transition-opacity duration-300"
                    onClick={() => setIsMembersPanelOpen(false)}
                ></div>
            )}
        </div>
    )
}

export default Project