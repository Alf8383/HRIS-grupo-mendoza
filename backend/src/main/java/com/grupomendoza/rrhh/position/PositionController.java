package com.grupomendoza.rrhh.position;

import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.position.dto.PositionRequest;
import com.grupomendoza.rrhh.position.dto.PositionResponse;
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
@RequestMapping("/api/v1/positions")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class PositionController {
    private final PositionService positionService;

    public PositionController(PositionService positionService) {
        this.positionService = positionService;
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
    public ResponseEntity<ApiResponse<PositionResponse>> create(@Valid @RequestBody PositionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(positionService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PositionResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PositionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(positionService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PositionResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(positionService.updateStatus(id, request.status())));
    }
}
