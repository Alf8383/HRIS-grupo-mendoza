package com.grupomendoza.rrhh.contract.dto;

import java.time.LocalDate;

public record ContractResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        String areaName,
        String positionName,
        String siteName,
        String contractType,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        String notes,
        Long previousContractId,
        Long documentCount
) {
}
