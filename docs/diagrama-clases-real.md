# Diagrama de clases real

Este diagrama representa las entidades JPA actuales del backend y sus relaciones principales. No incluye controllers, services, repositories ni DTOs.

```mermaid
classDiagram
    direction LR

    class User {
        +Long id
        +String fullName
        +String email
        +String passwordHash
        +UserStatus status
        +Instant createdAt
        +Instant updatedAt
    }

    class Role {
        +Long id
        +RoleName name
        +String description
        +Instant createdAt
        +Instant updatedAt
    }

    class Employee {
        +Long id
        +String dni
        +String biometricCode
        +String phone
        +LocalDate hireDate
        +EmployeeStatus status
        +Instant createdAt
        +Instant updatedAt
    }

    class Area {
        +Long id
        +String name
        +String description
        +RecordStatus status
        +Instant createdAt
        +Instant updatedAt
    }

    class Position {
        +Long id
        +String name
        +String description
        +RecordStatus status
        +Instant createdAt
        +Instant updatedAt
    }

    class Site {
        +Long id
        +String name
        +String description
        +RecordStatus status
        +Instant createdAt
        +Instant updatedAt
    }

    class AttendanceSettings {
        +Long id
        +LocalTime workdayStartTime
        +LocalTime workdayEndTime
        +Integer lateToleranceMinutes
        +Instant createdAt
        +Instant updatedAt
    }

    class AttendanceRecord {
        +Long id
        +LocalDate attendanceDate
        +Instant checkInAt
        +Instant checkOutAt
        +AttendanceStatus status
        +Integer lateMinutes
        +Integer workedMinutes
        +Integer extraMinutes
        +AttendanceSource source
        +String notes
        +String justificationNote
        +Instant justifiedAt
        +Instant createdAt
        +Instant updatedAt
    }

    class LeaveRequest {
        +Long id
        +LeaveRequestType requestType
        +LocalDateTime startAt
        +LocalDateTime endAt
        +String reason
        +LeaveRequestStatus status
        +Instant reviewedAt
        +String reviewComment
        +Instant createdAt
        +Instant updatedAt
    }

    class VacationRequest {
        +Long id
        +LocalDate startDate
        +LocalDate endDate
        +Integer requestedDays
        +String observation
        +VacationRequestStatus status
        +Instant reviewedAt
        +String reviewComment
        +Instant createdAt
        +Instant updatedAt
    }

    class VacationBalance {
        +Long id
        +Integer availableDays
        +Integer usedDays
        +Integer pendingDays
        +String notes
        +Instant createdAt
        +Instant updatedAt
    }

    class Contract {
        +Long id
        +ContractType contractType
        +LocalDate startDate
        +LocalDate endDate
        +ContractStatus status
        +String notes
        +Instant createdAt
        +Instant updatedAt
    }

    class ContractDocument {
        +Long id
        +String fileName
        +String contentType
        +Long fileSize
        +byte[] fileData
        +Instant uploadedAt
    }

    class AuditLog {
        +Long id
        +Instant eventAt
        +Long userId
        +String userEmail
        +String module
        +String action
        +String entityType
        +Long entityId
        +String summary
    }

    class UserStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class RoleName {
        <<enumeration>>
        ADMIN
        HR
        MANAGER
        EMPLOYEE
    }

    class RecordStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class EmployeeStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class AttendanceStatus {
        <<enumeration>>
        PRESENT
        LATE
        ABSENT
        JUSTIFIED_LATE
        JUSTIFIED_ABSENT
    }

    class AttendanceSource {
        <<enumeration>>
        MANUAL
        BIOMETRIC_IMPORT
    }

    class LeaveRequestType {
        <<enumeration>>
        PERSONAL_PERMISSION
        MEDICAL_LEAVE
        OTHER_LICENSE
    }

    class LeaveRequestStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
        CANCELLED
    }

    class VacationRequestStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    class ContractType {
        <<enumeration>>
        FIXED_TERM
        INDEFINITE
        TEMPORARY
        INTERNSHIP
    }

    class ContractStatus {
        <<enumeration>>
        ACTIVE
        EXPIRED
        TERMINATED
    }

    User "0..*" -- "0..*" Role : roles
    User "1" -- "0..1" Employee : perfilEmpleado

    Area "1" -- "0..*" Position : cargos
    Position "1" -- "0..*" Employee : empleados
    Site "1" -- "0..*" Employee : empleados

    Employee "1" -- "0..*" AttendanceRecord : asistencias
    Employee "1" -- "0..*" LeaveRequest : permisos
    Employee "1" -- "0..*" VacationRequest : solicitudesVacaciones
    Employee "1" -- "0..1" VacationBalance : saldoVacaciones
    Employee "1" -- "0..*" Contract : contratos

    User "0..1" -- "0..*" AttendanceRecord : justifica
    User "0..1" -- "0..*" LeaveRequest : revisa
    User "0..1" -- "0..*" VacationRequest : revisa

    Contract "0..1" -- "0..*" Contract : renovaciones
    Contract "1" -- "0..*" ContractDocument : documentos

    User --> UserStatus
    Role --> RoleName
    Area --> RecordStatus
    Position --> RecordStatus
    Site --> RecordStatus
    Employee --> EmployeeStatus
    AttendanceRecord --> AttendanceStatus
    AttendanceRecord --> AttendanceSource
    LeaveRequest --> LeaveRequestType
    LeaveRequest --> LeaveRequestStatus
    VacationRequest --> VacationRequestStatus
    Contract --> ContractType
    Contract --> ContractStatus
```

## Notas

- `AuditLog` no tiene una relacion JPA directa con `User`; guarda `userId` y `userEmail`.
- `AttendanceSettings` no se relaciona directamente con otra entidad; funciona como configuracion global de asistencia.
- La relacion entre `User` y `Role` se persiste mediante la tabla intermedia `user_roles`.
- `Contract.previousContract` modela renovaciones o continuidad entre contratos.
