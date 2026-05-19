package com.grupomendoza.rrhh.audit;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
            select al
            from AuditLog al
            where (:userSearch is null or lower(al.userEmail) like concat('%', lower(cast(:userSearch as string)), '%'))
              and (:module is null or al.module = :module)
              and (:action is null or al.action = :action)
              and (:startAt is null or al.eventAt >= :startAt)
              and (:endAt is null or al.eventAt <= :endAt)
            order by al.eventAt desc, al.id desc
            """)
    List<AuditLog> search(
            @Param("userSearch") String userSearch,
            @Param("module") String module,
            @Param("action") String action,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt
    );
}
