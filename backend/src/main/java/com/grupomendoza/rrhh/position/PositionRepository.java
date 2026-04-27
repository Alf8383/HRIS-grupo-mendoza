package com.grupomendoza.rrhh.position;

import com.grupomendoza.rrhh.common.status.RecordStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PositionRepository extends JpaRepository<Position, Long> {
    boolean existsByAreaIdAndNameIgnoreCase(Long areaId, String name);

    @Query("""
            select p
            from Position p
            join fetch p.area a
            where (:search is null or lower(p.name) like concat('%', cast(:search as string), '%'))
              and (:status is null or p.status = :status)
              and (:areaId is null or a.id = :areaId)
            order by a.name asc, p.name asc
            """)
    List<Position> search(
            @Param("search") String search,
            @Param("status") RecordStatus status,
            @Param("areaId") Long areaId
    );

    @Query("""
            select p
            from Position p
            join fetch p.area
            where p.id = :id
            """)
    Optional<Position> findDetailedById(@Param("id") Long id);
}
