package com.grupomendoza.rrhh.leave;

import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.leave.dto.CreateLeaveRequest;
import com.grupomendoza.rrhh.leave.dto.LeaveRequestResponse;
import com.grupomendoza.rrhh.leave.dto.ReviewLeaveRequest;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/leave-requests")
public class LeaveRequestController {
    private final LeaveRequestService leaveRequestService;

    public LeaveRequestController(LeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateLeaveRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.create(currentUser, request)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> listOwn(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String requestType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.listOwn(currentUser, status, requestType, startDate, endDate)
        ));
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> listTeam(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String requestType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.listTeam(currentUser, status, requestType, startDate, endDate)
        ));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> listAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String requestType,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.listAll(status, requestType, startDate, endDate)
        ));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> approve(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewLeaveRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.approve(currentUser, id, request.reviewComment())));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> reject(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewLeaveRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.reject(currentUser, id, request.reviewComment())));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> cancel(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.cancel(currentUser, id)));
    }
}
