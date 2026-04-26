import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/contexts/auth-context'
import { AppShell } from '@/layout/app-shell'
import { DashboardPage } from '@/pages/dashboard-page'
import { LoginPage } from '@/pages/login-page'
import { ProtectedRoute } from '@/routes/protected-route'
import { PublicRoute } from '@/routes/public-route'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate replace to="/app/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to="/app/dashboard" />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
