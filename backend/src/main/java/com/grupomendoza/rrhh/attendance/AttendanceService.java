package com.grupomendoza.rrhh.attendance;

import com.grupomendoza.rrhh.attendance.dto.AttendanceRecordResponse;
import com.grupomendoza.rrhh.attendance.dto.AttendanceSummaryItemResponse;
import com.grupomendoza.rrhh.attendance.dto.CheckInRequest;
import com.grupomendoza.rrhh.attendance.dto.CheckOutRequest;
import com.grupomendoza.rrhh.attendance.dto.TodayAttendanceResponse;
import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceService {
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSettingsRepository attendanceSettingsRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public AttendanceService(
            AttendanceRecordRepository attendanceRecordRepository,
            AttendanceSettingsRepository attendanceSettingsRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository
    ) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.attendanceSettingsRepository = attendanceSettingsRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AttendanceRecordResponse checkIn(AuthenticatedUser currentUser, CheckInRequest request) {
        Employee employee = requireCurrentEmployee(currentUser);
        ensureEmployeeIsActive(employee);

        LocalDate attendanceDate = LocalDate.now();
        AttendanceSettings settings = loadSettings();
        AttendanceRecord record = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(employee.getId(), attendanceDate)
                .orElseGet(() -> createEmptyRecord(employee, attendanceDate));

        if (record.getCheckInAt() != null) {
            throw new IllegalStateException("A check-in already exists for today.");
        }

        Instant now = Instant.now();
        LocalTime currentTime = LocalDateTime.ofInstant(now, ZoneId.systemDefault()).toLocalTime();
        int lateMinutes = (int) Math.max(
                0,
                ChronoUnit.MINUTES.between(settings.getWorkdayStartTime(), currentTime)
        );

        record.setCheckInAt(now);
        record.setSource(AttendanceSource.MANUAL);
        record.setLateMinutes(lateMinutes);
        record.setStatus(lateMinutes > settings.getLateToleranceMinutes()
                ? AttendanceStatus.LATE
                : AttendanceStatus.PRESENT);
        record.setNotes(mergeNotes(record.getNotes(), request.notes()));
        clearJustification(record);

        return toRecordResponse(attendanceRecordRepository.save(record));
    }

    @Transactional
    public AttendanceRecordResponse checkOut(AuthenticatedUser currentUser, CheckOutRequest request) {
        Employee employee = requireCurrentEmployee(currentUser);
        ensureEmployeeIsActive(employee);

        AttendanceRecord record = attendanceRecordRepository
                .findDetailedByEmployeeIdAndAttendanceDate(employee.getId(), LocalDate.now())
                .orElseThrow(() -> new IllegalStateException("Check-in is required before check-out."));

        if (record.getCheckInAt() == null) {
            throw new IllegalStateException("Check-in is required before check-out.");
        }

        if (record.getCheckOutAt() != null) {
            throw new IllegalStateException("A check-out already exists for today.");
        }

        Instant now = Instant.now();
        if (now.isBefore(record.getCheckInAt())) {
            throw new IllegalStateException("Check-out cannot be earlier than check-in.");
        }

        record.setCheckOutAt(now);
        record.setNotes(mergeNotes(record.getNotes(), request.notes()));

        return toRecordResponse(attendanceRecordRepository.save(record));
    }

    @Transactional(readOnly = true)
    public TodayAttendanceResponse getToday(AuthenticatedUser currentUser) {
        Employee employee = requireCurrentEmployee(currentUser);
        AttendanceRecord record = attendanceRecordRepository
                .findDetailedByEmployeeIdAndAttendanceDate(employee.getId(), LocalDate.now())
                .orElse(null);

        if (record == null) {
            return new TodayAttendanceResponse(LocalDate.now(), false, null, null, null, null, null, null, null, null, null, null);
        }

        return new TodayAttendanceResponse(
                record.getAttendanceDate(),
                true,
                record.getId(),
                record.getCheckInAt(),
                record.getCheckOutAt(),
                record.getStatus().name(),
                record.getLateMinutes(),
                record.getSource().name(),
                record.getNotes(),
                record.getJustificationNote(),
                record.getJustifiedByUser() != null ? record.getJustifiedByUser().getFullName() : null,
                record.getJustifiedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getOwnHistory(
            AuthenticatedUser currentUser,
            LocalDate startDate,
            LocalDate endDate
    ) {
        validateDateRange(startDate, endDate);
        Employee employee = requireCurrentEmployee(currentUser);

        return attendanceRecordRepository.findHistoryByEmployeeId(employee.getId(), startDate, endDate).stream()
                .map(this::toRecordResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceSummaryItemResponse> getSummary(
            AuthenticatedUser currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Long employeeId
    ) {
        validateDateRange(startDate, endDate);
        AttendanceStatus parsedStatus = SearchQuery.parseEnum(status, AttendanceStatus.class);

        Long areaId = null;
        Long excludedEmployeeId = null;
        if (currentUser.getRoles().contains("MANAGER") && !currentUser.getRoles().contains("ADMIN")) {
            Employee managerEmployee = requireCurrentEmployee(currentUser);
            areaId = managerEmployee.getPosition().getArea().getId();
            excludedEmployeeId = managerEmployee.getId();
        }

        return attendanceRecordRepository
                .searchSummary(startDate, endDate, parsedStatus, employeeId, areaId, excludedEmployeeId)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional
    public List<AttendanceSummaryItemResponse> closeDay(AuthenticatedUser currentUser, LocalDate attendanceDate) {
        User actor = requireUser(currentUser);
        Set<Long> existingEmployeeIds = new HashSet<>(attendanceRecordRepository.findEmployeeIdsWithRecordOnDate(attendanceDate));

        List<AttendanceRecord> createdRecords = employeeRepository.findAllActiveDetailed().stream()
                .filter(employee -> !existingEmployeeIds.contains(employee.getId()))
                .map(employee -> {
                    AttendanceRecord record = createEmptyRecord(employee, attendanceDate);
                    record.setSource(AttendanceSource.MANUAL);
                    record.setStatus(AttendanceStatus.ABSENT);
                    record.setJustifiedAt(null);
                    record.setJustifiedByUser(null);
                    record.setJustificationNote(null);
                    record.setNotes("Registro generado por cierre diario.");
                    return record;
                })
                .toList();

        if (createdRecords.isEmpty()) {
            return List.of();
        }

        List<AttendanceRecord> savedRecords = attendanceRecordRepository.saveAll(createdRecords);
        return savedRecords.stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional
    public AttendanceSummaryItemResponse justify(AuthenticatedUser currentUser, Long id, String justificationNote) {
        AttendanceRecord record = attendanceRecordRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attendance record not found."));

        if (record.getStatus() != AttendanceStatus.LATE && record.getStatus() != AttendanceStatus.ABSENT) {
            throw new IllegalStateException("Only late or absent records can be justified.");
        }

        record.setStatus(record.getStatus() == AttendanceStatus.LATE
                ? AttendanceStatus.JUSTIFIED_LATE
                : AttendanceStatus.JUSTIFIED_ABSENT);
        record.setJustificationNote(justificationNote.trim());
        record.setJustifiedByUser(requireUser(currentUser));
        record.setJustifiedAt(Instant.now());

        return toSummaryResponse(attendanceRecordRepository.save(record));
    }

    private AttendanceSettings loadSettings() {
        return attendanceSettingsRepository.findTopByOrderByIdAsc()
                .orElseThrow(() -> new IllegalStateException("Attendance settings have not been configured."));
    }

    private Employee requireCurrentEmployee(AuthenticatedUser currentUser) {
        return employeeRepository.findDetailedByUserId(currentUser.getId())
                .orElseThrow(() -> new IllegalStateException("Current user is not linked to an employee profile."));
    }

    private User requireUser(AuthenticatedUser currentUser) {
        return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));
    }

    private void ensureEmployeeIsActive(Employee employee) {
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new IllegalStateException("Inactive employees cannot register attendance.");
        }
    }

    private AttendanceRecord createEmptyRecord(Employee employee, LocalDate attendanceDate) {
        AttendanceRecord record = new AttendanceRecord();
        record.setEmployee(employee);
        record.setAttendanceDate(attendanceDate);
        record.setLateMinutes(0);
        record.setSource(AttendanceSource.MANUAL);
        record.setStatus(AttendanceStatus.PRESENT);
        return record;
    }

    private void clearJustification(AttendanceRecord record) {
        record.setJustificationNote(null);
        record.setJustifiedByUser(null);
        record.setJustifiedAt(null);
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }
    }

    private String mergeNotes(String existingNotes, String nextNote) {
        if (nextNote == null || nextNote.isBlank()) {
            return existingNotes;
        }

        if (existingNotes == null || existingNotes.isBlank()) {
            return nextNote.trim();
        }

        return existingNotes + " | " + nextNote.trim();
    }

    private AttendanceRecordResponse toRecordResponse(AttendanceRecord record) {
        return new AttendanceRecordResponse(
                record.getId(),
                record.getAttendanceDate(),
                record.getCheckInAt(),
                record.getCheckOutAt(),
                record.getStatus().name(),
                record.getLateMinutes(),
                record.getSource().name(),
                record.getNotes(),
                record.getJustificationNote(),
                record.getJustifiedByUser() != null ? record.getJustifiedByUser().getFullName() : null,
                record.getJustifiedAt()
        );
    }

    private AttendanceSummaryItemResponse toSummaryResponse(AttendanceRecord record) {
        return new AttendanceSummaryItemResponse(
                record.getId(),
                record.getEmployee().getId(),
                record.getEmployee().getUser().getFullName(),
                record.getEmployee().getUser().getEmail(),
                record.getEmployee().getPosition().getArea().getName(),
                record.getEmployee().getPosition().getName(),
                record.getEmployee().getSite().getName(),
                record.getAttendanceDate(),
                record.getCheckInAt(),
                record.getCheckOutAt(),
                record.getStatus().name(),
                record.getLateMinutes(),
                record.getSource().name(),
                record.getNotes(),
                record.getJustificationNote(),
                record.getJustifiedByUser() != null ? record.getJustifiedByUser().getFullName() : null,
                record.getJustifiedAt()
        );
    }
}
