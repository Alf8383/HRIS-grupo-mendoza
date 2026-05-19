package com.grupomendoza.rrhh.report.dto;

import java.time.LocalDate;

public record ExpiringContractReportRow(
        Long contractId,
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
        Long daysUntilExpiration
) {
}
