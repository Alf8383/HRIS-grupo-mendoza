package com.grupomendoza.rrhh.config;

import com.grupomendoza.rrhh.area.Area;
import com.grupomendoza.rrhh.area.AreaRepository;
import com.grupomendoza.rrhh.attendance.AttendanceRecord;
import com.grupomendoza.rrhh.attendance.AttendanceRecordRepository;
import com.grupomendoza.rrhh.attendance.AttendanceSource;
import com.grupomendoza.rrhh.attendance.AttendanceStatus;
import com.grupomendoza.rrhh.audit.AuditLog;
import com.grupomendoza.rrhh.audit.AuditLogRepository;
import com.grupomendoza.rrhh.common.status.RecordStatus;
import com.grupomendoza.rrhh.contract.Contract;
import com.grupomendoza.rrhh.contract.ContractRepository;
import com.grupomendoza.rrhh.contract.ContractStatus;
import com.grupomendoza.rrhh.contract.ContractType;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.leave.LeaveRequest;
import com.grupomendoza.rrhh.leave.LeaveRequestRepository;
import com.grupomendoza.rrhh.leave.LeaveRequestStatus;
import com.grupomendoza.rrhh.leave.LeaveRequestType;
import com.grupomendoza.rrhh.position.Position;
import com.grupomendoza.rrhh.position.PositionRepository;
import com.grupomendoza.rrhh.role.Role;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.role.RoleRepository;
import com.grupomendoza.rrhh.site.Site;
import com.grupomendoza.rrhh.site.SiteRepository;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import com.grupomendoza.rrhh.user.UserStatus;
import com.grupomendoza.rrhh.vacation.VacationBalance;
import com.grupomendoza.rrhh.vacation.VacationBalanceRepository;
import com.grupomendoza.rrhh.vacation.VacationRequest;
import com.grupomendoza.rrhh.vacation.VacationRequestRepository;
import com.grupomendoza.rrhh.vacation.VacationRequestStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@Order(1)
public class AuthDataSeeder implements ApplicationRunner {
    private static final String HR_AREA_NAME = "Recursos Humanos Semilla";
    private static final String OPERATIONS_AREA_NAME = "Operaciones Semilla";
    private static final String MAIN_SITE_NAME = "Sede Semilla";
    private static final String HR_POSITION_NAME = "Especialista RRHH Semilla";
    private static final String MANAGER_POSITION_NAME = "Jefatura Semilla";
    private static final String EMPLOYEE_POSITION_NAME = "Colaborador Semilla";
    private static final String HR_DNI = "80001001";
    private static final String MANAGER_DNI = "80001002";
    private static final String EMPLOYEE_DNI = "80001003";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AreaRepository areaRepository;
    private final SiteRepository siteRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final VacationBalanceRepository vacationBalanceRepository;
    private final VacationRequestRepository vacationRequestRepository;
    private final ContractRepository contractRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties adminSeedProperties;
    private final SecondaryAdminSeedProperties secondaryAdminSeedProperties;
    private final AdditionalSeedUsersProperties additionalSeedUsersProperties;

