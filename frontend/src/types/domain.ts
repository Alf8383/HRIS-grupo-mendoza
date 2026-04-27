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
