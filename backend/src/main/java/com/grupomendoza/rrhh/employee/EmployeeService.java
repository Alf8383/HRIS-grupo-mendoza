package com.grupomendoza.rrhh.employee;

import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.common.roles.RoleLabelMapper;
import com.grupomendoza.rrhh.employee.dto.CreateEmployeeRequest;
import com.grupomendoza.rrhh.employee.dto.EmployeeDetailResponse;
import com.grupomendoza.rrhh.employee.dto.EmployeeListItemResponse;
import com.grupomendoza.rrhh.employee.dto.UpdateEmployeeRequest;
import com.grupomendoza.rrhh.position.Position;
import com.grupomendoza.rrhh.position.PositionService;
import com.grupomendoza.rrhh.role.Role;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.site.Site;
import com.grupomendoza.rrhh.site.SiteService;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserService;
import com.grupomendoza.rrhh.user.UserStatus;
import com.grupomendoza.rrhh.vacation.VacationBalance;
import com.grupomendoza.rrhh.vacation.VacationBalanceRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final UserService userService;
    private final PositionService positionService;
    private final SiteService siteService;
    private final PasswordEncoder passwordEncoder;
    private final VacationBalanceRepository vacationBalanceRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            UserService userService,
            PositionService positionService,
            SiteService siteService,
            PasswordEncoder passwordEncoder,
            VacationBalanceRepository vacationBalanceRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.userService = userService;
        this.positionService = positionService;
        this.siteService = siteService;
        this.passwordEncoder = passwordEncoder;
        this.vacationBalanceRepository = vacationBalanceRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeListItemResponse> list(String search, String status, Long siteId, Long positionId) {
        EmployeeStatus parsedStatus = SearchQuery.parseEnum(status, EmployeeStatus.class);
        return employeeRepository.search(SearchQuery.normalize(search), parsedStatus, siteId, positionId).stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeDetailResponse get(Long id) {
        return toDetail(findEmployee(id));
    }

    @Transactional
    public EmployeeDetailResponse create(CreateEmployeeRequest request) {
        validateUniqueDni(request.dni(), null);
        userService.validateUniqueEmail(request.email(), null);

        Position position = positionService.findActivePosition(request.positionId());
        Site site = siteService.findActiveSite(request.siteId());
        RoleName roleName = userService.parseRoleName(request.role());

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(userService.singleRoleSet(roleName));

        Employee employee = new Employee();
        employee.setUser(user);
        user.setEmployee(employee);
        employee.setPosition(position);
        employee.setSite(site);
        employee.setDni(request.dni().trim());
        employee.setBiometricCode(null);
        employee.setPhone(normalizeNullable(request.phone()));
        employee.setHireDate(request.hireDate());
        employee.setStatus(EmployeeStatus.ACTIVE);

        return toDetail(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeDetailResponse update(Long id, UpdateEmployeeRequest request) {
        Employee employee = findEmployee(id);
        validateUniqueDni(request.dni(), id);
        userService.validateUniqueEmail(request.email(), employee.getUser().getId());

        Position position = positionService.findActivePosition(request.positionId());
        Site site = siteService.findActiveSite(request.siteId());
        User user = employee.getUser();

        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setRoles(userService.singleRoleSet(userService.parseRoleName(request.role())));

        employee.setPosition(position);
        employee.setSite(site);
        employee.setDni(request.dni().trim());
        employee.setPhone(normalizeNullable(request.phone()));
        employee.setHireDate(request.hireDate());

        return toDetail(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeDetailResponse updateStatus(Long id, String status) {
        Employee employee = findEmployee(id);
        EmployeeStatus employeeStatus = SearchQuery.parseEnum(status, EmployeeStatus.class);

        employee.setStatus(employeeStatus);
        employee.getUser().setStatus(employeeStatus == EmployeeStatus.ACTIVE ? UserStatus.ACTIVE : UserStatus.INACTIVE);

        return toDetail(employeeRepository.save(employee));
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found."));
    }

    private void validateUniqueDni(String dni, Long currentEmployeeId) {
        String normalizedDni = dni.trim();
        employeeRepository.search(normalizedDni.toLowerCase(), null, null, null).stream()
                .filter(employee -> employee.getDni().equalsIgnoreCase(normalizedDni))
                .filter(employee -> currentEmployeeId == null || !employee.getId().equals(currentEmployeeId))
                .findFirst()
                .ifPresent(employee -> {
                    throw new IllegalStateException("An employee with this DNI already exists.");
                });
    }

    private EmployeeListItemResponse toListItem(Employee employee) {
        RoleName role = extractRole(employee.getUser());
        return new EmployeeListItemResponse(
                employee.getId(),
                employee.getUser().getId(),
                employee.getUser().getFullName(),
                employee.getUser().getEmail(),
                role.name(),
                RoleLabelMapper.toLabel(role),
                employee.getDni(),
                employee.getBiometricCode(),
                employee.getPhone(),
                employee.getHireDate(),
                employee.getPosition().getArea().getName(),
                employee.getPosition().getName(),
                employee.getSite().getName(),
                employee.getStatus().name()
        );
    }

    private EmployeeDetailResponse toDetail(Employee employee) {
        RoleName role = extractRole(employee.getUser());
        Position position = employee.getPosition();
        Site site = employee.getSite();
        VacationBalance balance = vacationBalanceRepository.findDetailedByEmployeeId(employee.getId()).orElse(null);

        return new EmployeeDetailResponse(
                employee.getId(),
                employee.getUser().getId(),
                employee.getUser().getFullName(),
                employee.getUser().getEmail(),
                role.name(),
                RoleLabelMapper.toLabel(role),
                employee.getDni(),
                employee.getBiometricCode(),
                employee.getPhone(),
                employee.getHireDate(),
                position.getArea().getId(),
                position.getArea().getName(),
                position.getId(),
                position.getName(),
                site.getId(),
                site.getName(),
                employee.getStatus().name(),
                employee.getUser().getStatus().name(),
                balance != null ? balance.getAvailableDays() : 0,
                balance != null ? balance.getUsedDays() : 0,
                balance != null ? balance.getPendingDays() : 0
        );
    }

    private RoleName extractRole(User user) {
        return user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElseThrow(() -> new IllegalStateException("User has no assigned role."));
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
