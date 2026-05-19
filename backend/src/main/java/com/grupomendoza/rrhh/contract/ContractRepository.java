package com.grupomendoza.rrhh.contract;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    @Query("""
            select c
            from Contract c
            join fetch c.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch c.previousContract
            where e.id = :employeeId
            order by c.startDate desc, c.id desc
            """)
    List<Contract> findByEmployeeIdDetailed(@Param("employeeId") Long employeeId);

    @Query("""
            select c
            from Contract c
            join fetch c.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch c.previousContract
            where c.id = :id
            """)
    Optional<Contract> findDetailedById(@Param("id") Long id);

    @Query("""
            select c
            from Contract c
            join fetch c.employee e
            join fetch e.user u
            join fetch e.position p
            join fetch p.area
            join fetch e.site
            left join fetch c.previousContract
            where c.status = com.grupomendoza.rrhh.contract.ContractStatus.ACTIVE
              and c.endDate is not null
              and c.endDate >= :today
              and c.endDate <= :threshold
            order by c.endDate asc, u.fullName asc
            """)
    List<Contract> findExpiringBetween(
            @Param("today") LocalDate today,
            @Param("threshold") LocalDate threshold
    );
}
