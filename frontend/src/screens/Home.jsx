import { useState,useContext } from "react";
import { UserContext } from "../context/UserContext";
import axios from "../config/axios";

const Home=()=>{

    const[isModalOpen,setIsModalOpen] = useState(false)
    const[projectName,setProjectName] = useState('')
    const{user} = useContext(UserContext)

    function createProject(e){
        e.preventDefault()
        console.log('Creating project with name:', projectName)
        console.log('Token:', localStorage.getItem('token'))
        
        axios.post('/projects/create',{
            name:projectName
        },{
            headers:{
                Authorization:`Bearer ${localStorage.getItem('token')}`
            }
        }).then((res)=>{
            console.log('Project created successfully:', res.data)
            setIsModalOpen(false)
            setProjectName('')
        }).catch((err)=>{
            console.log('Error creating project:', err.response?.data || err.message)
        })
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
                    {/* Project cards will go here */}
                    <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-8 flex items-center justify-center text-slate-400">
                        No projects yet. Create your first project!
                    </div>
                </div>
            </main>

            {/* Modal */}
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
        </div>
    )
 }

 export default Home;