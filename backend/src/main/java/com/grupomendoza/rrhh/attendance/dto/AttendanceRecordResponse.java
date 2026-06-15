package com.grupomendoza.rrhh.attendance.dto;

import java.time.Instant;
import java.time.LocalDate;

public record AttendanceRecordResponse(
        Long id,
        LocalDate attendanceDate,
        Instant checkInAt,
        Instant checkOutAt,
        String status,
        Integer lateMinutes,
        Integer workedMinutes,
        Integer extraMinutes,
        String source,
        String notes,
        String justificationNote,
        String justifiedByName,
        Instant justifiedAt
) {
}
