package com.grupomendoza.rrhh.site.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SiteRequest(
        @NotBlank(message = "Site name is required.")
        @Size(max = 120, message = "Site name must be at most 120 characters.")
        String name,

        @Size(max = 255, message = "Description must be at most 255 characters.")
        String description
) {
}
