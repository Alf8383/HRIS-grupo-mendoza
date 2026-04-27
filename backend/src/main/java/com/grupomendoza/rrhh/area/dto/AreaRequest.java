package com.grupomendoza.rrhh.area.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaRequest(
        @NotBlank(message = "Area name is required.")
        @Size(max = 120, message = "Area name must be at most 120 characters.")
        String name,

        @Size(max = 255, message = "Description must be at most 255 characters.")
        String description
) {
}
