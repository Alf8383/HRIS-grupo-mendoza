package com.grupomendoza.rrhh.attendance.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CloseDayRequest(
        @NotNull(message = "Attendance date is required.")
        LocalDate attendanceDate
) {
}
