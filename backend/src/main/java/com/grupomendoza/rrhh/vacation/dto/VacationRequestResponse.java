package com.grupomendoza.rrhh.vacation.dto;

import java.time.Instant;
import java.time.LocalDate;

public record VacationRequestResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        String areaName,
        String positionName,
        String siteName,
        LocalDate startDate,
        LocalDate endDate,
        Integer requestedDays,
        String observation,
        String status,
        String reviewedByName,
        Instant reviewedAt,
        String reviewComment,
        Instant createdAt
) {
}
