'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProjects, createProject, deleteProject, type Project } from '@/lib/api'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newProjectName.trim()) return

    setCreating(true)
    try {
      await createProject(newProjectName)
      setNewProjectName('')
      await loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await deleteProject(id)
      await loadProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Projects</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Create New Project</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newProjectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No projects yet. Create one to get started!
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete
                </button>
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase">API Key</label>
                <code className="block mt-1 px-3 py-2 bg-gray-50 rounded text-sm font-mono break-all">
                  {project.api_key}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/projects/${project.id}/logs`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Logs
                </button>
                <button
                  onClick={() => router.push(`/projects/${project.id}/metrics`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Metrics
                </button>
                <button
                  onClick={() => router.push(`/projects/${project.id}/events`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Events
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
