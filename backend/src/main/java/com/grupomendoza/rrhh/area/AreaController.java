package com.grupomendoza.rrhh.area;

import com.grupomendoza.rrhh.area.dto.AreaRequest;
import com.grupomendoza.rrhh.area.dto.AreaResponse;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
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
@RequestMapping("/api/v1/areas")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AreaController {
    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
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
    public ResponseEntity<ApiResponse<AreaResponse>> create(@Valid @RequestBody AreaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(areaService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AreaResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AreaRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(areaService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AreaResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(areaService.updateStatus(id, request.status())));
    }
}
