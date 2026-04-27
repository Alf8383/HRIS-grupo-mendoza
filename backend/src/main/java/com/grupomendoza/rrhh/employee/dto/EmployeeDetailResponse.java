package com.grupomendoza.rrhh.employee.dto;

import java.time.LocalDate;

public record EmployeeDetailResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String role,
        String roleLabel,
        String dni,
        String phone,
        LocalDate hireDate,
        Long areaId,
        String areaName,
        Long positionId,
        String positionName,
        Long siteId,
        String siteName,
        String employeeStatus,
        String userStatus
) {
}
