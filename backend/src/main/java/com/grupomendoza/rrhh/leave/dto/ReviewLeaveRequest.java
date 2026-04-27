package com.grupomendoza.rrhh.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewLeaveRequest(
        @NotBlank(message = "Review comment is required.")
        @Size(max = 500, message = "Review comment can contain up to 500 characters.")
        String reviewComment
) {
}
