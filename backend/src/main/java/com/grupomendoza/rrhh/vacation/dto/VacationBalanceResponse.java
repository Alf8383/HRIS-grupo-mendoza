package com.grupomendoza.rrhh.vacation.dto;

public record VacationBalanceResponse(
        Long employeeId,
        String employeeName,
        Integer availableDays,
        Integer usedDays,
        Integer pendingDays,
        String notes
) {
}
