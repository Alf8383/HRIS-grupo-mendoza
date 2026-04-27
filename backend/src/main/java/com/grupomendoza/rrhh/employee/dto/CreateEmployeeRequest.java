package com.grupomendoza.rrhh.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateEmployeeRequest(
        @NotBlank(message = "DNI is required.")
        @Size(max = 20, message = "DNI must be at most 20 characters.")
        String dni,

        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must be at most 120 characters.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be valid.")
        @Size(max = 150, message = "Email must be at most 150 characters.")
        String email,

        @Size(max = 30, message = "Phone must be at most 30 characters.")
        String phone,

        @NotNull(message = "Hire date is required.")
        LocalDate hireDate,

        @NotNull(message = "Position is required.")
        Long positionId,

        @NotNull(message = "Site is required.")
        Long siteId,

        @NotNull(message = "Role is required.")
        String role,

        @NotBlank(message = "Temporary password is required.")
        @Size(min = 8, max = 120, message = "Password must be between 8 and 120 characters.")
        String password
) {
}
