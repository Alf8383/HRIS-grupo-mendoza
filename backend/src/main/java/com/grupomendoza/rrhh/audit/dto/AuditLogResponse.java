package com.grupomendoza.rrhh.audit.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        Instant eventAt,
        Long userId,
        String userEmail,
        String module,
        String action,
        String entityType,
        Long entityId,
        String summary
) {
}
