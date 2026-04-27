package com.grupomendoza.rrhh.user;

import com.grupomendoza.rrhh.role.RoleName;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select distinct u
            from User u
            left join u.roles r
            where (:search is null
                   or lower(u.fullName) like concat('%', cast(:search as string), '%')
                   or lower(u.email) like concat('%', cast(:search as string), '%'))
              and (:status is null or u.status = :status)
              and (:roleName is null or r.name = :roleName)
            order by u.fullName asc
            """)
    java.util.List<User> search(
            @Param("search") String search,
            @Param("status") UserStatus status,
            @Param("roleName") RoleName roleName
    );

    @Query("""
            select distinct u
            from User u
            left join fetch u.roles
            left join fetch u.employee e
            left join fetch e.position p
            left join fetch p.area
            left join fetch e.site
            where u.id = :id
            """)
    Optional<User> findDetailedById(@Param("id") Long id);
}
