package com.grupomendoza.rrhh.common.api;

public final class SearchQuery {
    private SearchQuery() {
    }

    public static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim().toLowerCase();
        return trimmed.isBlank() ? null : trimmed;
    }

    public static <T extends Enum<T>> T parseEnum(String value, Class<T> enumType) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid value for " + enumType.getSimpleName() + ": " + value);
        }
    }
}
