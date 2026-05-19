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
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
public class DemoDataSeeder implements ApplicationRunner {
    private static final String HR_EMAIL = "hr.demo@grupomendoza.com";
    private static final String MANAGER_EMAIL = "manager.demo@grupomendoza.com";
    private static final String ANA_EMAIL = "ana.demo@grupomendoza.com";
    private static final String LUIS_EMAIL = "luis.demo@grupomendoza.com";
    private static final String SOFIA_EMAIL = "sofia.demo@grupomendoza.com";

    private final DemoSeedProperties demoSeedProperties;
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

    public DemoDataSeeder(
            DemoSeedProperties demoSeedProperties,
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
            PasswordEncoder passwordEncoder
    ) {
        this.demoSeedProperties = demoSeedProperties;
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
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!demoSeedProperties.isEnabled() || userRepository.findByEmailIgnoreCase(HR_EMAIL).isPresent()) {
            return;
        }

        Role hrRole = requireRole(RoleName.HR);
        Role managerRole = requireRole(RoleName.MANAGER);
        Role employeeRole = requireRole(RoleName.EMPLOYEE);
        User adminUser = userRepository.findByEmailIgnoreCase("admin@grupomendoza.com").orElse(null);

        Area rrhhArea = createArea("Recursos Humanos", "Área de gestión del personal.");
        Area operationsArea = createArea("Operaciones", "Área principal para la demo operativa.");
        Area salesArea = createArea("Comercial", "Área comercial para escenarios adicionales.");

        Site limaSite = createSite("Sede Lima", "Sede principal para el recorrido demo.");
        Site callaoSite = createSite("Sede Callao", "Sede secundaria para cobertura del reporte.");

        Position hrPosition = createPosition(rrhhArea, "Especialista RRHH", "Gestión operativa de RR. HH.");
        Position managerPosition = createPosition(operationsArea, "Jefe de Operaciones", "Jefatura del equipo demo.");
        Position analystPosition = createPosition(operationsArea, "Analista de Operaciones", "Colaborador operativo.");
        Position salesPosition = createPosition(salesArea, "Asesor Comercial", "Colaborador comercial.");

        User hrUser = createUser("Recursos Humanos Demo", HR_EMAIL, hrRole);
        User managerUser = createUser("María Jefa Demo", MANAGER_EMAIL, managerRole);
        User anaUser = createUser("Ana Torres Demo", ANA_EMAIL, employeeRole);
        User luisUser = createUser("Luis Ramos Demo", LUIS_EMAIL, employeeRole);
        User sofiaUser = createUser("Sofía Pérez Demo", SOFIA_EMAIL, employeeRole);

        Employee managerEmployee = createEmployee(managerUser, managerPosition, limaSite, "70001001", "999100001", LocalDate.now().minusYears(3));
        Employee anaEmployee = createEmployee(anaUser, analystPosition, limaSite, "70001002", "999100002", LocalDate.now().minusYears(2));
        Employee luisEmployee = createEmployee(luisUser, analystPosition, callaoSite, "70001003", "999100003", LocalDate.now().minusYears(1));
        Employee sofiaEmployee = createEmployee(sofiaUser, salesPosition, callaoSite, "70001004", "999100004", LocalDate.now().minusMonths(10));
        createEmployee(hrUser, hrPosition, limaSite, "70001005", "999100005", LocalDate.now().minusYears(4));

        createAttendanceRecord(managerEmployee, LocalDate.now(), AttendanceStatus.PRESENT, 0, Instant.now().minusSeconds(8 * 3600), Instant.now().minusSeconds(30 * 60), "Jornada completa", null, null);
        createAttendanceRecord(anaEmployee, LocalDate.now(), AttendanceStatus.LATE, 12, Instant.now().minusSeconds(7 * 3600 + 48 * 60), null, "Ingreso con ligera demora", null, null);
        createAttendanceRecord(luisEmployee, LocalDate.now().minusDays(1), AttendanceStatus.JUSTIFIED_ABSENT, 0, null, null, null, "Descanso médico validado", hrUser);
        createAttendanceRecord(sofiaEmployee, LocalDate.now().minusDays(1), AttendanceStatus.PRESENT, 0, Instant.now().minusSeconds(32 * 3600), Instant.now().minusSeconds(24 * 3600), "Jornada regular", null, null);

