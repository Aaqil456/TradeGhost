import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Analytics } from './features/analytics/Analytics'
import { Overview } from './features/dashboard/Overview'
import { Forecast } from './features/forecast/Forecast'
import { History } from './features/history/History'
import { Import } from './features/import/Import'
import { Settings } from './features/settings/Settings'
import { AppProvider } from './store/AppContext'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="history" element={<History />} />
        <Route path="import" element={<Import />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
