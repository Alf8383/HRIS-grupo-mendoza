package com.grupomendoza.rrhh.area;

import com.grupomendoza.rrhh.area.dto.AreaRequest;
import com.grupomendoza.rrhh.area.dto.AreaResponse;
import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
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
@RequestMapping("/api/v1/areas")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AreaController {
    private final AreaService areaService;
    private final AuditService auditService;

    public AreaController(AreaService areaService, AuditService auditService) {
        this.areaService = areaService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AreaResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(areaService.list(search, status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AreaResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(areaService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AreaResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody AreaRequest request
    ) {
        AreaResponse response = areaService.create(request);
        auditService.record(currentUser, "AREA", "CREATE", "AREA", response.id(), "Área creada: " + response.name());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AreaResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody AreaRequest request
    ) {
        AreaResponse response = areaService.update(id, request);
        auditService.record(currentUser, "AREA", "UPDATE", "AREA", response.id(), "Área actualizada: " + response.name());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AreaResponse>> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        AreaResponse response = areaService.updateStatus(id, request.status());
        auditService.record(
                currentUser,
                "AREA",
                "ACTIVE".equalsIgnoreCase(response.status()) ? "ACTIVATE" : "DEACTIVATE",
                "AREA",
                response.id(),
                "Estado de área actualizado a " + response.status() + ": " + response.name()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
