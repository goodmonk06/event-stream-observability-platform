'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getEvents, getProject, type CustomEvent, type Project } from '@/lib/api'

export default function EventsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = parseInt(params.id as string)

  const [project, setProject] = useState<Project | null>(null)
  const [events, setEvents] = useState<CustomEvent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [eventName, setEventName] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    loadEvents()
  }, [projectId, eventName, page])

  async function loadProject() {
    try {
      const data = await getProject(projectId)
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await getEvents({
        projectId,
        name: eventName || undefined,
        limit,
        offset: page * limit,
      })
      setEvents(data.events)
      setTotal(data.total)
    } catch (error) {
      console.error('Error loading events:', error)
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
            {project?.name} - Events
          </h2>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => {
              setEventName(e.target.value)
              setPage(0)
            }}
            placeholder="Filter by event name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No events found
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.payload_json && Object.keys(event.payload_json).length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Payload</h4>
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(event.payload_json, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} events
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
