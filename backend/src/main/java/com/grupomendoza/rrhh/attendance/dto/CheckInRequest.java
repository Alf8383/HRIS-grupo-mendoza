package com.grupomendoza.rrhh.attendance.dto;

import jakarta.validation.constraints.Size;

public record CheckInRequest(
        @Size(max = 500, message = "Notes can contain up to 500 characters.")
        String notes
) {
}
