package com.grupomendoza.rrhh.site;

import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.site.dto.SiteRequest;
import com.grupomendoza.rrhh.site.dto.SiteResponse;
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
@RequestMapping("/api/v1/sites")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class SiteController {
    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
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
    public ResponseEntity<ApiResponse<SiteResponse>> create(@Valid @RequestBody SiteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(siteService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SiteResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody SiteRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(siteService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SiteResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(siteService.updateStatus(id, request.status())));
    }
}
