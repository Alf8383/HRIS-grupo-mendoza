package com.grupomendoza.rrhh.common.api;

import jakarta.validation.constraints.NotBlank;

public record StatusUpdateRequest(
        @NotBlank(message = "Status is required.")
        String status
) {
}
