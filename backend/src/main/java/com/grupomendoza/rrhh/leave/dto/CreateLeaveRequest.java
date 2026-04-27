package com.grupomendoza.rrhh.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record CreateLeaveRequest(
        @NotBlank(message = "Request type is required.")
        String requestType,
        @NotNull(message = "Start date and time are required.")
        LocalDateTime startAt,
        @NotNull(message = "End date and time are required.")
        LocalDateTime endAt,
        @NotBlank(message = "Reason is required.")
        @Size(max = 500, message = "Reason can contain up to 500 characters.")
        String reason
) {
}
