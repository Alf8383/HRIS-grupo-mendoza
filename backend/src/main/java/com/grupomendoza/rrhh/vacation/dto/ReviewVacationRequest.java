package com.grupomendoza.rrhh.vacation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewVacationRequest(
        @NotBlank(message = "Review comment is required.")
        @Size(max = 500, message = "Review comment can contain up to 500 characters.")
        String reviewComment
) {
}
