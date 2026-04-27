package com.grupomendoza.rrhh.attendance.dto;

import java.time.Instant;
import java.time.LocalDate;

public record AttendanceSummaryItemResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        String areaName,
        String positionName,
        String siteName,
        LocalDate attendanceDate,
        Instant checkInAt,
        Instant checkOutAt,
        String status,
        Integer lateMinutes,
        String source,
        String notes,
        String justificationNote,
        String justifiedByName,
        Instant justifiedAt
) {
}
