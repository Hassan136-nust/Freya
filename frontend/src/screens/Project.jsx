import { useState, useEffect, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import { UserContext } from '../context/UserContext'

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
    const { user } = useContext(UserContext)

    // Fetch project details
    useEffect(() => {
        axios.get(`/projects/get-project/${projectId}`).then((res) => {
            console.log('Project details:', res.data)
            setProject(res.data.project)
            // Check if users are populated
            if (res.data.project && res.data.project.users) {
                console.log('Members:', res.data.project.users)
                setMembers(res.data.project.users)
            }
            
            // Initialize socket after project is loaded
            if (res.data.project && res.data.project._id) {
                initializeSocket(res.data.project._id)
                receiveMessage('project-message', (data) => {
                    console.log('Message received:', data)
                    setMessages(prev => [...prev, data])
                })
            }
        }).catch((err) => {
            console.log('Error fetching project:', err.response?.data || err.message)
        })
    }, [projectId])

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
                // Filter out users who are already members
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
            // Refresh project details to show new members
            setMembers(res.data.project.users || [])
            setIsAddCollaboratorOpen(false)
            setSelectedUsers([])
        }).catch((err) => {
            console.log('Error adding collaborators:', err.response?.data || err.message)
        })
    }
    
    function send(){
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
        <div className="flex flex-col md:flex-row h-screen bg-slate-50">
            {/* Left Side - Chat Panel */}
            <div className="w-full md:w-96 lg:w-[28rem] bg-slate-100 border-r border-slate-300 flex flex-col">
                {/* Chat Header */}
                <div className="bg-slate-800 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center gap-2">
                    <h2 className="text-slate-50 text-base md:text-lg font-semibold">Project Chat</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsAddCollaboratorOpen(true)}
                            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-slate-50 text-sm flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Add</span>
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
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                    {messages.map((msg) => (
                        <div 
                            key={msg._id}
                            className={`flex ${msg.sender === user?.email ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] md:max-w-xs ${msg.sender === user?.email ? 'bg-teal-600 text-slate-50' : 'bg-slate-200 text-slate-800'} rounded-lg px-3 md:px-4 py-2 md:py-3 shadow-sm`}>
                                <p className="text-xs font-medium mb-1 opacity-75">{msg.sender}</p>
                                <p className="text-sm break-words">{msg.message}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="bg-slate-200 border-t border-slate-300 p-3 md:p-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-3 md:px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 text-slate-900 text-sm"
                        />
                        <button 
                          onClick={send}  className="px-3 md:px-4 py-2 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side - Empty Content Area */}
            <div className="hidden md:flex flex-1 bg-slate-50">
                {/* Empty - You can add content here later */}
            </div>

            {/* Add Collaborators Modal */}
            {isAddCollaboratorOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsAddCollaboratorOpen(false)}
                    >
                        <div 
                            className="bg-slate-100 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center rounded-t-lg">
                                <h3 className="text-slate-50 text-lg font-semibold">Add Collaborators</h3>
                                <button 
                                    onClick={() => setIsAddCollaboratorOpen(false)}
                                    className="text-slate-300 hover:text-slate-50 text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Users List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-2">
                                    {allUsers.length === 0 ? (
                                        <p className="text-slate-500 text-center py-8">Loading users...</p>
                                    ) : (
                                        allUsers.map((user) => (
                                            <div 
                                                key={user._id}
                                                onClick={() => toggleUserSelection(user._id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedUsers.includes(user._id) 
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

                            {/* Modal Footer */}
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
                </>
            )}

            {/* Members Side Panel with Slide Animation */}
            <div className={`fixed right-0 top-0 h-full w-full sm:w-80 bg-slate-100 shadow-2xl border-l border-slate-300 transform transition-transform duration-300 ease-in-out z-50 ${isMembersPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Panel Header */}
                <div className="bg-slate-800 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                    <h2 className="text-slate-50 text-base md:text-lg font-semibold">Members</h2>
                    <button 
                        onClick={() => setIsMembersPanelOpen(false)}
                        className="text-slate-300 hover:text-slate-50 text-3xl leading-none transition-colors"
                    >
                        ×
                    </button>
                </div>
                
                {/* Members List */}
                <div className="overflow-y-auto p-3 md:p-4 h-full pb-20">
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No members yet</p>
                        ) : (
                            members.map((member, index) => (
                                <div 
                                    key={member._id || index}
                                    className="bg-slate-200 rounded-lg px-3 md:px-4 py-3 hover:bg-slate-300 transition-colors"
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
