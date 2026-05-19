package com.grupomendoza.rrhh.vacation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateVacationBalanceRequest(
        @NotNull(message = "Available days are required.")
        @Min(value = 0, message = "Available days cannot be negative.")
        Integer availableDays,
        @NotNull(message = "Used days are required.")
        @Min(value = 0, message = "Used days cannot be negative.")
        Integer usedDays,
        @NotNull(message = "Pending days are required.")
        @Min(value = 0, message = "Pending days cannot be negative.")
        Integer pendingDays,
        @Size(max = 500, message = "Notes can contain up to 500 characters.")
        String notes
) {
}