        LeaveRequest pendingLeave = createLeaveRequest(anaEmployee, LeaveRequestType.PERSONAL_PERMISSION, LocalDateTime.now().plusDays(1).withHour(9).withMinute(0), LocalDateTime.now().plusDays(1).withHour(12).withMinute(0), "Cita personal programada", LeaveRequestStatus.PENDING, null, null);
        LeaveRequest approvedLeave = createLeaveRequest(luisEmployee, LeaveRequestType.MEDICAL_LEAVE, LocalDateTime.now().minusDays(5).withHour(8).withMinute(0), LocalDateTime.now().minusDays(4).withHour(18).withMinute(0), "Descanso médico breve", LeaveRequestStatus.APPROVED, managerUser, "Aprobado con sustento.");
        createLeaveRequest(sofiaEmployee, LeaveRequestType.OTHER_LICENSE, LocalDateTime.now().plusDays(4).withHour(10).withMinute(0), LocalDateTime.now().plusDays(4).withHour(13).withMinute(0), "Trámite externo", LeaveRequestStatus.CANCELLED, null, null);

        createVacationBalance(managerEmployee, 18, 4, 0, "Saldo operativo de jefatura.");
        createVacationBalance(anaEmployee, 15, 3, 2, "Saldo listo para demo.");
        createVacationBalance(luisEmployee, 12, 5, 0, "Historial con vacaciones aprobadas.");
        createVacationBalance(sofiaEmployee, 10, 0, 0, "Saldo comercial inicial.");

        VacationRequest pendingVacation = createVacationRequest(anaEmployee, LocalDate.now().plusDays(12), LocalDate.now().plusDays(13), 2, "Salida familiar corta", VacationRequestStatus.PENDING, null, null);
        createVacationRequest(luisEmployee, LocalDate.now().minusDays(12), LocalDate.now().minusDays(9), 4, "Vacaciones ya gozadas", VacationRequestStatus.APPROVED, managerUser, "Aprobado por jefatura.");
        createVacationRequest(sofiaEmployee, LocalDate.now().plusDays(20), LocalDate.now().plusDays(22), 3, "Viaje personal", VacationRequestStatus.REJECTED, hrUser, "Se requiere reprogramar por cobertura.");

        createContract(managerEmployee, ContractType.INDEFINITE, LocalDate.now().minusYears(2), null, ContractStatus.ACTIVE, "Contrato indefinido vigente.", null);
        createContract(anaEmployee, ContractType.FIXED_TERM, LocalDate.now().minusMonths(10), LocalDate.now().plusDays(12), ContractStatus.ACTIVE, "Contrato próximo a vencer para reportes.", null);
        Contract previousLuisContract = createContract(luisEmployee, ContractType.TEMPORARY, LocalDate.now().minusMonths(11), LocalDate.now().minusMonths(2), ContractStatus.EXPIRED, "Contrato temporal concluido.", null);
        createContract(luisEmployee, ContractType.INDEFINITE, LocalDate.now().minusMonths(2).plusDays(1), null, ContractStatus.ACTIVE, "Renovación indefinida.", previousLuisContract);
        createContract(sofiaEmployee, ContractType.INTERNSHIP, LocalDate.now().minusMonths(5), LocalDate.now().plusDays(28), ContractStatus.ACTIVE, "Contrato de prácticas para cobertura comercial.", null);

