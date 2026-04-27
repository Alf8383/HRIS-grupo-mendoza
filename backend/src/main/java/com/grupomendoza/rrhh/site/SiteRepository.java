package com.grupomendoza.rrhh.site;

import com.grupomendoza.rrhh.common.status.RecordStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SiteRepository extends JpaRepository<Site, Long> {
    boolean existsByNameIgnoreCase(String name);

    @Query("""
            select s
            from Site s
            where (:search is null or lower(s.name) like concat('%', cast(:search as string), '%'))
              and (:status is null or s.status = :status)
            order by s.name asc
            """)
    List<Site> search(@Param("search") String search, @Param("status") RecordStatus status);

    Optional<Site> findByNameIgnoreCase(String name);
}
