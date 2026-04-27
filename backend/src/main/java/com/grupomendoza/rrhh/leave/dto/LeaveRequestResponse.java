package com.grupomendoza.rrhh.leave.dto;

import java.time.Instant;
import java.time.LocalDateTime;

public record LeaveRequestResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        String areaName,
        String positionName,
        String siteName,
        String requestType,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String reason,
        String status,
        String reviewedByName,
        Instant reviewedAt,
        String reviewComment,
        Instant createdAt
) {
}
