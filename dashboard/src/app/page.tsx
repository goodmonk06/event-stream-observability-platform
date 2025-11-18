import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Observability Platform
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Monitor your applications with logs, metrics, and events
      </p>
      <Link
        href="/projects"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Projects
      </Link>
    </div>
  )
}
