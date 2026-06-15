package com.grupomendoza.rrhh.attendance.dto;

import java.util.List;

public record ZktecoImportResultResponse(
        int rowsRead,
        int attendanceCreated,
        int attendanceUpdated,
        int employeesCreated,
        int rowsSkipped,
        List<ZktecoImportErrorResponse> errors
) {
}
