package com.grupomendoza.rrhh.vacation;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VacationRequestRepository extends JpaRepository<VacationRequest, Long> {
    @Query("""
            select vr
            from VacationRequest vr
            join fetch vr.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch vr.reviewedByUser
            where e.id = :employeeId
            order by vr.createdAt desc
            """)
    List<VacationRequest> findOwn(@Param("employeeId") Long employeeId);

    @Query("""
            select vr
            from VacationRequest vr
            join fetch vr.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch vr.reviewedByUser
            where (:areaId is null or p.area.id = :areaId)
              and (:excludedEmployeeId is null or e.id <> :excludedEmployeeId)
            order by vr.createdAt desc
            """)
    List<VacationRequest> search(
            @Param("areaId") Long areaId,
            @Param("excludedEmployeeId") Long excludedEmployeeId
    );

    @Query("""
            select vr
            from VacationRequest vr
            join fetch vr.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch vr.reviewedByUser
            where vr.id = :id
            """)
    Optional<VacationRequest> findDetailedById(@Param("id") Long id);
}
