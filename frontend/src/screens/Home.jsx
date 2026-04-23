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
        })
    }

    function openCollabModal(e, project) {
        e.stopPropagation() // Prevent navigating to project view
        setSelectedProjectForCollab(project)
        setIsCollabModalOpen(true)
        axios.get('/users/all').then((res) => {
            setAllUsers(res.data.users)
        }).catch(err => console.log(err))
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
        }).catch(err => console.log(err))
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-800 text-slate-50 py-6 px-8 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">FAYE</h1>
                        <p className="text-slate-300 mt-1 text-sm">AI Agent for Code Generation & Online Chat</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-slate-300 text-sm">{user?.email}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold text-slate-800">Your Projects</h2>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2.5 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm"
                    >
                        + Add New Project
                    </button>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-8 flex items-center justify-center text-slate-400">
                            No projects yet. Create your first project!
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div 
                                key={project._id}
                                onClick={() => navigate(`/project/${project._id}`)}
                                className="bg-slate-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200"
                            >
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">{project.name}</h3>
                                <div className="flex justify-between items-center text-sm text-slate-600">
                                    <span>{project.users?.length || 0} collaborator{project.users?.length !== 1 ? 's' : ''}</span>
                                    <button 
                                        onClick={(e) => openCollabModal(e, project)}
                                        className="p-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-full transition-colors"
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
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-slate-50 rounded-lg shadow-xl max-w-md w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-slate-800">Create New Project</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={createProject}>
                            <div className="mb-6">
                                <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-2">
                                    Project Name
                                </label>
                                <input
                                    id="projectName"
                                    type="text"
                                    required
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 text-slate-900"
                                    placeholder="Enter project name"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm"
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
                <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-slate-50 rounded-lg shadow-xl max-w-md w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-slate-800">Add to "{selectedProjectForCollab?.name}"</h3>
                            <button 
                                onClick={() => {
                                    setIsCollabModalOpen(false)
                                    setSelectedUsers(new Set())
                                }}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto mb-6 space-y-2">
                            {allUsers.length === 0 ? (
                                <p className="text-slate-500 text-sm">No users found.</p>
                            ) : (
                                allUsers.map(user => {
                                    // Don't show users already in project
                                    const isAlreadyInProject = selectedProjectForCollab?.users?.some(pUserId => pUserId === user._id || pUserId._id === user._id)
                                    if (isAlreadyInProject) return null

                                    return (
                                        <label key={user._id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUsers.has(user._id)}
                                                onChange={() => handleUserSelect(user._id)}
                                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                            />
                                            <span className="text-slate-700">{user.email}</span>
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
                                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCollaborators}
                                disabled={selectedUsers.size === 0}
                                className="flex-1 px-4 py-2.5 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home;