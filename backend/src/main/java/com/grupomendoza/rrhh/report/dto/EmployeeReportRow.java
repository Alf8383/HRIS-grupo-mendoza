package com.grupomendoza.rrhh.report.dto;

import java.time.LocalDate;

public record EmployeeReportRow(
        Long employeeId,
        String fullName,
        String email,
        String role,
        String dni,
        String biometricCode,
        String phone,
        LocalDate hireDate,
        String areaName,
        String positionName,
        String siteName,
        String employeeStatus
) {
}
