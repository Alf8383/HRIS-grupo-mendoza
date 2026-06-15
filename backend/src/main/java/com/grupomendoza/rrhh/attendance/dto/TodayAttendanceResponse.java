package com.grupomendoza.rrhh.attendance.dto;

import java.time.Instant;
import java.time.LocalDate;

public record TodayAttendanceResponse(
        LocalDate attendanceDate,
        boolean recorded,
        Long id,
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
