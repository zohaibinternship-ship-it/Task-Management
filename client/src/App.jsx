import { Routes, Route } from 'react-router-dom'

function Placeholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white rounded-xl shadow-sm border border-navy-900/10 px-10 py-8 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">Task Management System</h1>
        <p className="mt-2 text-navy-600">
          Foundation phase complete. <span className="text-gold-600 font-medium">Auth &amp; dashboards coming next.</span>
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  )
}
