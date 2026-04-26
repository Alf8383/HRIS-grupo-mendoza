package com.grupomendoza.rrhh.auth.dto;

import java.util.Set;

public record CurrentUserResponse(
        Long id,
        String name,
        String email,
        Set<String> roles,
        String status
) {
}