    public AuthDataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AreaRepository areaRepository,
            SiteRepository siteRepository,
            PositionRepository positionRepository,
            EmployeeRepository employeeRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            LeaveRequestRepository leaveRequestRepository,
            VacationBalanceRepository vacationBalanceRepository,
            VacationRequestRepository vacationRequestRepository,
            ContractRepository contractRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            AdminSeedProperties adminSeedProperties,
            SecondaryAdminSeedProperties secondaryAdminSeedProperties,
            AdditionalSeedUsersProperties additionalSeedUsersProperties
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.areaRepository = areaRepository;
        this.siteRepository = siteRepository;
        this.positionRepository = positionRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.vacationBalanceRepository = vacationBalanceRepository;
        this.vacationRequestRepository = vacationRequestRepository;
        this.contractRepository = contractRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminSeedProperties = adminSeedProperties;
        this.secondaryAdminSeedProperties = secondaryAdminSeedProperties;
        this.additionalSeedUsersProperties = additionalSeedUsersProperties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Arrays.stream(RoleName.values()).forEach(this::ensureRole);
        ensureAdminUser(
                adminSeedProperties.getFullName(),
                adminSeedProperties.getEmail(),
                adminSeedProperties.getPassword(),
                RoleName.ADMIN
        );
        ensureSecondaryAdminUser();
        ensureAdditionalSeedUsers();
        ensureAdditionalSeedDomainData();
    }

    private void ensureRole(RoleName roleName) {
        roleRepository.findByName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setName(roleName);
            role.setDescription("Initial system role.");
            return roleRepository.save(role);
        });
    }

    private void ensureAdminUser(String fullName, String email, String password, RoleName roleName) {
        userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException(roleName + " role must exist before seeding user."));

            User user = new User();
            user.setFullName(fullName);
            user.setEmail(email.toLowerCase());
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(Set.of(role));
            return userRepository.save(user);
        });
    }

    private void ensureSecondaryAdminUser() {
        if (!secondaryAdminSeedProperties.isEnabled()) {
            return;
        }

        if (!StringUtils.hasText(secondaryAdminSeedProperties.getFullName())
                || !StringUtils.hasText(secondaryAdminSeedProperties.getEmail())
                || !StringUtils.hasText(secondaryAdminSeedProperties.getPassword())) {
            throw new IllegalStateException("Secondary admin seed is enabled but incomplete.");
        }

        ensureAdminUser(
                secondaryAdminSeedProperties.getFullName(),
                secondaryAdminSeedProperties.getEmail(),
                secondaryAdminSeedProperties.getPassword(),
                RoleName.ADMIN
        );
    }

    private void ensureAdditionalSeedUsers() {
        if (additionalSeedUsersProperties.isHrEnabled()) {
            ensureSeedUserWithEmployee(
                    additionalSeedUsersProperties.getHrFullName(),
                    additionalSeedUsersProperties.getHrEmail(),
                    additionalSeedUsersProperties.getHrPassword(),
                    RoleName.HR,
                    HR_DNI,
                    "HR seed user is enabled but incomplete."
            );
        }

        if (additionalSeedUsersProperties.isManagerEnabled()) {
            ensureSeedUserWithEmployee(
                    additionalSeedUsersProperties.getManagerFullName(),
                    additionalSeedUsersProperties.getManagerEmail(),
                    additionalSeedUsersProperties.getManagerPassword(),
                    RoleName.MANAGER,
                    MANAGER_DNI,
                    "MANAGER seed user is enabled but incomplete."
            );
        }

        if (additionalSeedUsersProperties.isEmployeeEnabled()) {
            ensureSeedUserWithEmployee(
                    additionalSeedUsersProperties.getEmployeeFullName(),
                    additionalSeedUsersProperties.getEmployeeEmail(),
                    additionalSeedUsersProperties.getEmployeePassword(),
                    RoleName.EMPLOYEE,
                    EMPLOYEE_DNI,
                    "EMPLOYEE seed user is enabled but incomplete."
            );
        }
    }

    private void ensureAdditionalSeedDomainData() {
        User adminUser = userRepository.findByEmailIgnoreCase(adminSeedProperties.getEmail()).orElse(null);
        User hrUser = userRepository.findByEmailIgnoreCase(additionalSeedUsersProperties.getHrEmail()).orElse(null);
        User managerUser = userRepository.findByEmailIgnoreCase(additionalSeedUsersProperties.getManagerEmail()).orElse(null);
        User employeeUser = userRepository.findByEmailIgnoreCase(additionalSeedUsersProperties.getEmployeeEmail()).orElse(null);

        Employee hrEmployee = findDetailedEmployee(hrUser);
        Employee managerEmployee = findDetailedEmployee(managerUser);
        Employee employee = findDetailedEmployee(employeeUser);

        if (hrEmployee != null) {
            ensureSeedAttendance(hrEmployee, AttendanceStatus.PRESENT, 0, "Jornada administrativa registrada.");
            ensureSeedVacationBalance(hrEmployee, 20, 2, 0, "Saldo semilla de RR. HH.");
            ensureSeedContract(hrEmployee, ContractType.INDEFINITE, LocalDate.now().minusYears(3), null, ContractStatus.ACTIVE, "Contrato activo de RR. HH.");
        }

        if (managerEmployee != null) {
            ensureSeedAttendance(managerEmployee, AttendanceStatus.PRESENT, 0, "Jornada de jefatura registrada.");
            ensureSeedVacationBalance(managerEmployee, 18, 4, 1, "Saldo operativo de jefatura.");
            ensureSeedContract(managerEmployee, ContractType.INDEFINITE, LocalDate.now().minusYears(2), null, ContractStatus.ACTIVE, "Contrato activo de jefatura.");
        }

        if (employee != null) {
            ensureSeedAttendance(employee, AttendanceStatus.LATE, 9, "Ingreso con ligera tardanza para demo.");
            ensureSeedVacationBalance(employee, 15, 2, 2, "Saldo semilla de colaborador.");
            ensureSeedContract(employee, ContractType.FIXED_TERM, LocalDate.now().minusMonths(8), LocalDate.now().plusMonths(4), ContractStatus.ACTIVE, "Contrato vigente de colaborador seed.");
        }

        if (employee != null && leaveRequestRepository.findOwn(employee.getId()).isEmpty()) {
            LeaveRequest pendingLeave = createLeaveRequest(
                    employee,
                    LeaveRequestType.PERSONAL_PERMISSION,
                    LocalDateTime.now().plusDays(1).withHour(9).withMinute(0),
                    LocalDateTime.now().plusDays(1).withHour(11).withMinute(30),
                    "Permiso personal semilla.",
                    LeaveRequestStatus.PENDING,
                    null,
                    null
            );
            createAuditLog(employeeUser, "LEAVE_REQUEST", "CREATE", "LEAVE_REQUEST", pendingLeave.getId(), "Solicitud semilla creada para colaborador.");
        }

        if (managerEmployee != null && leaveRequestRepository.findOwn(managerEmployee.getId()).isEmpty()) {
            createLeaveRequest(
                    managerEmployee,
                    LeaveRequestType.OTHER_LICENSE,
                    LocalDateTime.now().minusDays(4).withHour(14).withMinute(0),
                    LocalDateTime.now().minusDays(4).withHour(18).withMinute(0),
                    "Salida de gestión externa.",
                    LeaveRequestStatus.APPROVED,
                    hrUser != null ? hrUser : adminUser,
                    "Aprobado para demo."
            );
        }

        if (employee != null && vacationRequestRepository.findOwn(employee.getId()).isEmpty()) {
            VacationRequest pendingVacation = createVacationRequest(
                    employee,
                    LocalDate.now().plusDays(15),
                    LocalDate.now().plusDays(16),
                    2,
                    "Descanso corto semilla.",
                    VacationRequestStatus.PENDING,
                    null,
                    null
            );
            createAuditLog(employeeUser, "VACATION", "CREATE", "VACATION_REQUEST", pendingVacation.getId(), "Solicitud de vacaciones semilla creada.");
        }

        if (managerEmployee != null && vacationRequestRepository.findOwn(managerEmployee.getId()).isEmpty()) {
            createVacationRequest(
                    managerEmployee,
                    LocalDate.now().minusDays(20),
                    LocalDate.now().minusDays(18),
                    3,
                    "Vacaciones ya gozadas.",
                    VacationRequestStatus.APPROVED,
                    hrUser != null ? hrUser : adminUser,
                    "Aprobado para demo."
            );
        }
    }

    private void ensureSeedUserWithEmployee(
            String fullName,
            String email,
            String password,
            RoleName roleName,
            String dni,
            String incompleteMessage
    ) {
        if (!StringUtils.hasText(fullName)
                || !StringUtils.hasText(email)
                || !StringUtils.hasText(password)) {
            throw new IllegalStateException(incompleteMessage);
        }

        ensureAdminUser(fullName, email, password, roleName);
        ensureEmployeeProfile(email, dni, roleName);
    }

    private void ensureEmployeeProfile(String email, String dni, RoleName roleName) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Seed user must exist before linking employee profile."));

        if (employeeRepository.findByUserId(user.getId()).isPresent()) {
            return;
        }

        if (employeeRepository.existsByDniIgnoreCase(dni)) {
            throw new IllegalStateException("Seed employee DNI already exists: " + dni);
        }

        Area area = switch (roleName) {
            case HR -> ensureArea(HR_AREA_NAME, "Area base para cuentas semilla de recursos humanos.");
            case MANAGER, EMPLOYEE -> ensureArea(OPERATIONS_AREA_NAME, "Area base para cuentas semilla operativas.");
            default -> throw new IllegalStateException("Unsupported seed employee role: " + roleName);
        };

        Position position = switch (roleName) {
            case HR -> ensurePosition(area, HR_POSITION_NAME, "Cargo base para cuenta semilla de RR. HH.");
            case MANAGER -> ensurePosition(area, MANAGER_POSITION_NAME, "Cargo base para cuenta semilla de jefatura.");
            case EMPLOYEE -> ensurePosition(area, EMPLOYEE_POSITION_NAME, "Cargo base para cuenta semilla de colaborador.");
            default -> throw new IllegalStateException("Unsupported seed employee role: " + roleName);
        };

        Site site = ensureSite(MAIN_SITE_NAME, "Sede base para cuentas semilla del sistema.");

        Employee employee = new Employee();
        employee.setUser(user);
        employee.setPosition(position);
        employee.setSite(site);
        employee.setDni(dni);
        employee.setPhone(null);
        employee.setHireDate(LocalDate.now().minusMonths(6));
        employee.setStatus(EmployeeStatus.ACTIVE);
        employeeRepository.save(employee);
    }

    private Employee findDetailedEmployee(User user) {
        if (user == null) {
            return null;
        }
        return employeeRepository.findDetailedByUserId(user.getId()).orElse(null);
    }

    private Area ensureArea(String name, String description) {
        return areaRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Area area = new Area();
            area.setName(name);
            area.setDescription(description);
            area.setStatus(RecordStatus.ACTIVE);
            return areaRepository.save(area);
        });
    }

    private Position ensurePosition(Area area, String name, String description) {
        return positionRepository.findByAreaIdAndNameIgnoreCase(area.getId(), name).orElseGet(() -> {
            Position position = new Position();
            position.setArea(area);
            position.setName(name);
            position.setDescription(description);
            position.setStatus(RecordStatus.ACTIVE);
            return positionRepository.save(position);
        });
    }

    private Site ensureSite(String name, String description) {
        return siteRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Site site = new Site();
            site.setName(name);
            site.setDescription(description);
            site.setStatus(RecordStatus.ACTIVE);
            return siteRepository.save(site);
        });
    }

    private void ensureSeedAttendance(Employee employee, AttendanceStatus status, int lateMinutes, String notes) {
        LocalDate date = LocalDate.now();
        if (attendanceRecordRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), date).isPresent()) {
            return;
        }

        Instant checkInAt = null;
        Instant checkOutAt = null;
        if (status == AttendanceStatus.PRESENT || status == AttendanceStatus.LATE) {
            checkInAt = Instant.now().minusSeconds((8L * 3600) - (lateMinutes * 60L));
            checkOutAt = status == AttendanceStatus.PRESENT ? Instant.now().minusSeconds(30L * 60) : null;
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setAttendanceDate(date);
        record.setCheckInAt(checkInAt);
        record.setCheckOutAt(checkOutAt);
        record.setStatus(status);
        record.setLateMinutes(lateMinutes);
        record.setSource(AttendanceSource.MANUAL);
        record.setNotes(notes);
        attendanceRecordRepository.save(record);
    }

    private void ensureSeedVacationBalance(Employee employee, int availableDays, int usedDays, int pendingDays, String notes) {
        if (vacationBalanceRepository.findDetailedByEmployeeId(employee.getId()).isPresent()) {
            return;
        }

        VacationBalance balance = new VacationBalance();
        balance.setEmployee(employee);
        balance.setAvailableDays(availableDays);
        balance.setUsedDays(usedDays);
        balance.setPendingDays(pendingDays);
        balance.setNotes(notes);
        vacationBalanceRepository.save(balance);
    }

    private void ensureSeedContract(
            Employee employee,
            ContractType contractType,
            LocalDate startDate,
            LocalDate endDate,
            ContractStatus status,
            String notes
    ) {
        if (!contractRepository.findByEmployeeIdDetailed(employee.getId()).isEmpty()) {
            return;
        }

        Contract contract = new Contract();
        contract.setEmployee(employee);
        contract.setContractType(contractType);
        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setStatus(status);
        contract.setNotes(notes);
        contractRepository.save(contract);
    }

    private LeaveRequest createLeaveRequest(
            Employee employee,
            LeaveRequestType type,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String reason,
            LeaveRequestStatus status,
            User reviewedBy,
            String reviewComment
    ) {
        LeaveRequest request = new LeaveRequest();
        request.setEmployee(employee);
        request.setRequestType(type);
        request.setStartAt(startAt);
        request.setEndAt(endAt);
        request.setReason(reason);
        request.setStatus(status);
        request.setReviewedByUser(reviewedBy);
        request.setReviewedAt(reviewedBy != null ? Instant.now().minusSeconds(7200) : null);
        request.setReviewComment(reviewComment);
        return leaveRequestRepository.save(request);
    }

    private VacationRequest createVacationRequest(
            Employee employee,
            LocalDate startDate,
            LocalDate endDate,
            int requestedDays,
            String observation,
            VacationRequestStatus status,
            User reviewedBy,
            String reviewComment
    ) {
        VacationRequest request = new VacationRequest();
        request.setEmployee(employee);
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setRequestedDays(requestedDays);
        request.setObservation(observation);
        request.setStatus(status);
        request.setReviewedByUser(reviewedBy);
        request.setReviewedAt(reviewedBy != null ? Instant.now().minusSeconds(5400) : null);
        request.setReviewComment(reviewComment);
        return vacationRequestRepository.save(request);
    }

    private void createAuditLog(
            User user,
            String module,
            String action,
            String entityType,
            Long entityId,
            String summary
    ) {
        List<AuditLog> existing = auditLogRepository.findAllByOrderByEventAtDescIdDesc();
        boolean alreadyExists = existing.stream().anyMatch(log ->
                module.equals(log.getModule())
                        && action.equals(log.getAction())
                        && entityType.equals(log.getEntityType())
                        && ((entityId == null && log.getEntityId() == null) || (entityId != null && entityId.equals(log.getEntityId())))
                        && summary.equals(log.getSummary()));
        if (alreadyExists) {
            return;
        }

        AuditLog log = new AuditLog();
        log.setEventAt(Instant.now().minusSeconds(1200));
        log.setUserId(user != null ? user.getId() : null);
        log.setUserEmail(user != null ? user.getEmail() : "system");
        log.setModule(module);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setSummary(summary);
        auditLogRepository.save(log);
    }
}
