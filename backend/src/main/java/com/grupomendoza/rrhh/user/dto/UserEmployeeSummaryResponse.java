package com.grupomendoza.rrhh.user.dto;

public record UserEmployeeSummaryResponse(
        Long employeeId,
        String dni,
        String positionName,
        String areaName,
        String siteName,
        String status
) {
}
