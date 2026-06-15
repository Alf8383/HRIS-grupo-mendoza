package com.grupomendoza.rrhh.employee;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByDniIgnoreCase(String dni);

    Optional<Employee> findByUserId(Long userId);

    Optional<Employee> findByBiometricCode(String biometricCode);

    @Query("""
            select e
            from Employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            where (:search is null
                   or lower(u.fullName) like concat('%', cast(:search as string), '%')
                   or lower(u.email) like concat('%', cast(:search as string), '%')
                   or lower(e.dni) like concat('%', cast(:search as string), '%')
                   or lower(e.biometricCode) like concat('%', cast(:search as string), '%'))
              and (:status is null or e.status = :status)
              and (:siteId is null or e.site.id = :siteId)
              and (:positionId is null or e.position.id = :positionId)
            order by u.fullName asc
            """)
    List<Employee> search(
            @Param("search") String search,
            @Param("status") EmployeeStatus status,
            @Param("siteId") Long siteId,
            @Param("positionId") Long positionId
    );

    @Query("""
            select e
            from Employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            where e.id = :id
            """)
    Optional<Employee> findDetailedById(@Param("id") Long id);

    @Query("""
            select e
            from Employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            where u.id = :userId
            """)
    Optional<Employee> findDetailedByUserId(@Param("userId") Long userId);

    @Query("""
            select e
            from Employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            where e.status = com.grupomendoza.rrhh.employee.EmployeeStatus.ACTIVE
              and u.status = com.grupomendoza.rrhh.user.UserStatus.ACTIVE
            order by u.fullName asc
            """)
    List<Employee> findAllActiveDetailed();

    @Query("""
            select e
            from Employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            where e.status = com.grupomendoza.rrhh.employee.EmployeeStatus.ACTIVE
              and u.status = com.grupomendoza.rrhh.user.UserStatus.ACTIVE
              and p.area.id = :areaId
              and (:excludedEmployeeId is null or e.id <> :excludedEmployeeId)
            order by u.fullName asc
            """)
    List<Employee> findActiveByAreaId(
            @Param("areaId") Long areaId,
            @Param("excludedEmployeeId") Long excludedEmployeeId
    );
}
