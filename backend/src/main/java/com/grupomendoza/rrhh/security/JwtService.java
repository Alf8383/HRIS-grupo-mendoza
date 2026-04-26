package com.grupomendoza.rrhh.security;

import com.grupomendoza.rrhh.config.AppJwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final AppJwtProperties appJwtProperties;

    public JwtService(AppJwtProperties appJwtProperties) {
        this.appJwtProperties = appJwtProperties;
    }

    public String generateToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(appJwtProperties.getExpirationMs());

        return Jwts.builder()
                .subject(user.getUsername())
                .claims(Map.of(
                        "name", user.getFullName(),
                        "roles", user.getRoles()
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, AuthenticatedUser user) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equalsIgnoreCase(user.getUsername())
                && claims.getExpiration().after(new Date());
    }

    public long getExpirationMs() {
        return appJwtProperties.getExpirationMs();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] secretBytes = appJwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (appJwtProperties.getSecret().matches("^[A-Za-z0-9+/=]+$") && appJwtProperties.getSecret().length() > 43) {
            try {
                secretBytes = Decoders.BASE64.decode(appJwtProperties.getSecret());
            } catch (IllegalArgumentException ignored) {
                secretBytes = appJwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
            }
        }
        return Keys.hmacShaKeyFor(secretBytes);
    }
}
