package com.grupomendoza.rrhh.attendance.dto;

public record ZktecoImportErrorResponse(
        int rowNumber,
        String message
) {
}
