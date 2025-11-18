'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getLogs, getProject, type LogEvent, type Project } from '@/lib/api'

export default function LogsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = parseInt(params.id as string)

  const [project, setProject] = useState<Project | null>(null)
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    loadLogs()
  }, [projectId, level, search, page])

  async function loadProject() {
    try {
      const data = await getProject(projectId)
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await getLogs({
        projectId,
        level: level || undefined,
        search: search || undefined,
        limit,
        offset: page * limit,
      })
      setLogs(data.logs)
      setTotal(data.total)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/projects')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Projects
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {project?.name} - Logs
          </h2>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Search messages..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            log.level === 'error' ? 'bg-red-100 text-red-800' :
                            log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                            log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
