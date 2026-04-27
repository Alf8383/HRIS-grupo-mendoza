package com.grupomendoza.rrhh.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);

    @Query("""
            select ar
            from AttendanceRecord ar
            join fetch ar.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch ar.justifiedByUser
            where e.id = :employeeId
              and ar.attendanceDate = :attendanceDate
            """)
    Optional<AttendanceRecord> findDetailedByEmployeeIdAndAttendanceDate(
            @Param("employeeId") Long employeeId,
            @Param("attendanceDate") LocalDate attendanceDate
    );

    @Query("""
            select ar
            from AttendanceRecord ar
            join fetch ar.employee e
            join fetch e.user
            left join fetch ar.justifiedByUser
            where e.id = :employeeId
              and (:startDate is null or ar.attendanceDate >= :startDate)
              and (:endDate is null or ar.attendanceDate <= :endDate)
            order by ar.attendanceDate desc, ar.id desc
            """)
    List<AttendanceRecord> findHistoryByEmployeeId(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            select ar
            from AttendanceRecord ar
            join fetch ar.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch ar.justifiedByUser
            where (:startDate is null or ar.attendanceDate >= :startDate)
              and (:endDate is null or ar.attendanceDate <= :endDate)
              and (:status is null or ar.status = :status)
              and (:employeeId is null or e.id = :employeeId)
              and (:areaId is null or p.area.id = :areaId)
              and (:excludedEmployeeId is null or e.id <> :excludedEmployeeId)
            order by ar.attendanceDate desc, u.fullName asc
            """)
    List<AttendanceRecord> searchSummary(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") AttendanceStatus status,
            @Param("employeeId") Long employeeId,
            @Param("areaId") Long areaId,
            @Param("excludedEmployeeId") Long excludedEmployeeId
    );

    @Query("""
            select ar
            from AttendanceRecord ar
            join fetch ar.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch ar.justifiedByUser
            where ar.id = :id
            """)
    Optional<AttendanceRecord> findDetailedById(@Param("id") Long id);

    @Query("""
            select ar.employee.id
            from AttendanceRecord ar
            where ar.attendanceDate = :attendanceDate
            """)
    List<Long> findEmployeeIdsWithRecordOnDate(@Param("attendanceDate") LocalDate attendanceDate);
}
