package com.grupomendoza.rrhh.contract.dto;

import java.time.LocalDate;

public record ExpiringContractResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String areaName,
        String positionName,
        String contractType,
        LocalDate endDate,
        long daysUntilExpiration
) {
}
