package com.grupomendoza.rrhh.employee.dto;

import java.time.LocalDate;

public record EmployeeListItemResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String role,
        String roleLabel,
        String dni,
        String biometricCode,
        String phone,
        LocalDate hireDate,
        String areaName,
        String positionName,
        String siteName,
        String status
) {
}
