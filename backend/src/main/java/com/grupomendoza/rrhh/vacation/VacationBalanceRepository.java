package com.grupomendoza.rrhh.vacation;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VacationBalanceRepository extends JpaRepository<VacationBalance, Long> {
    @Query("""
            select vb
            from VacationBalance vb
            join fetch vb.employee e
            join fetch e.user
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            where e.id = :employeeId
            """)
    Optional<VacationBalance> findDetailedByEmployeeId(@Param("employeeId") Long employeeId);
}
