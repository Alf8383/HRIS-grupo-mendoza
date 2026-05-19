package com.grupomendoza.rrhh.vacation;

import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.vacation.dto.CreateVacationRequest;
import com.grupomendoza.rrhh.vacation.dto.ReviewVacationRequest;
import com.grupomendoza.rrhh.vacation.dto.UpdateVacationBalanceRequest;
import com.grupomendoza.rrhh.vacation.dto.VacationBalanceResponse;
import com.grupomendoza.rrhh.vacation.dto.VacationRequestResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vacations")
public class VacationController {
    private final VacationService vacationService;
    private final AuditService auditService;

    public VacationController(VacationService vacationService, AuditService auditService) {
        this.vacationService = vacationService;
        this.auditService = auditService;
    }

    @GetMapping("/balance/me")
    @PreAuthorize("hasAnyRole('MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<VacationBalanceResponse>> getOwnBalance(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(vacationService.getOwnBalance(currentUser)));
    }

    @GetMapping("/balance/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<VacationBalanceResponse>> getBalance(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(vacationService.getBalance(employeeId)));
    }

    @PutMapping("/balance/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<VacationBalanceResponse>> updateBalance(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long employeeId,
            @Valid @RequestBody UpdateVacationBalanceRequest request
    ) {
        VacationBalanceResponse response = vacationService.updateBalance(employeeId, request);
        auditService.record(currentUser, "VACATION", "UPDATE_BALANCE", "VACATION_BALANCE", response.employeeId(), "Saldo de vacaciones actualizado para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<VacationRequestResponse>> createRequest(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateVacationRequest request
    ) {
        VacationRequestResponse response = vacationService.createRequest(currentUser, request);
        auditService.record(currentUser, "VACATION", "CREATE", "VACATION_REQUEST", response.id(), "Solicitud de vacaciones creada para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/requests/my")
    @PreAuthorize("hasAnyRole('MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<VacationRequestResponse>>> listOwn(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(vacationService.listOwn(currentUser, status, startDate, endDate)));
    }

    @GetMapping("/requests/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<VacationRequestResponse>>> listTeam(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(vacationService.listTeam(currentUser, status, startDate, endDate)));
    }

    @GetMapping("/requests/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<VacationRequestResponse>>> listAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(vacationService.listAll(status, startDate, endDate)));
    }

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<VacationRequestResponse>> approve(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewVacationRequest request
    ) {
        VacationRequestResponse response = vacationService.approve(currentUser, id, request.reviewComment());
        auditService.record(currentUser, "VACATION", "APPROVE", "VACATION_REQUEST", response.id(), "Solicitud de vacaciones aprobada para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<VacationRequestResponse>> reject(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewVacationRequest request
    ) {
        VacationRequestResponse response = vacationService.reject(currentUser, id, request.reviewComment());
        auditService.record(currentUser, "VACATION", "REJECT", "VACATION_REQUEST", response.id(), "Solicitud de vacaciones rechazada para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
