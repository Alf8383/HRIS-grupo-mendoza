package com.grupomendoza.rrhh.employee;

import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.employee.dto.CreateEmployeeRequest;
import com.grupomendoza.rrhh.employee.dto.EmployeeDetailResponse;
import com.grupomendoza.rrhh.employee.dto.EmployeeListItemResponse;
import com.grupomendoza.rrhh.employee.dto.UpdateEmployeeRequest;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class EmployeeController {
    private final EmployeeService employeeService;
    private final AuditService auditService;

    public EmployeeController(EmployeeService employeeService, AuditService auditService) {
        this.employeeService = employeeService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeListItemResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long siteId,
            @RequestParam(required = false) Long positionId
    ) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.list(search, status, siteId, positionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        EmployeeDetailResponse response = employeeService.create(request);
        auditService.record(currentUser, "EMPLOYEE", "CREATE", "EMPLOYEE", response.id(), "Empleado creado: " + response.fullName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        EmployeeDetailResponse response = employeeService.update(id, request);
        auditService.record(currentUser, "EMPLOYEE", "UPDATE", "EMPLOYEE", response.id(), "Empleado actualizado: " + response.fullName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        EmployeeDetailResponse response = employeeService.updateStatus(id, request.status());
        auditService.record(
                currentUser,
                "EMPLOYEE",
                "ACTIVE".equalsIgnoreCase(response.employeeStatus()) ? "ACTIVATE" : "DEACTIVATE",
                "EMPLOYEE",
                response.id(),
                "Estado de empleado actualizado a " + response.employeeStatus() + ": " + response.fullName()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
