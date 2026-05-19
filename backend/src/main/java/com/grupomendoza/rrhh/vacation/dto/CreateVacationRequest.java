package com.grupomendoza.rrhh.vacation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateVacationRequest(
        @NotNull(message = "Start date is required.")
        LocalDate startDate,
        @NotNull(message = "End date is required.")
        LocalDate endDate,
        @Size(max = 500, message = "Observation can contain up to 500 characters.")
        String observation
) {
}
