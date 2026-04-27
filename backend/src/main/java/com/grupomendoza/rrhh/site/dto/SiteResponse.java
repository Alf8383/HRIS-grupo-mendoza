package com.grupomendoza.rrhh.site.dto;

public record SiteResponse(
        Long id,
        String name,
        String description,
        String status
) {
}
