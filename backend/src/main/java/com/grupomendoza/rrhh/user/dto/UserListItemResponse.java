package com.grupomendoza.rrhh.user.dto;

public record UserListItemResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String roleLabel,
        String status,
        boolean linkedEmployee
) {
}
