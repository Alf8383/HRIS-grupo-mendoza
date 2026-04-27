package com.grupomendoza.rrhh.attendance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalTime;

@Entity
@Table(name = "attendance_settings")
public class AttendanceSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "workday_start_time", nullable = false)
    private LocalTime workdayStartTime;

    @Column(name = "workday_end_time", nullable = false)
    private LocalTime workdayEndTime;

    @Column(name = "late_tolerance_minutes", nullable = false)
    private Integer lateToleranceMinutes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public LocalTime getWorkdayStartTime() {
        return workdayStartTime;
    }

    public LocalTime getWorkdayEndTime() {
        return workdayEndTime;
    }

    public Integer getLateToleranceMinutes() {
        return lateToleranceMinutes;
    }
}
