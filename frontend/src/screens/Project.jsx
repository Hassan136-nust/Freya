import { useState } from 'react'
import { useParams } from 'react-router-dom'

const Project = () => {
    const { projectId } = useParams()
    const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false)
    const [message, setMessage] = useState('')

    // Dummy data for UI
    const members = [
        { email: 'user1@example.com', _id: '1' },
        { email: 'user2@example.com', _id: '2' },
        { email: 'user3@example.com', _id: '3' }
    ]

    const messages = [
        { _id: '1', sender: 'user1@example.com', text: 'Hello team!', isOwn: false },
        { _id: '2', sender: 'you@example.com', text: 'Hi everyone!', isOwn: true },
        { _id: '3', sender: 'user2@example.com', text: 'How is the project going?', isOwn: false },
        { _id: '4', sender: 'you@example.com', text: 'Making good progress!', isOwn: true }
    ]

    return (
        <div className="flex flex-col md:flex-row h-screen bg-slate-50">
            {/* Left Side - Chat Panel */}
            <div className="w-full md:w-96 lg:w-[28rem] bg-slate-100 border-r border-slate-300 flex flex-col">
                {/* Chat Header */}
                <div className="bg-slate-800 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                    <h2 className="text-slate-50 text-base md:text-lg font-semibold">Project Chat</h2>
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

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                    {messages.map((msg) => (
                        <div 
                            key={msg._id}
                            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] md:max-w-xs ${msg.isOwn ? 'bg-teal-600 text-slate-50' : 'bg-slate-200 text-slate-800'} rounded-lg px-3 md:px-4 py-2 md:py-3 shadow-sm`}>
                                <p className="text-xs font-medium mb-1 opacity-75">{msg.sender}</p>
                                <p className="text-sm break-words">{msg.text}</p>
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
                        <button className="px-3 md:px-4 py-2 bg-teal-600 text-slate-50 rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex-shrink-0">
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
                        {members.map((member) => (
                            <div 
                                key={member._id}
                                className="bg-slate-200 rounded-lg px-3 md:px-4 py-3 hover:bg-slate-300 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-slate-50 font-semibold flex-shrink-0">
                                        {member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{member.email}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
