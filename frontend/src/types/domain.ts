export type Area = {
  id: number
  name: string
  description: string | null
  status: string
}

export type Site = {
  id: number
  name: string
  description: string | null
  status: string
}

export type Position = {
  id: number
  name: string
  description: string | null
  status: string
  area: Area
}

export type UserRecord = {
  id: number
  fullName: string
  email: string
  role: string
  roleLabel: string
  status: string
  linkedEmployee: boolean
}

export type UserDetail = {
  id: number
  fullName: string
  email: string
  role: string
  roleLabel: string
  status: string
  employee: {
    employeeId: number
    dni: string
    positionName: string
    areaName: string
    siteName: string
    status: string
  } | null
}

export type EmployeeRecord = {
  id: number
  userId: number
  fullName: string
  email: string
  role: string
  roleLabel: string
  dni: string
  phone: string | null
  hireDate: string
  areaName: string
  positionName: string
  siteName: string
  status: string
}

export type EmployeeDetail = {
  id: number
  userId: number
  fullName: string
  email: string
  role: string
  roleLabel: string
  dni: string
  phone: string | null
  hireDate: string
  areaId: number
  areaName: string
  positionId: number
  positionName: string
  siteId: number
  siteName: string
  employeeStatus: string
  userStatus: string
  vacationAvailableDays: number
  vacationUsedDays: number
  vacationPendingDays: number
}

export type TodayAttendance = {
  attendanceDate: string
  recorded: boolean
  id: number | null
  checkInAt: string | null
  checkOutAt: string | null
  status: string | null
  lateMinutes: number | null
  source: string | null
  notes: string | null
  justificationNote: string | null
  justifiedByName: string | null
  justifiedAt: string | null
}

export type AttendanceRecord = {
  id: number
  attendanceDate: string
  checkInAt: string | null
  checkOutAt: string | null
  status: string
  lateMinutes: number
  source: string
  notes: string | null
  justificationNote: string | null
  justifiedByName: string | null
  justifiedAt: string | null
}

export type AttendanceSummaryItem = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  attendanceDate: string
  checkInAt: string | null
  checkOutAt: string | null
  status: string
  lateMinutes: number
  source: string
  notes: string | null
  justificationNote: string | null
  justifiedByName: string | null
  justifiedAt: string | null
}

export type LeaveRequestRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  requestType: string
  startAt: string
  endAt: string
  reason: string
  status: string
  reviewedByName: string | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
}

export type VacationBalance = {
  employeeId: number
  employeeName: string
  availableDays: number
  usedDays: number
  pendingDays: number
  notes: string | null
}

export type VacationRequestRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  startDate: string
  endDate: string
  requestedDays: number
  observation: string | null
  status: string
  reviewedByName: string | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
}

export type ContractRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  contractType: string
  startDate: string
  endDate: string | null
  status: string
  notes: string | null
  previousContractId: number | null
  documentCount: number
}

export type ContractDocumentRecord = {
  id: number
  contractId: number
  fileName: string
  contentType: string
  fileSize: number
  uploadedAt: string
}

export type ExpiringContractItem = {
  id: number
  employeeId: number
  employeeName: string
  areaName: string
  positionName: string
  contractType: string
  endDate: string
  daysUntilExpiration: number
}

export type EmployeeReportRow = {
  employeeId: number
  fullName: string
  email: string
  role: string
  dni: string
  phone: string | null
  hireDate: string
  areaName: string
  positionName: string
  siteName: string
  employeeStatus: string
}

export type AttendanceReportRow = {
  recordId: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  attendanceDate: string
  checkInAt: string | null
  checkOutAt: string | null
  status: string
  lateMinutes: number | null
  source: string
  notes: string | null
  justificationNote: string | null
}

export type RequestReportRow = {
  sourceGroup: string
  requestId: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  requestType: string
  requestStatus: string
  startValue: string
  endValue: string
  reasonOrObservation: string | null
  reviewedByName: string | null
  reviewComment: string | null
  createdAt: string
}

export type ExpiringContractReportRow = {
  contractId: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  areaName: string
  positionName: string
  siteName: string
  contractType: string
  startDate: string
  endDate: string
  status: string
  daysUntilExpiration: number
}

export type AuditLogRecord = {
  id: number
  eventAt: string
  userId: number | null
  userEmail: string | null
  module: string
  action: string
  entityType: string
  entityId: number | null
  summary: string
}
