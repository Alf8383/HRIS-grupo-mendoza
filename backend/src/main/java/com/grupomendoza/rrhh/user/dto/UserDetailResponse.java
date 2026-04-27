package com.grupomendoza.rrhh.user.dto;

public record UserDetailResponse(
        Long id,
        String fullName,
        String email,
        String role,
        String roleLabel,
        String status,
        UserEmployeeSummaryResponse employee
) {
}
