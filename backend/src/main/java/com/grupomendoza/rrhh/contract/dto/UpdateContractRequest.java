package com.grupomendoza.rrhh.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateContractRequest(
        @NotBlank(message = "Contract type is required.")
        String contractType,
        @NotNull(message = "Start date is required.")
        LocalDate startDate,
        LocalDate endDate,
        @NotBlank(message = "Status is required.")
        String status,
        @Size(max = 500, message = "Notes can contain up to 500 characters.")
        String notes
) {
}
