package com.grupomendoza.rrhh.report.dto;

public record RequestReportRow(
        String sourceGroup,
        Long requestId,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        String areaName,
        String positionName,
        String siteName,
        String requestType,
        String requestStatus,
        String startValue,
        String endValue,
        String reasonOrObservation,
        String reviewedByName,
        String reviewComment,
        String createdAt
) {
}
