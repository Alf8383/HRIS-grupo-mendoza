package com.grupomendoza.rrhh.position.dto;

import com.grupomendoza.rrhh.area.dto.AreaResponse;

public record PositionResponse(
        Long id,
        String name,
        String description,
        String status,
        AreaResponse area
) {
}
