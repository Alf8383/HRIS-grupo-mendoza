package com.grupomendoza.rrhh.common.api;

import java.util.Map;

public record ApiError(
        String code,
        String message,
        Map<String, ?> details
) {
}
