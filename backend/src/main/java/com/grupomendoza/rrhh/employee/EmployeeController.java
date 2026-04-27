package com.grupomendoza.rrhh.employee;

import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.employee.dto.CreateEmployeeRequest;
import com.grupomendoza.rrhh.employee.dto.EmployeeDetailResponse;
import com.grupomendoza.rrhh.employee.dto.EmployeeListItemResponse;
import com.grupomendoza.rrhh.employee.dto.UpdateEmployeeRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
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
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.updateStatus(id, request.status())));
    }
}
