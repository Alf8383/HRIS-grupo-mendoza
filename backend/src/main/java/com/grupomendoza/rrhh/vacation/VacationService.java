package com.grupomendoza.rrhh.vacation;

import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import com.grupomendoza.rrhh.vacation.dto.CreateVacationRequest;
import com.grupomendoza.rrhh.vacation.dto.UpdateVacationBalanceRequest;
import com.grupomendoza.rrhh.vacation.dto.VacationBalanceResponse;
import com.grupomendoza.rrhh.vacation.dto.VacationRequestResponse;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VacationService {
    private final VacationBalanceRepository vacationBalanceRepository;
    private final VacationRequestRepository vacationRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public VacationService(
            VacationBalanceRepository vacationBalanceRepository,
            VacationRequestRepository vacationRequestRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository
    ) {
        this.vacationBalanceRepository = vacationBalanceRepository;
        this.vacationRequestRepository = vacationRequestRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public VacationBalanceResponse getOwnBalance(AuthenticatedUser currentUser) {
        Employee employee = requireCurrentEmployee(currentUser);
        return toBalanceResponse(loadOrCreateBalance(employee));
    }

    @Transactional
    public VacationBalanceResponse getBalance(Long employeeId) {
        Employee employee = findEmployee(employeeId);
        return toBalanceResponse(loadOrCreateBalance(employee));
    }

    @Transactional
    public VacationBalanceResponse updateBalance(Long employeeId, UpdateVacationBalanceRequest request) {
        if (request.availableDays() < request.usedDays() + request.pendingDays()) {
            throw new IllegalArgumentException("Available days cannot be lower than used plus pending days.");
        }

        Employee employee = findEmployee(employeeId);
        VacationBalance balance = loadOrCreateBalance(employee);
        balance.setAvailableDays(request.availableDays());
        balance.setUsedDays(request.usedDays());
        balance.setPendingDays(request.pendingDays());
        balance.setNotes(normalizeNullable(request.notes()));

        return toBalanceResponse(vacationBalanceRepository.save(balance));
    }

    @Transactional
    public VacationRequestResponse createRequest(AuthenticatedUser currentUser, CreateVacationRequest request) {
        Employee employee = requireCurrentEmployee(currentUser);
        ensureActive(employee);
        validateDateRange(request.startDate(), request.endDate());

        VacationBalance balance = loadOrCreateBalance(employee);
        int requestedDays = calculateRequestedDays(request.startDate(), request.endDate());
        int remainingDays = balance.getAvailableDays() - balance.getPendingDays() - balance.getUsedDays();
        if (requestedDays > remainingDays) {
            throw new IllegalStateException("The requested vacation days exceed the available balance.");
        }

        VacationRequest vacationRequest = new VacationRequest();
        vacationRequest.setEmployee(employee);
        vacationRequest.setStartDate(request.startDate());
        vacationRequest.setEndDate(request.endDate());
        vacationRequest.setRequestedDays(requestedDays);
        vacationRequest.setObservation(normalizeNullable(request.observation()));
        vacationRequest.setStatus(VacationRequestStatus.PENDING);

        balance.setPendingDays(balance.getPendingDays() + requestedDays);
        vacationBalanceRepository.save(balance);

        return toRequestResponse(vacationRequestRepository.save(vacationRequest));
    }

    @Transactional(readOnly = true)
    public List<VacationRequestResponse> listOwn(
            AuthenticatedUser currentUser,
            String status,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRangeIfPresent(startDate, endDate);
        Employee employee = requireCurrentEmployee(currentUser);
        VacationRequestStatus parsedStatus = SearchQuery.parseEnum(status, VacationRequestStatus.class);

        return vacationRequestRepository.findOwn(employee.getId()).stream()
                .filter(request -> matchesFilters(request, parsedStatus, startDate, endDate))
                .map(this::toRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VacationRequestResponse> listTeam(
            AuthenticatedUser currentUser,
            String status,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRangeIfPresent(startDate, endDate);
        Employee managerEmployee = requireCurrentEmployee(currentUser);
        VacationRequestStatus parsedStatus = SearchQuery.parseEnum(status, VacationRequestStatus.class);

        return vacationRequestRepository.search(managerEmployee.getPosition().getArea().getId(), managerEmployee.getId()).stream()
                .filter(request -> matchesFilters(request, parsedStatus, startDate, endDate))
                .map(this::toRequestResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<VacationRequestResponse> listAll(String status, LocalDate startDate, LocalDate endDate) {
        validateDateRangeIfPresent(startDate, endDate);
        VacationRequestStatus parsedStatus = SearchQuery.parseEnum(status, VacationRequestStatus.class);

        return vacationRequestRepository.search(null, null).stream()
                .filter(request -> matchesFilters(request, parsedStatus, startDate, endDate))
                .map(this::toRequestResponse)
                .toList();
    }

    @Transactional
    public VacationRequestResponse approve(AuthenticatedUser currentUser, Long id, String reviewComment) {
        VacationRequest vacationRequest = findDetailedRequest(id);
        validateReviewPermission(currentUser, vacationRequest);

        VacationBalance balance = loadOrCreateBalance(vacationRequest.getEmployee());
        balance.setPendingDays(balance.getPendingDays() - vacationRequest.getRequestedDays());
        balance.setUsedDays(balance.getUsedDays() + vacationRequest.getRequestedDays());
        vacationBalanceRepository.save(balance);

        applyReview(vacationRequest, currentUser, VacationRequestStatus.APPROVED, reviewComment);
        return toRequestResponse(vacationRequestRepository.save(vacationRequest));
    }

    @Transactional
    public VacationRequestResponse reject(AuthenticatedUser currentUser, Long id, String reviewComment) {
        VacationRequest vacationRequest = findDetailedRequest(id);
        validateReviewPermission(currentUser, vacationRequest);

        VacationBalance balance = loadOrCreateBalance(vacationRequest.getEmployee());
        balance.setPendingDays(balance.getPendingDays() - vacationRequest.getRequestedDays());
        vacationBalanceRepository.save(balance);

        applyReview(vacationRequest, currentUser, VacationRequestStatus.REJECTED, reviewComment);
        return toRequestResponse(vacationRequestRepository.save(vacationRequest));
    }

    private Employee requireCurrentEmployee(AuthenticatedUser currentUser) {
        return employeeRepository.findDetailedByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalStateException("Current user is not linked to an employee profile."));
    }

    private Employee findEmployee(Long employeeId) {
        return employeeRepository.findDetailedById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found."));
    }

    private User requireCurrentUserEntity(AuthenticatedUser currentUser) {
        return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));
    }

    private VacationBalance loadOrCreateBalance(Employee employee) {
        return vacationBalanceRepository.findDetailedByEmployeeId(employee.getId())
                .orElseGet(() -> {
                    VacationBalance balance = new VacationBalance();
                    balance.setEmployee(employee);
                    balance.setAvailableDays(0);
                    balance.setUsedDays(0);
                    balance.setPendingDays(0);
                    return vacationBalanceRepository.save(balance);
                });
    }

    private VacationRequest findDetailedRequest(Long id) {
        return vacationRequestRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vacation request not found."));
    }

    private void ensureActive(Employee employee) {
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Inactive employees cannot operate vacations.");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
    }

    private void validateDateRangeIfPresent(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
    }

    private int calculateRequestedDays(LocalDate startDate, LocalDate endDate) {
        return Math.toIntExact(ChronoUnit.DAYS.between(startDate, endDate) + 1);
    }

    private boolean matchesFilters(
            VacationRequest request,
            VacationRequestStatus status,
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (status != null && request.getStatus() != status) {
            return false;
        }

        if (startDate != null && request.getEndDate().isBefore(startDate)) {
            return false;
        }

        if (endDate != null && request.getStartDate().isAfter(endDate)) {
            return false;
        }

        return true;
    }

    private void validateReviewPermission(AuthenticatedUser currentUser, VacationRequest vacationRequest) {
        if (vacationRequest.getStatus() != VacationRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending vacation requests can be reviewed.");
        }

        if (vacationRequest.getEmployee().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You cannot review your own vacation request.");
        }

        if (currentUser.getRoles().contains("ADMIN")) {
            return;
        }

        Employee managerEmployee = requireCurrentEmployee(currentUser);
        Long managerAreaId = managerEmployee.getPosition().getArea().getId();
        Long requestAreaId = vacationRequest.getEmployee().getPosition().getArea().getId();

        if (!managerAreaId.equals(requestAreaId)) {
            throw new IllegalStateException("Managers can only review vacation requests from their own area.");
        }
    }

    private void applyReview(
            VacationRequest vacationRequest,
            AuthenticatedUser currentUser,
            VacationRequestStatus nextStatus,
            String reviewComment
    ) {
        vacationRequest.setStatus(nextStatus);
        vacationRequest.setReviewedByUser(requireCurrentUserEntity(currentUser));
        vacationRequest.setReviewedAt(Instant.now());
        vacationRequest.setReviewComment(reviewComment.trim());
    }

    private VacationBalanceResponse toBalanceResponse(VacationBalance balance) {
        return new VacationBalanceResponse(
                balance.getEmployee().getId(),
                balance.getEmployee().getUser().getFullName(),
                balance.getAvailableDays(),
                balance.getUsedDays(),
                balance.getPendingDays(),
                balance.getNotes()
        );
    }

    private VacationRequestResponse toRequestResponse(VacationRequest request) {
        return new VacationRequestResponse(
                request.getId(),
                request.getEmployee().getId(),
                request.getEmployee().getUser().getFullName(),
                request.getEmployee().getUser().getEmail(),
                request.getEmployee().getPosition().getArea().getName(),
                request.getEmployee().getPosition().getName(),
                request.getEmployee().getSite().getName(),
                request.getStartDate(),
                request.getEndDate(),
                request.getRequestedDays(),
                request.getObservation(),
                request.getStatus().name(),
                request.getReviewedByUser() != null ? request.getReviewedByUser().getFullName() : null,
                request.getReviewedAt(),
                request.getReviewComment(),
                request.getCreatedAt()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
