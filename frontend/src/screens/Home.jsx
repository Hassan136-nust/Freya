import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [projects, setProjects] = useState([])
    const { user } = useContext(UserContext)
    const navigate = useNavigate()

    // Collaborator Modal State
    const [isCollabModalOpen, setIsCollabModalOpen] = useState(false)
    const [selectedProjectForCollab, setSelectedProjectForCollab] = useState(null)
    const [allUsers, setAllUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState(new Set())

    useEffect(() => {
        fetchProjects()
    }, [])

    function fetchProjects() {
        axios.get('/projects/all').then((res) => {
            console.log('Projects:', res.data)
            setProjects(res.data.projects)
        }).catch((err) => {
            console.log('Error fetching projects:', err.response?.data || err.message)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch projects.'
            alert(errorMessage)
        })
    }

    function createProject(e) {
        e.preventDefault()
        console.log('Creating project with name:', projectName)
        
        axios.post('/projects/create', {
            name: projectName
        }).then((res) => {
            console.log('Project created successfully:', res.data)
            setProjects([...projects, res.data])
            setIsModalOpen(false)
            setProjectName('')
        }).catch((err) => {
            console.log('Error creating project:', err.response?.data || err.message)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Project name already taken. Please try again.'
            alert(errorMessage)
        })
    }

    function openCollabModal(e, project) {
        e.stopPropagation() // Prevent navigating to project view
        setSelectedProjectForCollab(project)
        setIsCollabModalOpen(true)
        axios.get('/users/all').then((res) => {
            setAllUsers(res.data.users)
        }).catch(err => {
            console.log(err)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch users.'
            alert(errorMessage)
        })
    }

    function handleUserSelect(id) {
        setSelectedUsers(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
    }

    function addCollaborators() {
        if (selectedUsers.size === 0 || !selectedProjectForCollab) return;
        
        axios.put('/projects/add-user', {
            projectId: selectedProjectForCollab._id,
            users: Array.from(selectedUsers)
        }).then((res) => {
            setIsCollabModalOpen(false)
            setSelectedUsers(new Set())
            setSelectedProjectForCollab(null)
            fetchProjects() // Refresh the projects list to update counts
        }).catch(err => {
            console.log(err)
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to add collaborators.'
            alert(errorMessage)
        })
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
            {/* Header */}
            <header className="py-4 px-4 md:py-6 md:px-8 shadow-md" style={{ backgroundColor: '#0a0a0a', color: '#f5f5f5' }}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3 md:gap-4">
                        <img src="/freya2.png" alt="Freya Logo" className="h-12 w-12 md:h-16 md:w-16 object-contain" />
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">FREYA</h1>
                            <p className="mt-1 text-xs md:text-sm hidden sm:block" style={{ color: '#d4d4d4' }}>AI Agent for Code Generation & Online Chat</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className="text-xs md:text-sm truncate max-w-[120px] md:max-w-none" style={{ color: '#d4d4d4' }}>{user?.email}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-semibold" style={{ color: '#f5f5f5' }}>Your Projects</h2>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto px-4 md:px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base"
                        style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                    >
                        + Add New Project
                    </button>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <div className="border-2 border-dashed rounded-lg p-8 flex items-center justify-center" style={{ backgroundColor: '#2a2a2a', borderColor: '#404040', color: '#d4d4d4' }}>
                            No projects yet. Create your first project!
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div 
                                key={project._id}
                                onClick={() => navigate(`/project/${project._id}`)}
                                className="rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border"
                                style={{ backgroundColor: '#2a2a2a', borderColor: '#404040' }}
                            >
                                <h3 className="text-lg font-semibold mb-2" style={{ color: '#f5f5f5' }}>{project.name}</h3>
                                <div className="flex justify-between items-center text-sm" style={{ color: '#d4d4d4' }}>
                                    <span>{project.users?.length || 0} collaborator{project.users?.length !== 1 ? 's' : ''}</span>
                                    <button 
                                        onClick={(e) => openCollabModal(e, project)}
                                        className="p-1.5 rounded-full transition-colors"
                                        style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                                        title="Add Collaborator"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <div className="rounded-lg shadow-xl max-w-md w-full p-8" style={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold" style={{ color: '#f5f5f5' }}>Create New Project</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-2xl"
                                style={{ color: '#d4d4d4' }}
                                onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.color = '#d4d4d4'}
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={createProject}>
                            <div className="mb-6">
                                <label htmlFor="projectName" className="block text-sm font-medium mb-2" style={{ color: '#f5f5f5' }}>
                                    Project Name
                                </label>
                                <input
                                    id="projectName"
                                    type="text"
                                    required
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2"
                                    style={{ borderColor: '#404040', backgroundColor: '#1a1a1a', color: '#f5f5f5', outlineColor: '#d4af37' }}
                                    placeholder="Enter project name"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border rounded-lg transition-colors font-medium"
                                    style={{ borderColor: '#404040', color: '#f5f5f5', backgroundColor: 'transparent' }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#404040'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
                                    style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f4cf47'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#d4af37'}
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Collaborator Modal */}
            {isCollabModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
                    <div className="rounded-lg shadow-xl max-w-md w-full p-8" style={{ backgroundColor: '#2a2a2a', border: '1px solid #404040' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold" style={{ color: '#f5f5f5' }}>Add to "{selectedProjectForCollab?.name}"</h3>
                            <button 
                                onClick={() => {
                                    setIsCollabModalOpen(false)
                                    setSelectedUsers(new Set())
                                }}
                                className="text-2xl"
                                style={{ color: '#d4d4d4' }}
                                onMouseEnter={(e) => e.target.style.color = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.color = '#d4d4d4'}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto mb-6 space-y-2">
                            {allUsers.length === 0 ? (
                                <p className="text-sm" style={{ color: '#d4d4d4' }}>No users found.</p>
                            ) : (
                                allUsers.map(user => {
                                    // Don't show users already in project
                                    const isAlreadyInProject = selectedProjectForCollab?.users?.some(pUserId => pUserId === user._id || pUserId._id === user._id)
                                    if (isAlreadyInProject) return null

                                    return (
                                        <label key={user._id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer" style={{ backgroundColor: '#1a1a1a', borderColor: '#404040' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUsers.has(user._id)}
                                                onChange={() => handleUserSelect(user._id)}
                                                className="w-4 h-4 rounded"
                                                style={{ accentColor: '#d4af37' }}
                                            />
                                            <span style={{ color: '#f5f5f5' }}>{user.email}</span>
                                        </label>
                                    )
                                })
                            )}
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCollabModalOpen(false)
                                    setSelectedUsers(new Set())
                                }}
                                className="flex-1 px-4 py-2.5 border rounded-lg transition-colors font-medium"
                                style={{ borderColor: '#404040', color: '#f5f5f5', backgroundColor: 'transparent' }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#404040'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCollaborators}
                                disabled={selectedUsers.size === 0}
                                className="flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#f4cf47')}
                                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#d4af37')}
                            >
                                Add Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Resume AI Button - Bottom Right */}
            <button
                onClick={() => window.open('https://gapify-ai-resume-and-job-analyzer-x.vercel.app/', '_blank')}
                className="fixed bottom-8 right-8 px-4 py-3 rounded-full shadow-lg transition-all flex items-center gap-2 font-medium z-50"
                style={{ backgroundColor: '#d4af37', color: '#0a0a0a' }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f4cf47'
                    e.target.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#d4af37'
                    e.target.style.transform = 'scale(1)'
                }}
                title="AI Resume Analyzer"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-8h8v2H8v-2zm0 4h8v2H8v-2zm0-8h5v2H8V8z"/>
                </svg>
                <span>Gapify AI</span>
            </button>
        </div>
    )
}

export default Home;