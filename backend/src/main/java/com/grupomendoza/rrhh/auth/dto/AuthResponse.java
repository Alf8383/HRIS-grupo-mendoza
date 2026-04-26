package com.grupomendoza.rrhh.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        CurrentUserResponse user
) {
}
