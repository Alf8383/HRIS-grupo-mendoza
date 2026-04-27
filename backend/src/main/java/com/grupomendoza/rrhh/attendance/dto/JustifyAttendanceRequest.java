package com.grupomendoza.rrhh.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JustifyAttendanceRequest(
        @NotBlank(message = "Justification note is required.")
        @Size(max = 500, message = "Justification can contain up to 500 characters.")
        String justificationNote
) {
}
