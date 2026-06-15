package com.grupomendoza.rrhh.report;

import com.grupomendoza.rrhh.attendance.AttendanceRecord;
import com.grupomendoza.rrhh.attendance.AttendanceRecordRepository;
import com.grupomendoza.rrhh.attendance.AttendanceStatus;
import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.contract.Contract;
import com.grupomendoza.rrhh.contract.ContractRepository;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.leave.LeaveRequest;
import com.grupomendoza.rrhh.leave.LeaveRequestRepository;
import com.grupomendoza.rrhh.leave.LeaveRequestStatus;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.vacation.VacationRequest;
import com.grupomendoza.rrhh.vacation.VacationRequestRepository;
import com.grupomendoza.rrhh.vacation.VacationRequestStatus;
import com.grupomendoza.rrhh.report.dto.AttendanceReportRow;
import com.grupomendoza.rrhh.report.dto.EmployeeReportRow;
import com.grupomendoza.rrhh.report.dto.ExpiringContractReportRow;
import com.grupomendoza.rrhh.report.dto.RequestReportRow;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    private static final int DEFAULT_CONTRACT_THRESHOLD_DAYS = 30;

    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final VacationRequestRepository vacationRequestRepository;
    private final ContractRepository contractRepository;
    private final ExcelExportService excelExportService;

    public ReportService(
            EmployeeRepository employeeRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            LeaveRequestRepository leaveRequestRepository,
            VacationRequestRepository vacationRequestRepository,
            ContractRepository contractRepository,
            ExcelExportService excelExportService
    ) {
        this.employeeRepository = employeeRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.vacationRequestRepository = vacationRequestRepository;
        this.contractRepository = contractRepository;
        this.excelExportService = excelExportService;
    }

    @Transactional(readOnly = true)
    public List<EmployeeReportRow> getEmployeeReport(
            String search,
            String status,
            Long siteId,
            Long areaId,
            Long positionId
    ) {
        EmployeeStatus parsedStatus = SearchQuery.parseEnum(status, EmployeeStatus.class);
        return employeeRepository.search(SearchQuery.normalize(search), parsedStatus, siteId, positionId).stream()
                .filter(employee -> areaId == null || employee.getPosition().getArea().getId().equals(areaId))
                .map(this::toEmployeeReportRow)
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportEmployeeReport(
            String search,
            String status,
            Long siteId,
            Long areaId,
            Long positionId
    ) {
        List<EmployeeReportRow> rows = getEmployeeReport(search, status, siteId, areaId, positionId);
        List<List<String>> values = rows.stream()
                .map(row -> List.of(
                        stringOf(row.employeeId()),
                        row.fullName(),
                        row.email(),
                        row.role(),
                        row.dni(),
                        stringOf(row.phone()),
                        stringOf(row.hireDate()),
                        row.areaName(),
                        row.positionName(),
                        row.siteName(),
                        row.employeeStatus()
                ))
                .toList();
        return excelExportService.export(
                "Empleados",
                employeeKpis(rows),
                List.of("ID", "Nombre", "Correo", "Rol", "DNI", "Teléfono", "Ingreso", "Área", "Cargo", "Sede", "Estado"),
                values
        );
    }

    @Transactional(readOnly = true)
    public List<AttendanceReportRow> getAttendanceReport(
            AuthenticatedUser currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Long employeeId,
            Long siteId,
            Long areaId
    ) {
        validateDateRange(startDate, endDate);
        AttendanceStatus parsedStatus = SearchQuery.parseEnum(status, AttendanceStatus.class);

        Long scopedAreaId = areaId;
        Long excludedEmployeeId = null;
        if (isManagerOnly(currentUser)) {
            Employee managerEmployee = requireCurrentEmployee(currentUser);
            scopedAreaId = managerEmployee.getPosition().getArea().getId();
            excludedEmployeeId = managerEmployee.getId();
        }

        return attendanceRecordRepository
                .searchSummary(startDate, endDate, parsedStatus, employeeId, scopedAreaId, excludedEmployeeId)
                .stream()
                .filter(record -> siteId == null || record.getEmployee().getSite().getId().equals(siteId))
                .map(this::toAttendanceReportRow)
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportAttendanceReport(
            AuthenticatedUser currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Long employeeId,
            Long siteId,
            Long areaId
    ) {
        List<AttendanceReportRow> rows = getAttendanceReport(currentUser, startDate, endDate, status, employeeId, siteId, areaId);
        List<List<String>> values = rows.stream()
                .map(row -> List.of(
                        stringOf(row.recordId()),
                        stringOf(row.employeeId()),
                        row.employeeName(),
                        row.employeeEmail(),
                        row.areaName(),
                        row.positionName(),
                        row.siteName(),
                        stringOf(row.attendanceDate()),
                        stringOf(row.checkInAt()),
                        stringOf(row.checkOutAt()),
                        row.status(),
                        stringOf(row.lateMinutes()),
                        row.source(),
                        stringOf(row.notes()),
                        stringOf(row.justificationNote())
                ))
                .toList();
        return excelExportService.export(
                "Asistencia",
                attendanceKpis(rows),
                List.of("ID", "Empleado ID", "Empleado", "Correo", "Área", "Cargo", "Sede", "Fecha", "Entrada", "Salida", "Estado", "Tardanza", "Origen", "Notas", "Justificación"),
                values
        );
    }

    @Transactional(readOnly = true)
    public List<RequestReportRow> getRequestReport(
            AuthenticatedUser currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String requestStatus,
            String requestGroup,
            Long employeeId
    ) {
        validateDateRange(startDate, endDate);
        String normalizedGroup = normalizeNullable(requestGroup);
        String normalizedStatus = normalizeNullable(requestStatus);
        Long areaId = null;
        Long excludedEmployeeId = null;
        if (isManagerOnly(currentUser)) {
            Employee managerEmployee = requireCurrentEmployee(currentUser);
            areaId = managerEmployee.getPosition().getArea().getId();
            excludedEmployeeId = managerEmployee.getId();
        }

        List<RequestReportRow> rows = new ArrayList<>();
        LeaveRequestStatus parsedLeaveStatus = parseEnumSafely(normalizedStatus, LeaveRequestStatus.class);
        if (normalizedGroup == null || "LEAVE".equalsIgnoreCase(normalizedGroup)) {
            rows.addAll(leaveRequestRepository.search(areaId, excludedEmployeeId).stream()
                    .filter(request -> employeeId == null || request.getEmployee().getId().equals(employeeId))
                    .filter(request -> normalizedStatus == null || parsedLeaveStatus == request.getStatus())
                    .filter(request -> requestMatchesDateRange(request.getStartAt().toLocalDate(), request.getEndAt().toLocalDate(), startDate, endDate))
                    .map(this::toLeaveRequestReportRow)
                    .toList());
        }

        if (normalizedGroup == null || "VACATION".equalsIgnoreCase(normalizedGroup)) {
            VacationRequestStatus parsedVacationStatus = parseEnumSafely(normalizedStatus, VacationRequestStatus.class);
            rows.addAll(vacationRequestRepository.search(areaId, excludedEmployeeId).stream()
                    .filter(request -> employeeId == null || request.getEmployee().getId().equals(employeeId))
                    .filter(request -> normalizedStatus == null || parsedVacationStatus == request.getStatus())
                    .filter(request -> requestMatchesDateRange(request.getStartDate(), request.getEndDate(), startDate, endDate))
                    .map(this::toVacationRequestReportRow)
                    .toList());
        }

        return rows.stream()
                .sorted((left, right) -> right.createdAt().compareTo(left.createdAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportRequestReport(
            AuthenticatedUser currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String requestStatus,
            String requestGroup,
            Long employeeId
    ) {
        List<RequestReportRow> rows = getRequestReport(currentUser, startDate, endDate, requestStatus, requestGroup, employeeId);
        List<List<String>> values = rows.stream()
                .map(row -> List.of(
                        row.sourceGroup(),
                        stringOf(row.requestId()),
                        stringOf(row.employeeId()),
                        row.employeeName(),
                        row.employeeEmail(),
                        row.areaName(),
                        row.positionName(),
                        row.siteName(),
                        row.requestType(),
                        row.requestStatus(),
                        row.startValue(),
                        row.endValue(),
                        stringOf(row.reasonOrObservation()),
                        stringOf(row.reviewedByName()),
                        stringOf(row.reviewComment()),
                        row.createdAt()
                ))
                .toList();
        return excelExportService.export(
                "Solicitudes",
                requestKpis(rows),
                List.of("Grupo", "ID", "Empleado ID", "Empleado", "Correo", "Área", "Cargo", "Sede", "Tipo", "Estado", "Inicio", "Fin", "Detalle", "Revisado por", "Comentario", "Creado"),
                values
        );
    }

    @Transactional(readOnly = true)
    public List<ExpiringContractReportRow> getExpiringContractReport(
            Integer thresholdDays,
            Long siteId,
            Long areaId
    ) {
        int resolvedThreshold = thresholdDays != null ? thresholdDays : DEFAULT_CONTRACT_THRESHOLD_DAYS;
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(resolvedThreshold);

        return contractRepository.findExpiringBetween(today, threshold).stream()
                .filter(contract -> siteId == null || contract.getEmployee().getSite().getId().equals(siteId))
                .filter(contract -> areaId == null || contract.getEmployee().getPosition().getArea().getId().equals(areaId))
                .map(contract -> new ExpiringContractReportRow(
                        contract.getId(),
                        contract.getEmployee().getId(),
                        contract.getEmployee().getUser().getFullName(),
                        contract.getEmployee().getUser().getEmail(),
                        contract.getEmployee().getPosition().getArea().getName(),
                        contract.getEmployee().getPosition().getName(),
                        contract.getEmployee().getSite().getName(),
                        contract.getContractType().name(),
                        contract.getStartDate(),
                        contract.getEndDate(),
                        contract.getStatus().name(),
                        ChronoUnit.DAYS.between(today, contract.getEndDate())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportExpiringContractReport(Integer thresholdDays, Long siteId, Long areaId) {
        List<ExpiringContractReportRow> rows = getExpiringContractReport(thresholdDays, siteId, areaId);
        List<List<String>> values = rows.stream()
                .map(row -> List.of(
                        stringOf(row.contractId()),
                        stringOf(row.employeeId()),
                        row.employeeName(),
                        row.employeeEmail(),
                        row.areaName(),
                        row.positionName(),
                        row.siteName(),
                        row.contractType(),
                        stringOf(row.startDate()),
                        stringOf(row.endDate()),
                        row.status(),
                        stringOf(row.daysUntilExpiration())
                ))
                .toList();
        return excelExportService.export(
                "Contratos",
                contractKpis(rows, thresholdDays != null ? thresholdDays : DEFAULT_CONTRACT_THRESHOLD_DAYS),
                List.of("Contrato ID", "Empleado ID", "Empleado", "Correo", "Área", "Cargo", "Sede", "Tipo", "Inicio", "Fin", "Estado", "Días por vencer"),
                values
        );
    }

    private List<List<String>> employeeKpis(List<EmployeeReportRow> rows) {
        long activeCount = rows.stream().filter(row -> "ACTIVE".equals(row.employeeStatus())).count();
        long inactiveCount = rows.stream().filter(row -> "INACTIVE".equals(row.employeeStatus())).count();
        long areaCount = rows.stream().map(EmployeeReportRow::areaName).distinct().count();

        return List.of(
                kpi("Total empleados", rows.size(), "Resultados con los filtros actuales"),
                kpi("Activos", activeCount, "Colaboradores habilitados"),
                kpi("Inactivos", inactiveCount, "Registros fuera de operación"),
                kpi("Áreas", areaCount, "Áreas representadas en el reporte")
        );
    }

    private List<List<String>> attendanceKpis(List<AttendanceReportRow> rows) {
        long presentCount = rows.stream()
                .filter(row -> !isAbsentStatus(row.status()))
                .count();
        long lateCount = rows.stream()
                .filter(row -> "LATE".equals(row.status()) || "JUSTIFIED_LATE".equals(row.status()))
                .count();
        long absentCount = rows.stream()
                .filter(row -> isAbsentStatus(row.status()))
                .count();
        List<AttendanceReportRow> lateRows = rows.stream()
                .filter(row -> row.lateMinutes() != null && row.lateMinutes() > 0)
                .toList();
        long averageLateMinutes = lateRows.isEmpty()
                ? 0
                : Math.round(lateRows.stream().mapToInt(AttendanceReportRow::lateMinutes).average().orElse(0));
        long attendanceRate = rows.isEmpty() ? 0 : Math.round((presentCount * 100.0) / rows.size());

        return List.of(
                kpi("Tasa de asistencia", attendanceRate + "%", presentCount + " de " + rows.size() + " registro(s)"),
                kpi("Presentes", presentCount, "Incluye tardanzas justificadas y no justificadas"),
                kpi("Tardanzas", lateCount, averageLateMinutes + " min promedio"),
                kpi("Inasistencias", absentCount, "Ausencias justificadas y pendientes")
        );
    }

    private List<List<String>> requestKpis(List<RequestReportRow> rows) {
        long pendingCount = rows.stream().filter(row -> "PENDING".equals(row.requestStatus())).count();
        long approvedCount = rows.stream().filter(row -> "APPROVED".equals(row.requestStatus())).count();
        long rejectedOrCancelledCount = rows.stream()
                .filter(row -> "REJECTED".equals(row.requestStatus()) || "CANCELLED".equals(row.requestStatus()))
                .count();
        long vacationCount = rows.stream().filter(row -> "VACATION".equals(row.sourceGroup())).count();

        return List.of(
                kpi("Total solicitudes", rows.size(), "Permisos, licencias y vacaciones"),
                kpi("Pendientes", pendingCount, "Requieren revisión"),
                kpi("Aprobadas", approvedCount, "Solicitudes aceptadas"),
                kpi("Vacaciones", vacationCount, rejectedOrCancelledCount + " rechazada(s) o cancelada(s)")
        );
    }

    private List<List<String>> contractKpis(List<ExpiringContractReportRow> rows, int thresholdDays) {
        long urgentCount = rows.stream().filter(row -> row.daysUntilExpiration() <= 7).count();
        long averageDays = rows.isEmpty()
                ? 0
                : Math.round(rows.stream().mapToLong(ExpiringContractReportRow::daysUntilExpiration).average().orElse(0));
        long fixedTermCount = rows.stream().filter(row -> "FIXED_TERM".equals(row.contractType())).count();
        long areaCount = rows.stream().map(ExpiringContractReportRow::areaName).distinct().count();

        return List.of(
                kpi("Por vencer", rows.size(), "Dentro de " + thresholdDays + " día(s)"),
                kpi("Urgentes", urgentCount, "Vencen en 7 días o menos"),
                kpi("Días promedio", averageDays, "Hasta la fecha de vencimiento"),
                kpi("Plazo fijo", fixedTermCount, areaCount + " área(s) involucrada(s)")
        );
    }

    private boolean isAbsentStatus(String status) {
        return "ABSENT".equals(status) || "JUSTIFIED_ABSENT".equals(status);
    }

    private List<String> kpi(String name, Object value, String description) {
        return List.of(name, stringOf(value), description);
    }

    private EmployeeReportRow toEmployeeReportRow(Employee employee) {
        String roleCode = employee.getUser().getRoles().stream()
                .findFirst()
                .map(userRole -> userRole.getName().name())
                .orElse("UNKNOWN");
        return new EmployeeReportRow(
                employee.getId(),
                employee.getUser().getFullName(),
                employee.getUser().getEmail(),
                roleCode,
                employee.getDni(),
                employee.getPhone(),
                employee.getHireDate(),
                employee.getPosition().getArea().getName(),
                employee.getPosition().getName(),
                employee.getSite().getName(),
                employee.getStatus().name()
        );
    }

    private AttendanceReportRow toAttendanceReportRow(AttendanceRecord record) {
        return new AttendanceReportRow(
                record.getId(),
                record.getEmployee().getId(),
                record.getEmployee().getUser().getFullName(),
                record.getEmployee().getUser().getEmail(),
                record.getEmployee().getPosition().getArea().getName(),
                record.getEmployee().getPosition().getName(),
                record.getEmployee().getSite().getName(),
                record.getAttendanceDate(),
                record.getCheckInAt(),
                record.getCheckOutAt(),
                record.getStatus().name(),
                record.getLateMinutes(),
                record.getSource().name(),
                record.getNotes(),
                record.getJustificationNote()
        );
    }

    private RequestReportRow toLeaveRequestReportRow(LeaveRequest request) {
        return new RequestReportRow(
                "LEAVE",
                request.getId(),
                request.getEmployee().getId(),
                request.getEmployee().getUser().getFullName(),
                request.getEmployee().getUser().getEmail(),
                request.getEmployee().getPosition().getArea().getName(),
                request.getEmployee().getPosition().getName(),
                request.getEmployee().getSite().getName(),
                request.getRequestType().name(),
                request.getStatus().name(),
                request.getStartAt().toString(),
                request.getEndAt().toString(),
                request.getReason(),
                request.getReviewedByUser() != null ? request.getReviewedByUser().getFullName() : null,
                request.getReviewComment(),
                DATE_TIME_FORMATTER.format(request.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime())
        );
    }

    private RequestReportRow toVacationRequestReportRow(VacationRequest request) {
        return new RequestReportRow(
                "VACATION",
                request.getId(),
                request.getEmployee().getId(),
                request.getEmployee().getUser().getFullName(),
                request.getEmployee().getUser().getEmail(),
                request.getEmployee().getPosition().getArea().getName(),
                request.getEmployee().getPosition().getName(),
                request.getEmployee().getSite().getName(),
                "VACATION",
                request.getStatus().name(),
                request.getStartDate().toString(),
                request.getEndDate().toString(),
                request.getObservation(),
                request.getReviewedByUser() != null ? request.getReviewedByUser().getFullName() : null,
                request.getReviewComment(),
                DATE_TIME_FORMATTER.format(request.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime())
        );
    }

    private Employee requireCurrentEmployee(AuthenticatedUser currentUser) {
        return employeeRepository.findDetailedByUserId(currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Current user is not linked to an employee profile."));
    }

    private boolean isManagerOnly(AuthenticatedUser currentUser) {
        return currentUser.getRoles().contains("MANAGER") && !currentUser.getRoles().contains("ADMIN");
    }

    private boolean requestMatchesDateRange(LocalDate start, LocalDate end, LocalDate filterStart, LocalDate filterEnd) {
        if (filterStart != null && end.isBefore(filterStart)) {
            return false;
        }
        if (filterEnd != null && start.isAfter(filterEnd)) {
            return false;
        }
        return true;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private <T extends Enum<T>> T parseEnumSafely(String value, Class<T> enumType) {
        if (value == null) {
            return null;
        }
        try {
            return SearchQuery.parseEnum(value, enumType);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String stringOf(Object value) {
        return value != null ? String.valueOf(value) : "";
    }
}
