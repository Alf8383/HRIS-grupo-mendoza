package com.grupomendoza.rrhh.report.dto;

import java.time.Instant;
import java.time.LocalDate;

public record AttendanceReportRow(
        Long recordId,
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
        Integer workedMinutes,
        Integer extraMinutes,
        String source,
        String notes,
        String justificationNote
) {
}
