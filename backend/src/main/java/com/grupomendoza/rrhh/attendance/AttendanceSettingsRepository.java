package com.grupomendoza.rrhh.attendance;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSettingsRepository extends JpaRepository<AttendanceSettings, Long> {
    Optional<AttendanceSettings> findTopByOrderByIdAsc();
}