        createAuditLog(hrUser, "EMPLOYEE", "CREATE", "EMPLOYEE", anaEmployee.getId(), "Alta inicial de empleado demo.");
        createAuditLog(managerUser, "LEAVE_REQUEST", "APPROVE", "LEAVE_REQUEST", approvedLeave.getId(), "Aprobación de permiso demo.");
        createAuditLog(hrUser, "VACATION", "UPDATE_BALANCE", "VACATION_BALANCE", anaEmployee.getId(), "Ajuste de saldo para escenario demo.");
        createAuditLog(managerUser, "VACATION", "CREATE", "VACATION_REQUEST", pendingVacation.getId(), "Solicitud de vacaciones pendiente para el equipo.");
        createAuditLog(anaUser, "LEAVE_REQUEST", "CREATE", "LEAVE_REQUEST", pendingLeave.getId(), "Solicitud propia pendiente de aprobación.");
        createAuditLog(hrUser, "REPORT", "EXPORT", "REPORT", null, "Exportación demo de contratos por vencer.");
        createAuditLog(adminUser, "AUDIT", "VIEW", "AUDIT_LOG", null, "Consulta inicial de bitácora.");
    }

    private Role requireRole(RoleName roleName) {
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Required role not found: " + roleName));
    }

    private Area createArea(String name, String description) {
        Area area = new Area();
        area.setName(name);
        area.setDescription(description);
        area.setStatus(RecordStatus.ACTIVE);
        return areaRepository.save(area);
    }

    private Site createSite(String name, String description) {
        Site site = new Site();
        site.setName(name);
        site.setDescription(description);
        site.setStatus(RecordStatus.ACTIVE);
        return siteRepository.save(site);
    }

    private Position createPosition(Area area, String name, String description) {
        Position position = new Position();
        position.setArea(area);
        position.setName(name);
        position.setDescription(description);
        position.setStatus(RecordStatus.ACTIVE);
        return positionRepository.save(position);
    }

    private User createUser(String fullName, String email, Role role) {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(demoSeedProperties.getDefaultPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(role));
        return userRepository.save(user);
    }

    private Employee createEmployee(
            User user,
            Position position,
            Site site,
            String dni,
            String phone,
            LocalDate hireDate
    ) {
        Employee employee = new Employee();
        employee.setUser(user);
        employee.setPosition(position);
        employee.setSite(site);
        employee.setDni(dni);
        employee.setPhone(phone);
        employee.setHireDate(hireDate);
        employee.setStatus(EmployeeStatus.ACTIVE);
        user.setEmployee(employee);
        return employeeRepository.save(employee);
    }

    private void createAttendanceRecord(
            Employee employee,
            LocalDate attendanceDate,
            AttendanceStatus status,
            int lateMinutes,
            Instant checkInAt,
            Instant checkOutAt,
            String notes,
            String justificationNote,
            User justifiedBy
    ) {
        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setAttendanceDate(attendanceDate);
        record.setCheckInAt(checkInAt);
        record.setCheckOutAt(checkOutAt);
        record.setStatus(status);
        record.setLateMinutes(lateMinutes);
        record.setSource(AttendanceSource.MANUAL);
        record.setNotes(notes);
        record.setJustificationNote(justificationNote);
        record.setJustifiedByUser(justifiedBy);
        record.setJustifiedAt(justifiedBy != null ? Instant.now().minusSeconds(3600) : null);
        attendanceRecordRepository.save(record);
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

    private void createVacationBalance(
            Employee employee,
            int availableDays,
            int usedDays,
            int pendingDays,
            String notes
    ) {
        VacationBalance balance = new VacationBalance();
        balance.setEmployee(employee);
        balance.setAvailableDays(availableDays);
        balance.setUsedDays(usedDays);
        balance.setPendingDays(pendingDays);
        balance.setNotes(notes);
        vacationBalanceRepository.save(balance);
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

    private Contract createContract(
            Employee employee,
            ContractType contractType,
            LocalDate startDate,
            LocalDate endDate,
            ContractStatus status,
            String notes,
            Contract previousContract
    ) {
        Contract contract = new Contract();
        contract.setEmployee(employee);
        contract.setContractType(contractType);
        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setStatus(status);
        contract.setNotes(notes);
        contract.setPreviousContract(previousContract);
        return contractRepository.save(contract);
    }

    private void createAuditLog(
            User user,
            String module,
            String action,
            String entityType,
            Long entityId,
            String summary
    ) {
        AuditLog log = new AuditLog();
        log.setEventAt(Instant.now().minusSeconds(1800));
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
