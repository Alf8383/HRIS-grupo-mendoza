package com.grupomendoza.rrhh.leave;

import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.leave.dto.CreateLeaveRequest;
import com.grupomendoza.rrhh.leave.dto.LeaveRequestResponse;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaveRequestService {
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository
    ) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LeaveRequestResponse create(AuthenticatedUser currentUser, CreateLeaveRequest request) {
        Employee employee = requireCurrentEmployee(currentUser);
        ensureActive(employee);
        validateRange(request.startAt(), request.endAt());

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setRequestType(SearchQuery.parseEnum(request.requestType(), LeaveRequestType.class));
        leaveRequest.setStartAt(request.startAt());
        leaveRequest.setEndAt(request.endAt());
        leaveRequest.setReason(request.reason().trim());
        leaveRequest.setStatus(LeaveRequestStatus.PENDING);

        return toResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> listOwn(
            AuthenticatedUser currentUser,
            String status,
            String requestType,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        Employee employee = requireCurrentEmployee(currentUser);
        LeaveRequestStatus parsedStatus = SearchQuery.parseEnum(status, LeaveRequestStatus.class);
        LeaveRequestType parsedType = SearchQuery.parseEnum(requestType, LeaveRequestType.class);

        return leaveRequestRepository.findOwn(employee.getId()).stream()
                .filter(leaveRequest -> matchesFilters(leaveRequest, parsedStatus, parsedType, startDate, endDate))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> listTeam(
            AuthenticatedUser currentUser,
            String status,
            String requestType,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        Employee managerEmployee = requireCurrentEmployee(currentUser);
        LeaveRequestStatus parsedStatus = SearchQuery.parseEnum(status, LeaveRequestStatus.class);
        LeaveRequestType parsedType = SearchQuery.parseEnum(requestType, LeaveRequestType.class);

        return leaveRequestRepository.search(managerEmployee.getPosition().getArea().getId(), managerEmployee.getId()).stream()
                .filter(leaveRequest -> matchesFilters(leaveRequest, parsedStatus, parsedType, startDate, endDate))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> listAll(
            String status,
            String requestType,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        LeaveRequestStatus parsedStatus = SearchQuery.parseEnum(status, LeaveRequestStatus.class);
        LeaveRequestType parsedType = SearchQuery.parseEnum(requestType, LeaveRequestType.class);

        return leaveRequestRepository.search(null, null).stream()
                .filter(leaveRequest -> matchesFilters(leaveRequest, parsedStatus, parsedType, startDate, endDate))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LeaveRequestResponse approve(AuthenticatedUser currentUser, Long id, String reviewComment) {
        LeaveRequest leaveRequest = findDetailed(id);
        validateReviewPermission(currentUser, leaveRequest);
        applyReview(currentUser, leaveRequest, LeaveRequestStatus.APPROVED, reviewComment);
        return toResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestResponse reject(AuthenticatedUser currentUser, Long id, String reviewComment) {
        LeaveRequest leaveRequest = findDetailed(id);
        validateReviewPermission(currentUser, leaveRequest);
        applyReview(currentUser, leaveRequest, LeaveRequestStatus.REJECTED, reviewComment);
        return toResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestResponse cancel(AuthenticatedUser currentUser, Long id) {
        LeaveRequest leaveRequest = findDetailed(id);
        Employee employee = requireCurrentEmployee(currentUser);

        if (!leaveRequest.getEmployee().getId().equals(employee.getId())) {
            throw new IllegalStateException("You can only cancel your own leave requests.");
        }

        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending leave requests can be cancelled.");
        }

        leaveRequest.setStatus(LeaveRequestStatus.CANCELLED);
        leaveRequest.setReviewedByUser(null);
        leaveRequest.setReviewedAt(null);
        leaveRequest.setReviewComment(null);

        return toResponse(leaveRequestRepository.save(leaveRequest));
    }

    private LeaveRequest findDetailed(Long id) {
        return leaveRequestRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Leave request not found."));
    }

    private Employee requireCurrentEmployee(AuthenticatedUser currentUser) {
        return employeeRepository.findDetailedByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalStateException("Current user is not linked to an employee profile."));
    }

    private User requireCurrentUserEntity(AuthenticatedUser currentUser) {
        return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));
    }

    private void ensureActive(Employee employee) {
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Inactive employees cannot create leave requests.");
        }
    }

    private void validateRange(LocalDateTime startAt, LocalDateTime endAt) {
        if (!endAt.isAfter(startAt)) {
            throw new IllegalArgumentException("End date and time must be later than start date and time.");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
    }

    private void validateReviewPermission(AuthenticatedUser currentUser, LeaveRequest leaveRequest) {
        if (leaveRequest.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending leave requests can be reviewed.");
        }

        if (leaveRequest.getEmployee().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You cannot review your own leave request.");
        }

        if (currentUser.getRoles().contains("ADMIN")) {
            return;
        }

        Employee managerEmployee = requireCurrentEmployee(currentUser);
        Long managerAreaId = managerEmployee.getPosition().getArea().getId();
        Long requestAreaId = leaveRequest.getEmployee().getPosition().getArea().getId();

        if (!managerAreaId.equals(requestAreaId)) {
            throw new IllegalStateException("Managers can only review requests from their own area.");
        }
    }

    private void applyReview(
            AuthenticatedUser currentUser,
            LeaveRequest leaveRequest,
            LeaveRequestStatus nextStatus,
            String reviewComment
    ) {
        leaveRequest.setStatus(nextStatus);
        leaveRequest.setReviewedByUser(requireCurrentUserEntity(currentUser));
        leaveRequest.setReviewedAt(Instant.now());
        leaveRequest.setReviewComment(reviewComment.trim());
    }

    private boolean matchesFilters(
            LeaveRequest leaveRequest,
            LeaveRequestStatus status,
            LeaveRequestType requestType,
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (status != null && leaveRequest.getStatus() != status) {
            return false;
        }

        if (requestType != null && leaveRequest.getRequestType() != requestType) {
            return false;
        }

        LocalDate requestStartDate = leaveRequest.getStartAt().toLocalDate();
        LocalDate requestEndDate = leaveRequest.getEndAt().toLocalDate();

        if (startDate != null && requestEndDate.isBefore(startDate)) {
            return false;
        }

        if (endDate != null && requestStartDate.isAfter(endDate)) {
            return false;
        }

        return true;
    }

    private LeaveRequestResponse toResponse(LeaveRequest leaveRequest) {
        return new LeaveRequestResponse(
                leaveRequest.getId(),
                leaveRequest.getEmployee().getId(),
                leaveRequest.getEmployee().getUser().getFullName(),
                leaveRequest.getEmployee().getUser().getEmail(),
                leaveRequest.getEmployee().getPosition().getArea().getName(),
                leaveRequest.getEmployee().getPosition().getName(),
                leaveRequest.getEmployee().getSite().getName(),
                leaveRequest.getRequestType().name(),
                leaveRequest.getStartAt(),
                leaveRequest.getEndAt(),
                leaveRequest.getReason(),
                leaveRequest.getStatus().name(),
                leaveRequest.getReviewedByUser() != null ? leaveRequest.getReviewedByUser().getFullName() : null,
                leaveRequest.getReviewedAt(),
                leaveRequest.getReviewComment(),
                leaveRequest.getCreatedAt()
        );
    }
}
