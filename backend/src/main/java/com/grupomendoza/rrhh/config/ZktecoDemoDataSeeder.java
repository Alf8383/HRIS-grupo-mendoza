package com.grupomendoza.rrhh.config;

import com.grupomendoza.rrhh.area.Area;
import com.grupomendoza.rrhh.area.AreaRepository;
import com.grupomendoza.rrhh.attendance.AttendanceRecord;
import com.grupomendoza.rrhh.attendance.AttendanceRecordRepository;
import com.grupomendoza.rrhh.attendance.AttendanceSource;
import com.grupomendoza.rrhh.attendance.AttendanceStatus;
import com.grupomendoza.rrhh.common.status.RecordStatus;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
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
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(3)
@Profile("!test")
public class ZktecoDemoDataSeeder implements ApplicationRunner {
    private static final ZoneId APP_ZONE = ZoneId.of("America/Bogota");
    private static final String AREA_NAME = "Operaciones ZKTeco";
    private static final String POSITION_NAME = "Operario de Planta";
    private static final String SITE_NAME = "Sede Biométrica";
    private static final String EMAIL_DOMAIN = "demo.grupomendoza.com";
    private static final String DEFAULT_PASSWORD = "Demo12345!";
    private static final LocalDate SOURCE_START_DATE = LocalDate.of(2012, 7, 16);

    private static final List<ZktecoEmployeeSeed> EMPLOYEES = List.of(
            new ZktecoEmployeeSeed("00000014", "Salvador Díaz Ortiz", "90000014", "999200014"),
            new ZktecoEmployeeSeed("00000024", "Camilo González Buel", "90000024", "999200024"),
            new ZktecoEmployeeSeed("00000030", "Lidia Romero Arce", "90000030", "999200030")
    );

    private static final List<ZktecoAttendanceSeed> ATTENDANCE = List.of(
            new ZktecoAttendanceSeed("00000014", 0, "07:59", null, true, null, null),
            new ZktecoAttendanceSeed("00000014", 1, "07:51", "17:23", false, "09:32", null),
            new ZktecoAttendanceSeed("00000014", 2, "07:48", null, true, null, null),
            new ZktecoAttendanceSeed("00000014", 3, "07:55", "17:10", false, "09:14", null),
            new ZktecoAttendanceSeed("00000014", 4, "07:50", "17:33", false, "09:43", "00:33"),
            new ZktecoAttendanceSeed("00000014", 7, "07:48", null, true, null, null),
            new ZktecoAttendanceSeed("00000014", 8, "07:51", "18:51", false, "10:57", "01:51"),
            new ZktecoAttendanceSeed("00000014", 9, "07:51", "17:07", false, "09:14", null),
            new ZktecoAttendanceSeed("00000014", 10, "07:49", "17:11", false, "09:22", null),
            new ZktecoAttendanceSeed("00000014", 11, "07:54", "17:23", false, "09:29", null),
            new ZktecoAttendanceSeed("00000014", 14, "07:48", "17:16", false, "09:28", null),
            new ZktecoAttendanceSeed("00000014", 15, "07:46", "17:10", false, "09:24", null),
            new ZktecoAttendanceSeed("00000024", 0, "08:14", null, true, null, null),
            new ZktecoAttendanceSeed("00000024", 1, "08:11", "17:01", false, "08:50", null),
            new ZktecoAttendanceSeed("00000024", 2, "07:57", "17:19", false, "09:22", null),
            new ZktecoAttendanceSeed("00000024", 3, "07:55", "17:22", false, "09:27", null),
            new ZktecoAttendanceSeed("00000024", 4, "07:49", "17:16", false, "09:27", null),
            new ZktecoAttendanceSeed("00000024", 7, "07:52", null, true, null, null),
            new ZktecoAttendanceSeed("00000024", 8, "07:46", "17:24", false, "09:38", null),
            new ZktecoAttendanceSeed("00000024", 9, "08:09", "17:08", false, "08:59", null),
            new ZktecoAttendanceSeed("00000024", 10, "07:51", "17:19", false, "09:28", null),
            new ZktecoAttendanceSeed("00000024", 11, "07:53", "17:24", false, "09:31", null),
            new ZktecoAttendanceSeed("00000024", 14, "07:48", "17:03", false, "09:15", null),
            new ZktecoAttendanceSeed("00000024", 15, "07:57", "17:16", false, "09:19", null),
            new ZktecoAttendanceSeed("00000030", 0, null, null, true, null, null),
            new ZktecoAttendanceSeed("00000030", 1, "07:48", "17:04", false, "09:16", null),
            new ZktecoAttendanceSeed("00000030", 2, "07:55", "17:37", false, "09:42", "00:37"),
            new ZktecoAttendanceSeed("00000030", 3, "07:58", "17:15", false, "09:17", null),
            new ZktecoAttendanceSeed("00000030", 4, "07:47", "17:23", false, "09:37", null)
    );

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AreaRepository areaRepository;
    private final SiteRepository siteRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final PasswordEncoder passwordEncoder;

