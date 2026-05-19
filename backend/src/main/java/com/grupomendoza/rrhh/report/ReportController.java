package com.grupomendoza.rrhh.report;

import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.report.dto.AttendanceReportRow;
import com.grupomendoza.rrhh.report.dto.EmployeeReportRow;
import com.grupomendoza.rrhh.report.dto.ExpiringContractReportRow;
import com.grupomendoza.rrhh.report.dto.RequestReportRow;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    private static final MediaType EXCEL_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<EmployeeReportRow>>> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long positionId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getEmployeeReport(search, status, siteId, areaId, positionId)
        ));
    }

    @GetMapping("/employees/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) Long positionId
    ) {
        return excelResponse(
                reportService.exportEmployeeReport(search, status, siteId, areaId, positionId),
                "reporte-empleados.xlsx"
        );
    }

    @GetMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<AttendanceReportRow>>> getAttendance(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long areaId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getAttendanceReport(currentUser, startDate, endDate, status, employeeId, siteId, areaId)
        ));
    }

    @GetMapping("/attendance/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<byte[]> exportAttendance(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long areaId
    ) {
        return excelResponse(
                reportService.exportAttendanceReport(currentUser, startDate, endDate, status, employeeId, siteId, areaId),
                "reporte-asistencia.xlsx"
        );
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<RequestReportRow>>> getRequests(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String requestStatus,
            @RequestParam(required = false) String requestGroup,
            @RequestParam(required = false) Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getRequestReport(currentUser, startDate, endDate, requestStatus, requestGroup, employeeId)
        ));
    }

    @GetMapping("/requests/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<byte[]> exportRequests(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String requestStatus,
            @RequestParam(required = false) String requestGroup,
            @RequestParam(required = false) Long employeeId
    ) {
        return excelResponse(
                reportService.exportRequestReport(currentUser, startDate, endDate, requestStatus, requestGroup, employeeId),
                "reporte-solicitudes.xlsx"
        );
    }

    @GetMapping("/contracts/expiring")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<ExpiringContractReportRow>>> getExpiringContracts(
            @RequestParam(required = false) Integer thresholdDays,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long areaId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getExpiringContractReport(thresholdDays, siteId, areaId)
        ));
    }

    @GetMapping("/contracts/expiring/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> exportExpiringContracts(
            @RequestParam(required = false) Integer thresholdDays,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long areaId
    ) {
        return excelResponse(
                reportService.exportExpiringContractReport(thresholdDays, siteId, areaId),
                "reporte-contratos-por-vencer.xlsx"
        );
    }

    private ResponseEntity<byte[]> excelResponse(byte[] data, String fileName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(EXCEL_MEDIA_TYPE);
        headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());
        headers.setContentLength(data.length);
        return ResponseEntity.ok()
                .headers(headers)
                .body(data);
    }
}
