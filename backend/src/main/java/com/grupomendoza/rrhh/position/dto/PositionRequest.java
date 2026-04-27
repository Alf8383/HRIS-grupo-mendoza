package com.grupomendoza.rrhh.position.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PositionRequest(
        @NotBlank(message = "Position name is required.")
        @Size(max = 120, message = "Position name must be at most 120 characters.")
        String name,

        @Size(max = 255, message = "Description must be at most 255 characters.")
        String description,

        @NotNull(message = "Area is required.")
        Long areaId
) {
}
