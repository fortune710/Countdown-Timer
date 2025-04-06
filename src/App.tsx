import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ScheduleEntryPage from './pages/schedule-entry'
import TimerPage from './pages/timer'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <nav className='w-full flex items-center justify-center gap-4 py-3'>
        <Link className='font-medium' to="/">Schedule Entry</Link> | <Link className='font-medium' to="/timer">Timer</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<ScheduleEntryPage />} />
        <Route path="/timer" element={<TimerPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App