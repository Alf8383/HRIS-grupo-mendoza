import { Navigate, Route, Routes } from 'react-router-dom'

import { ErrorBoundary } from '@/components/app/error-boundary'
import { AuthProvider } from '@/contexts/auth-context'
import { AppShell } from '@/layout/app-shell'
import { AreasPage } from '@/pages/areas-page'
import { AuditPage } from '@/pages/audit-page'
import { AttendancePage } from '@/pages/attendance-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { EmployeeDetailPage } from '@/pages/employee-detail-page'
import { EmployeesPage } from '@/pages/employees-page'
import { ContractsPage } from '@/pages/contracts-page'
import { LeaveRequestsPage } from '@/pages/leave-requests-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PositionsPage } from '@/pages/positions-page'
import { ReportsPage } from '@/pages/reports-page'
import { SitesPage } from '@/pages/sites-page'
import { UserDetailPage } from '@/pages/user-detail-page'
import { UsersPage } from '@/pages/users-page'
import { VacationsPage } from '@/pages/vacations-page'
import { ProtectedRoute } from '@/routes/protected-route'
import { PublicRoute } from '@/routes/public-route'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate replace to="/app/dashboard" />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leave-requests" element={<LeaveRequestsPage />} />
              <Route path="vacations" element={<VacationsPage />} />

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']} />}>
                <Route path="reports" element={<ReportsPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR']} />}>
                <Route path="audit" element={<AuditPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UserDetailPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR']} />}>
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="employees/:id" element={<EmployeeDetailPage />} />
                <Route path="settings/areas" element={<AreasPage />} />
                <Route path="settings/cargos" element={<PositionsPage />} />
                <Route path="settings/sedes" element={<SitesPage />} />
                <Route path="contracts" element={<ContractsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate replace to="/app/dashboard" />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
