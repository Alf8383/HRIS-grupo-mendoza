package com.grupomendoza.rrhh.user;

import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.common.api.StatusUpdateRequest;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.user.dto.CreateUserRequest;
import com.grupomendoza.rrhh.user.dto.UpdateUserRequest;
import com.grupomendoza.rrhh.user.dto.UserDetailResponse;
import com.grupomendoza.rrhh.user.dto.UserListItemResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserService userService;
    private final AuditService auditService;

    public UserController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserListItemResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.list(search, status, role)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDetailResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateUserRequest request
    ) {
        UserDetailResponse response = userService.create(request);
        auditService.record(currentUser, "USER", "CREATE", "USER", response.id(), "Usuario creado: " + response.email());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        UserDetailResponse response = userService.update(id, request);
        auditService.record(currentUser, "USER", "UPDATE", "USER", response.id(), "Usuario actualizado: " + response.email());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserDetailResponse>> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        UserDetailResponse response = userService.updateStatus(id, request.status());
        auditService.record(
                currentUser,
                "USER",
                "ACTIVE".equalsIgnoreCase(response.status()) ? "ACTIVATE" : "DEACTIVATE",
                "USER",
                response.id(),
                "Estado de usuario actualizado a " + response.status() + ": " + response.email()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
