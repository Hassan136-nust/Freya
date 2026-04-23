import { useParams } from 'react-router-dom'

const Project = () => {
    const { projectId } = useParams()

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-slate-800 text-slate-50 py-6 px-8 shadow-md">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold">Project</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-12">
                <div className="bg-slate-100 rounded-lg p-8">
                    <p className="text-slate-600">Project ID: {projectId}</p>
                </div>
            </main>
        </div>
    )
}

export default Project
