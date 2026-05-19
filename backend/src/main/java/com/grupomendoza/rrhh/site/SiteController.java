package com.grupomendoza.rrhh.site;

import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.site.dto.SiteRequest;
import com.grupomendoza.rrhh.site.dto.SiteResponse;
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
@RequestMapping("/api/v1/sites")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class SiteController {
    private final SiteService siteService;
    private final AuditService auditService;

    public SiteController(SiteService siteService, AuditService auditService) {
        this.siteService = siteService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SiteResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(siteService.list(search, status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SiteResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(siteService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SiteResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody SiteRequest request
    ) {
        SiteResponse response = siteService.create(request);
        auditService.record(currentUser, "SITE", "CREATE", "SITE", response.id(), "Sede creada: " + response.name());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SiteResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody SiteRequest request
    ) {
        SiteResponse response = siteService.update(id, request);
        auditService.record(currentUser, "SITE", "UPDATE", "SITE", response.id(), "Sede actualizada: " + response.name());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SiteResponse>> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        SiteResponse response = siteService.updateStatus(id, request.status());
        auditService.record(
                currentUser,
                "SITE",
                "ACTIVE".equalsIgnoreCase(response.status()) ? "ACTIVATE" : "DEACTIVATE",
                "SITE",
                response.id(),
                "Estado de sede actualizado a " + response.status() + ": " + response.name()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