    public ZktecoDemoDataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AreaRepository areaRepository,
            SiteRepository siteRepository,
            PositionRepository positionRepository,
            EmployeeRepository employeeRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.areaRepository = areaRepository;
        this.siteRepository = siteRepository;
        this.positionRepository = positionRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role employeeRole = roleRepository.findByName(RoleName.EMPLOYEE)
                .orElseThrow(() -> new IllegalStateException("EMPLOYEE role must exist before ZKTeco demo seed."));
        Area area = ensureArea();
        Site site = ensureSite();
        Position position = ensurePosition(area);
        LocalDate targetStartDate = LocalDate.now(APP_ZONE).minusDays(16);

        for (ZktecoEmployeeSeed employeeSeed : EMPLOYEES) {
            ensureEmployee(employeeSeed, employeeRole, position, site);
        }

        for (ZktecoAttendanceSeed attendanceSeed : ATTENDANCE) {
            Employee employee = employeeRepository.findByBiometricCode(attendanceSeed.biometricCode())
                    .orElseThrow(() -> new IllegalStateException("ZKTeco employee not found: " + attendanceSeed.biometricCode()));
            LocalDate attendanceDate = targetStartDate.plusDays(attendanceSeed.dayOffset());
            ensureAttendanceRecord(employee, attendanceSeed, attendanceDate);
        }
    }

    private Employee ensureEmployee(
            ZktecoEmployeeSeed employeeSeed,
            Role employeeRole,
            Position position,
            Site site
    ) {
        return employeeRepository.findByBiometricCode(employeeSeed.biometricCode()).orElseGet(() -> {
            User user = ensureUser(employeeSeed.name(), emailFor(employeeSeed.name()), employeeRole);

            Employee employee = new Employee();
            employee.setUser(user);
            employee.setPosition(position);
            employee.setSite(site);
            employee.setDni(employeeSeed.dni());
            employee.setBiometricCode(employeeSeed.biometricCode());
            employee.setPhone(employeeSeed.phone());
            employee.setHireDate(LocalDate.now(APP_ZONE).minusYears(2));
            employee.setStatus(EmployeeStatus.ACTIVE);
            user.setEmployee(employee);
            return employeeRepository.save(employee);
        });
    }

    private User ensureUser(String fullName, String email, Role employeeRole) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = new User();
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(Set.of(employeeRole));
            return userRepository.save(user);
        });
    }

    private void ensureAttendanceRecord(
            Employee employee,
            ZktecoAttendanceSeed attendanceSeed,
            LocalDate attendanceDate
    ) {
        if (attendanceRecordRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), attendanceDate).isPresent()) {
            return;
        }

        LocalTime scheduledStart = LocalTime.of(8, 0);
        LocalTime checkIn = parseTime(attendanceSeed.checkIn());
        LocalTime checkOut = parseTime(attendanceSeed.checkOut());
        int lateMinutes = checkIn != null && checkIn.isAfter(scheduledStart)
                ? (int) Duration.between(scheduledStart, checkIn).toMinutes()
                : 0;

        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setAttendanceDate(attendanceDate);
        record.setCheckInAt(toInstant(attendanceDate, checkIn));
        record.setCheckOutAt(toInstant(attendanceDate, checkOut));
        record.setStatus(resolveStatus(attendanceSeed.absent(), lateMinutes));
        record.setLateMinutes(lateMinutes);
        record.setWorkedMinutes(parseDurationMinutes(attendanceSeed.workedTime()));
        record.setExtraMinutes(parseDurationMinutes(attendanceSeed.extraTime()));
        record.setSource(AttendanceSource.BIOMETRIC_IMPORT);
        record.setNotes(buildNotes(attendanceSeed));
        attendanceRecordRepository.save(record);
    }

    private AttendanceStatus resolveStatus(boolean absent, int lateMinutes) {
        if (absent) {
            return AttendanceStatus.ABSENT;
        }
        if (lateMinutes > 0) {
            return AttendanceStatus.LATE;
        }
        return AttendanceStatus.PRESENT;
    }

    private String buildNotes(ZktecoAttendanceSeed attendanceSeed) {
        String sourceDate = SOURCE_START_DATE.plusDays(attendanceSeed.dayOffset()).toString();
        if (attendanceSeed.absent() && attendanceSeed.checkIn() != null) {
            return "Importado desde Excel ZKTeco. Marca incompleta en fuente " + sourceDate + ".";
        }
        return "Importado desde Excel ZKTeco. Fuente original " + sourceDate + ".";
    }

    private Instant toInstant(LocalDate date, LocalTime time) {
        if (time == null) {
            return null;
        }
        return date.atTime(time).atZone(APP_ZONE).toInstant();
    }

    private LocalTime parseTime(String value) {
        if (value == null) {
            return null;
        }
        return LocalTime.parse(value);
    }

    private Integer parseDurationMinutes(String value) {
        if (value == null) {
            return null;
        }
        String[] parts = value.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    private Area ensureArea() {
        return areaRepository.findByNameIgnoreCase(AREA_NAME).orElseGet(() -> {
            Area area = new Area();
            area.setName(AREA_NAME);
            area.setDescription("Área ficticia para registros importados desde reloj biométrico ZKTeco.");
            area.setStatus(RecordStatus.ACTIVE);
            return areaRepository.save(area);
        });
    }

    private Site ensureSite() {
        return siteRepository.findByNameIgnoreCase(SITE_NAME).orElseGet(() -> {
            Site site = new Site();
            site.setName(SITE_NAME);
            site.setDescription("Sede ficticia con control de asistencia biométrico.");
            site.setStatus(RecordStatus.ACTIVE);
            return siteRepository.save(site);
        });
    }

    private Position ensurePosition(Area area) {
        return positionRepository.findByAreaIdAndNameIgnoreCase(area.getId(), POSITION_NAME).orElseGet(() -> {
            Position position = new Position();
            position.setArea(area);
            position.setName(POSITION_NAME);
            position.setDescription("Cargo ficticio para personal operativo importado desde ZKTeco.");
            position.setStatus(RecordStatus.ACTIVE);
            return positionRepository.save(position);
        });
    }

    private String emailFor(String fullName) {
        String normalized = Normalizer.normalize(fullName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", ".")
                .replaceAll("(^\\.|\\.$)", "");
        return normalized + "@" + EMAIL_DOMAIN;
    }

    private record ZktecoEmployeeSeed(String biometricCode, String name, String dni, String phone) {
    }

    private record ZktecoAttendanceSeed(
            String biometricCode,
            int dayOffset,
            String checkIn,
            String checkOut,
            boolean absent,
            String workedTime,
            String extraTime
    ) {
    }
}
