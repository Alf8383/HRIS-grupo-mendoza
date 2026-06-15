package com.grupomendoza.rrhh.attendance;

import com.grupomendoza.rrhh.attendance.dto.AttendanceRecordResponse;
import com.grupomendoza.rrhh.attendance.dto.AttendanceSummaryItemResponse;
import com.grupomendoza.rrhh.attendance.dto.CheckInRequest;
import com.grupomendoza.rrhh.attendance.dto.CheckOutRequest;
import com.grupomendoza.rrhh.attendance.dto.CloseDayRequest;
import com.grupomendoza.rrhh.attendance.dto.JustifyAttendanceRequest;
import com.grupomendoza.rrhh.attendance.dto.TodayAttendanceResponse;
import com.grupomendoza.rrhh.attendance.dto.ZktecoImportResultResponse;
import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final ZktecoAttendanceImportService zktecoAttendanceImportService;
    private final AuditService auditService;

    public AttendanceController(
            AttendanceService attendanceService,
            ZktecoAttendanceImportService zktecoAttendanceImportService,
            AuditService auditService
    ) {
        this.attendanceService = attendanceService;
        this.zktecoAttendanceImportService = zktecoAttendanceImportService;
        this.auditService = auditService;
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkIn(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody(required = false) CheckInRequest request
    ) {
        AttendanceRecordResponse response = attendanceService.checkIn(
                currentUser,
                request == null ? new CheckInRequest(null) : request
        );
        auditService.record(currentUser, "ATTENDANCE", "CHECK_IN", "ATTENDANCE_RECORD", response.id(), "Entrada registrada para la fecha " + response.attendanceDate());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> checkOut(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody(required = false) CheckOutRequest request
    ) {
        AttendanceRecordResponse response = attendanceService.checkOut(
                currentUser,
                request == null ? new CheckOutRequest(null) : request
        );
        auditService.record(currentUser, "ATTENDANCE", "CHECK_OUT", "ATTENDANCE_RECORD", response.id(), "Salida registrada para la fecha " + response.attendanceDate());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<TodayAttendanceResponse>> getToday(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getToday(currentUser)));
    }

    @GetMapping("/me/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getOwnHistory(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getOwnHistory(currentUser, startDate, endDate)));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<AttendanceSummaryItemResponse>>> getSummary(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long employeeId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                attendanceService.getSummary(currentUser, startDate, endDate, status, employeeId)
        ));
    }

    @PostMapping("/close-day")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<AttendanceSummaryItemResponse>>> closeDay(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CloseDayRequest request
    ) {
        List<AttendanceSummaryItemResponse> response = attendanceService.closeDay(currentUser, request.attendanceDate());
        auditService.record(currentUser, "ATTENDANCE", "CLOSE_DAY", "ATTENDANCE_RECORD", null, "Cierre diario ejecutado para " + request.attendanceDate() + " con " + response.size() + " inasistencia(s).");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/justify")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<AttendanceSummaryItemResponse>> justify(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody JustifyAttendanceRequest request
    ) {
        AttendanceSummaryItemResponse response = attendanceService.justify(currentUser, id, request.justificationNote());
        auditService.record(currentUser, "ATTENDANCE", "JUSTIFY", "ATTENDANCE_RECORD", response.id(), "Registro justificado para " + response.employeeName() + " en " + response.attendanceDate());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/imports/zkteco")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<ZktecoImportResultResponse>> importZkteco(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam("file") MultipartFile file
    ) {
        ZktecoImportResultResponse response = zktecoAttendanceImportService.importFile(file);
        auditService.record(
                currentUser,
                "ATTENDANCE",
                "IMPORT_ZKTECO",
                "ATTENDANCE_RECORD",
                null,
                "Importación ZKTECO completada con " + response.attendanceCreated() + " registro(s) creado(s), "
                        + response.attendanceUpdated() + " actualizado(s) y "
                        + response.employeesCreated() + " empleado(s) creado(s)."
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
