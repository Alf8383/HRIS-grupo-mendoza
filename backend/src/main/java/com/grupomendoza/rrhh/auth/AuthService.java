package com.grupomendoza.rrhh.auth;

import com.grupomendoza.rrhh.auth.dto.AuthResponse;
import com.grupomendoza.rrhh.auth.dto.CurrentUserResponse;
import com.grupomendoza.rrhh.auth.dto.LoginRequest;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return new AuthResponse(
                jwtService.generateToken(user),
                "Bearer",
                jwtService.getExpirationMs(),
                toCurrentUser(user)
        );
    }

    public CurrentUserResponse currentUser(AuthenticatedUser user) {
        return toCurrentUser(user);
    }

    private CurrentUserResponse toCurrentUser(AuthenticatedUser user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getRoles(),
                user.getStatus().name()
        );
    }
}
