'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMetricsAggregated, getProject, type MetricAggregation, type Project } from '@/lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function MetricsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = parseInt(params.id as string)

  const [project, setProject] = useState<Project | null>(null)
  const [metrics, setMetrics] = useState<MetricAggregation[]>([])
  const [loading, setLoading] = useState(true)
  const [metricName, setMetricName] = useState('')
  const [hours, setHours] = useState(1)

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    loadMetrics()
  }, [projectId, metricName, hours])

  async function loadProject() {
    try {
      const data = await getProject(projectId)
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    }
  }

  async function loadMetrics() {
    setLoading(true)
    try {
      const now = new Date()
      const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

      const data = await getMetricsAggregated({
        projectId,
        name: metricName || undefined,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        bucketMinutes: 5,
      })
      setMetrics(data)
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group metrics by name
  const metricsByName = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = []
    }
    acc[metric.name].push(metric)
    return acc
  }, {} as Record<string, MetricAggregation[]>)

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
            {project?.name} - Metrics
          </h2>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metric Name
            </label>
            <input
              type="text"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="Filter by metric name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : Object.keys(metricsByName).length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No metrics found
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(metricsByName).map(([name, data]) => {
            const chartData = data.map(m => ({
              time: new Date(m.bucket).toLocaleTimeString(),
              avg: parseFloat(m.avg_value.toFixed(2)),
              min: parseFloat(m.min_value.toFixed(2)),
              max: parseFloat(m.max_value.toFixed(2)),
            })).reverse()

            return (
              <div key={name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{name}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#3b82f6" name="Average" />
                    <Line type="monotone" dataKey="min" stroke="#10b981" name="Min" />
                    <Line type="monotone" dataKey="max" stroke="#ef4444" name="Max" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
