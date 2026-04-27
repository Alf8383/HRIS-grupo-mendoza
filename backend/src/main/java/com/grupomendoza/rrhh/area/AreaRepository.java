package com.grupomendoza.rrhh.area;

import com.grupomendoza.rrhh.common.status.RecordStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AreaRepository extends JpaRepository<Area, Long> {
    boolean existsByNameIgnoreCase(String name);

    @Query("""
            select a
            from Area a
            where (:search is null or lower(a.name) like concat('%', cast(:search as string), '%'))
              and (:status is null or a.status = :status)
            order by a.name asc
            """)
    List<Area> search(@Param("search") String search, @Param("status") RecordStatus status);

    Optional<Area> findByNameIgnoreCase(String name);
}
