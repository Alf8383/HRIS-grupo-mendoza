package com.grupomendoza.rrhh.audit;

import com.grupomendoza.rrhh.audit.dto.AuditLogResponse;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasAnyRole('ADMIN', 'HR')")
public class AuditController {
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> list(
            @RequestParam(required = false) String userSearch,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                auditService.list(userSearch, module, action, startDate, endDate)
        ));
    }
}
