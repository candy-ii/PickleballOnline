import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlayerDashboard from './components/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerDashboard />} />
        <Route path="/dashboard/player" element={<PlayerDashboard />} />
        {/* Future role-based dashboards go here, e.g.:
            <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App
