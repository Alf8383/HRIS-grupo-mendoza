package com.grupomendoza.rrhh.attendance;

import com.grupomendoza.rrhh.area.Area;
import com.grupomendoza.rrhh.area.AreaRepository;
import com.grupomendoza.rrhh.attendance.dto.ZktecoImportErrorResponse;
import com.grupomendoza.rrhh.attendance.dto.ZktecoImportResultResponse;
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
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ZktecoAttendanceImportService {
    private static final String SHEET_NAME = "Reporte de Asistencia";
    private static final int HEADER_ROW_INDEX = 2;
    private static final int FIRST_DATA_ROW_INDEX = 3;
    private static final String DEFAULT_AREA_NAME = "ZKTECO";
    private static final String DEFAULT_POSITION_NAME = "Sin asignar";
    private static final String DEFAULT_SITE_NAME = "Sin asignar";
    private static final String DEFAULT_PASSWORD = "Zkteco12345!";
    private static final List<String> REQUIRED_HEADERS = List.of(
            "Empleado",
            "Nombre",
            "Fecha",
            "Entrada (T)",
            "Salida (T)",
            "Entró",
            "Salió",
            "Tarde",
            "Falta",
            "Jornada",
            "TieTrabajado"
    );
    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("d/M/yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ISO_LOCAL_DATE
    );
    private static final List<DateTimeFormatter> TIME_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("H:mm"),
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("H:mm:ss"),
            DateTimeFormatter.ofPattern("HH:mm:ss")
    );

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AreaRepository areaRepository;
    private final PositionRepository positionRepository;
    private final SiteRepository siteRepository;
    private final PasswordEncoder passwordEncoder;

    public ZktecoAttendanceImportService(
            AttendanceRecordRepository attendanceRecordRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            AreaRepository areaRepository,
            PositionRepository positionRepository,
            SiteRepository siteRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.areaRepository = areaRepository;
        this.positionRepository = positionRepository;
        this.siteRepository = siteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ZktecoImportResultResponse importFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de asistencia es requerido.");
        }

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.getSheet(SHEET_NAME);
            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }

            DataFormatter formatter = new DataFormatter(Locale.forLanguageTag("es-PE"));
            Map<String, Integer> headers = readHeaders(sheet.getRow(HEADER_ROW_INDEX), formatter);
            validateHeaders(headers);

            ImportDefaults defaults = loadDefaults();
            ImportCounters counters = new ImportCounters();
            List<ZktecoImportErrorResponse> errors = new ArrayList<>();

            for (int rowIndex = FIRST_DATA_ROW_INDEX; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, formatter)) {
                    continue;
                }

                counters.rowsRead++;
                try {
                    ImportRow importRow = parseRow(row, headers, formatter);
                    Employee employee = findOrCreateEmployee(importRow, defaults, counters);
                    saveAttendance(importRow, employee, counters);
                } catch (RuntimeException exception) {
                    counters.rowsSkipped++;
                    errors.add(new ZktecoImportErrorResponse(rowIndex + 1, exception.getMessage()));
                }
            }

            return new ZktecoImportResultResponse(
                    counters.rowsRead,
                    counters.attendanceCreated,
                    counters.attendanceUpdated,
                    counters.employeesCreated,
                    counters.rowsSkipped,
                    errors
            );
        } catch (IOException exception) {
            throw new IllegalArgumentException("No se pudo leer el archivo de asistencia.");
        }
    }

    private Map<String, Integer> readHeaders(Row headerRow, DataFormatter formatter) {
        if (headerRow == null) {
            throw new IllegalArgumentException("El archivo no contiene la fila de encabezados esperada.");
        }

        Map<String, Integer> headers = new LinkedHashMap<>();
        for (Cell cell : headerRow) {
            String header = normalize(formatter.formatCellValue(cell));
            if (!header.isBlank()) {
                headers.put(header, cell.getColumnIndex());
            }
        }
        return headers;
    }

    private void validateHeaders(Map<String, Integer> headers) {
        List<String> missingHeaders = REQUIRED_HEADERS.stream()
                .filter(header -> !headers.containsKey(header))
                .toList();

        if (!missingHeaders.isEmpty()) {
            throw new IllegalArgumentException("El archivo ZKTECO no contiene los encabezados requeridos: " + String.join(", ", missingHeaders));
        }
    }

    private ImportRow parseRow(Row row, Map<String, Integer> headers, DataFormatter formatter) {
        String biometricCode = requiredValue(row, headers, formatter, "Empleado");
        String employeeName = requiredValue(row, headers, formatter, "Nombre");
        LocalDate attendanceDate = parseDate(requiredValue(row, headers, formatter, "Fecha"));
        LocalTime checkIn = parseOptionalTime(value(row, headers, formatter, "Entró"));
        LocalTime checkOut = parseOptionalTime(value(row, headers, formatter, "Salió"));
        String lateValue = value(row, headers, formatter, "Tarde");
        String absentValue = value(row, headers, formatter, "Falta");
        int lateMinutes = parseDurationMinutes(lateValue);
        AttendanceStatus status = !absentValue.isBlank()
                ? AttendanceStatus.ABSENT
                : lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

        return new ImportRow(
                biometricCode,
                employeeName,
                attendanceDate,
                checkIn,
                checkOut,
                status,
                lateMinutes,
                parseDurationMinutes(value(row, headers, formatter, "TieTrabajado")),
                parseDurationMinutes(value(row, headers, formatter, "TieExt")),
                value(row, headers, formatter, "Entrada (T)"),
                value(row, headers, formatter, "Salida (T)"),
                value(row, headers, formatter, "Jornada"),
                value(row, headers, formatter, "TieTrabajado"),
                value(row, headers, formatter, "TieExt")
        );
    }

    private Employee findOrCreateEmployee(ImportRow importRow, ImportDefaults defaults, ImportCounters counters) {
        return employeeRepository.findByBiometricCode(importRow.biometricCode())
                .orElseGet(() -> {
                    User user = new User();
                    user.setFullName(importRow.employeeName().trim());
                    user.setEmail("zkteco-" + importRow.biometricCode().toLowerCase() + "@grupomendoza.local");
                    user.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
                    user.setStatus(UserStatus.ACTIVE);
                    user.setRoles(Set.of(defaults.employeeRole()));

                    Employee employee = new Employee();
                    employee.setUser(user);
                    user.setEmployee(employee);
                    employee.setPosition(defaults.position());
                    employee.setSite(defaults.site());
                    employee.setDni("ZK-" + importRow.biometricCode());
                    employee.setBiometricCode(importRow.biometricCode());
                    employee.setPhone(null);
                    employee.setHireDate(importRow.attendanceDate());
                    employee.setStatus(EmployeeStatus.ACTIVE);

                    counters.employeesCreated++;
                    return employeeRepository.save(employee);
                });
    }

    private void saveAttendance(ImportRow importRow, Employee employee, ImportCounters counters) {
        AttendanceRecord record = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(employee.getId(), importRow.attendanceDate())
                .orElse(null);

        boolean created = record == null;
        if (record == null) {
            record = new AttendanceRecord();
            record.setEmployee(employee);
            record.setAttendanceDate(importRow.attendanceDate());
        }

        record.setCheckInAt(toInstant(importRow.attendanceDate(), importRow.checkIn()));
        record.setCheckOutAt(toInstant(importRow.attendanceDate(), importRow.checkOut()));
        record.setStatus(importRow.status());
        record.setLateMinutes(importRow.status() == AttendanceStatus.LATE ? importRow.lateMinutes() : 0);
        record.setWorkedMinutes(importRow.workedMinutes() > 0 ? importRow.workedMinutes() : null);
        record.setExtraMinutes(importRow.extraMinutes() > 0 ? importRow.extraMinutes() : null);
        record.setSource(AttendanceSource.BIOMETRIC_IMPORT);
        record.setNotes(importRow.toNotes());
        record.setJustificationNote(null);
        record.setJustifiedByUser(null);
        record.setJustifiedAt(null);

        attendanceRecordRepository.save(record);
        if (created) {
            counters.attendanceCreated++;
        } else {
            counters.attendanceUpdated++;
        }
    }

    private ImportDefaults loadDefaults() {
        Area area = areaRepository.findByNameIgnoreCase(DEFAULT_AREA_NAME)
                .orElseGet(() -> {
                    Area newArea = new Area();
                    newArea.setName(DEFAULT_AREA_NAME);
                    newArea.setDescription("Área creada automáticamente para importaciones biométricas ZKTECO.");
                    newArea.setStatus(RecordStatus.ACTIVE);
                    return areaRepository.save(newArea);
                });

        Position position = positionRepository.findByAreaIdAndNameIgnoreCase(area.getId(), DEFAULT_POSITION_NAME)
                .orElseGet(() -> {
                    Position newPosition = new Position();
                    newPosition.setArea(area);
                    newPosition.setName(DEFAULT_POSITION_NAME);
                    newPosition.setDescription("Cargo temporal para trabajadores importados desde ZKTECO.");
                    newPosition.setStatus(RecordStatus.ACTIVE);
                    return positionRepository.save(newPosition);
                });

        Site site = siteRepository.findByNameIgnoreCase(DEFAULT_SITE_NAME)
                .orElseGet(() -> {
                    Site newSite = new Site();
                    newSite.setName(DEFAULT_SITE_NAME);
                    newSite.setDescription("Sede temporal para trabajadores importados desde ZKTECO.");
                    newSite.setStatus(RecordStatus.ACTIVE);
                    return siteRepository.save(newSite);
                });

        Role employeeRole = roleRepository.findByName(RoleName.EMPLOYEE)
                .orElseThrow(() -> new IllegalStateException("El rol EMPLOYEE no existe."));

        return new ImportDefaults(area, position, site, employeeRole);
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (Cell cell : row) {
            if (!normalize(formatter.formatCellValue(cell)).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String requiredValue(Row row, Map<String, Integer> headers, DataFormatter formatter, String header) {
        String value = value(row, headers, formatter, header);
        if (value.isBlank()) {
            throw new IllegalArgumentException("La columna " + header + " es requerida.");
        }
        return value;
    }

    private String value(Row row, Map<String, Integer> headers, DataFormatter formatter, String header) {
        Integer column = headers.get(header);
        if (column == null) {
            return "";
        }
        return normalize(formatter.formatCellValue(row.getCell(column)));
    }

    private LocalDate parseDate(String value) {
        for (DateTimeFormatter dateFormatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(value, dateFormatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new IllegalArgumentException("Fecha inválida: " + value);
    }

    private LocalTime parseOptionalTime(String value) {
        if (value.isBlank()) {
            return null;
        }

        for (DateTimeFormatter timeFormatter : TIME_FORMATTERS) {
            try {
                return LocalTime.parse(value, timeFormatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new IllegalArgumentException("Hora inválida: " + value);
    }

    private int parseDurationMinutes(String value) {
        if (value.isBlank()) {
            return 0;
        }

        LocalTime durationTime = parseOptionalTime(value);
        return (int) Duration.between(LocalTime.MIDNIGHT, durationTime).toMinutes();
    }

    private Instant toInstant(LocalDate date, LocalTime time) {
        if (time == null) {
            return null;
        }
        return LocalDateTime.of(date, time)
                .atZone(ZoneId.systemDefault())
                .toInstant();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private record ImportDefaults(Area area, Position position, Site site, Role employeeRole) {
    }

    private static class ImportCounters {
        private int rowsRead;
        private int attendanceCreated;
        private int attendanceUpdated;
        private int employeesCreated;
        private int rowsSkipped;
    }

    private record ImportRow(
            String biometricCode,
            String employeeName,
            LocalDate attendanceDate,
            LocalTime checkIn,
            LocalTime checkOut,
            AttendanceStatus status,
            int lateMinutes,
            int workedMinutes,
            int extraMinutes,
            String scheduledCheckIn,
            String scheduledCheckOut,
            String workday,
            String workedTime,
            String extraTime
    ) {
        private String toNotes() {
            List<String> notes = new ArrayList<>();
            notes.add("Importado desde ZKTECO.");
            addNote(notes, "Horario", scheduledCheckIn + " - " + scheduledCheckOut);
            addNote(notes, "Jornada", workday);
            addNote(notes, "Tiempo trabajado", workedTime);
            addNote(notes, "Tiempo extra", extraTime);
            return String.join(" ", notes);
        }

        private void addNote(List<String> notes, String label, String value) {
            if (value != null && !value.isBlank() && !value.equals(" - ")) {
                notes.add(label + ": " + value + ".");
            }
        }
    }
}
