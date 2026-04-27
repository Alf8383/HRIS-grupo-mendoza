package com.grupomendoza.rrhh.leave;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    @Query("""
            select lr
            from LeaveRequest lr
            join fetch lr.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch lr.reviewedByUser
            where e.id = :employeeId
            order by lr.createdAt desc
            """)
    List<LeaveRequest> findOwn(@Param("employeeId") Long employeeId);

    @Query("""
            select lr
            from LeaveRequest lr
            join fetch lr.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch lr.reviewedByUser
            where (:areaId is null or p.area.id = :areaId)
              and (:excludedEmployeeId is null or e.id <> :excludedEmployeeId)
            order by lr.createdAt desc
            """)
    List<LeaveRequest> search(
            @Param("areaId") Long areaId,
            @Param("excludedEmployeeId") Long excludedEmployeeId
    );

    @Query("""
            select lr
            from LeaveRequest lr
            join fetch lr.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch lr.reviewedByUser
            where lr.id = :id
            """)
    Optional<LeaveRequest> findDetailedById(@Param("id") Long id);
}
