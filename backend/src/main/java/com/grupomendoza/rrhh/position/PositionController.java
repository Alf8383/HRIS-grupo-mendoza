package com.grupomendoza.rrhh.position;

import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.position.dto.PositionRequest;
import com.grupomendoza.rrhh.position.dto.PositionResponse;
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
@RequestMapping("/api/v1/positions")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class PositionController {
    private final PositionService positionService;
    private final AuditService auditService;

    public PositionController(PositionService positionService, AuditService auditService) {
        this.positionService = positionService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PositionResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long areaId
    ) {
        return ResponseEntity.ok(ApiResponse.success(positionService.list(search, status, areaId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(positionService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PositionResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody PositionRequest request
    ) {
        PositionResponse response = positionService.create(request);
        auditService.record(currentUser, "POSITION", "CREATE", "POSITION", response.id(), "Cargo creado: " + response.name());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody PositionRequest request
    ) {
        PositionResponse response = positionService.update(id, request);
        auditService.record(currentUser, "POSITION", "UPDATE", "POSITION", response.id(), "Cargo actualizado: " + response.name());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PositionResponse>> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        PositionResponse response = positionService.updateStatus(id, request.status());
        auditService.record(
                currentUser,
                "POSITION",
                "ACTIVE".equalsIgnoreCase(response.status()) ? "ACTIVATE" : "DEACTIVATE",
                "POSITION",
                response.id(),
                "Estado de cargo actualizado a " + response.status() + ": " + response.name()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
