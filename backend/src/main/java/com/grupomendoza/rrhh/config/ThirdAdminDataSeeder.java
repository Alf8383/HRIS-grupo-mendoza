package com.grupomendoza.rrhh.config;

import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.role.Role;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.role.RoleRepository;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import com.grupomendoza.rrhh.user.UserStatus;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@Order(2)
public class ThirdAdminDataSeeder implements ApplicationRunner {
    private static final String LEGACY_ADMIN_2_EMAIL = "admin2@grupomendoza.com";

    private final ThirdAdminSeedProperties seedProperties;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public ThirdAdminDataSeeder(
            ThirdAdminSeedProperties seedProperties,
            RoleRepository roleRepository,
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.seedProperties = seedProperties;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (seedProperties.isRemoveLegacyAdmin2()) {
            removeLegacyAdmin2();
        }

        if (!seedProperties.isEnabled()) {
            return;
        }

        if (!StringUtils.hasText(seedProperties.getFullName())
                || !StringUtils.hasText(seedProperties.getEmail())
                || !StringUtils.hasText(seedProperties.getPassword())) {
            throw new IllegalStateException("Admin 3 seed is enabled but incomplete.");
        }

        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role must exist before seeding admin 3."));

        userRepository.findByEmailIgnoreCase(seedProperties.getEmail()).ifPresentOrElse(user -> {
            user.setFullName(seedProperties.getFullName());
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(new LinkedHashSet<>(Set.of(adminRole)));
            userRepository.save(user);
        }, () -> {
            User user = new User();
            user.setFullName(seedProperties.getFullName());
            user.setEmail(seedProperties.getEmail().toLowerCase());
            user.setPasswordHash(passwordEncoder.encode(seedProperties.getPassword()));
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(new LinkedHashSet<>(Set.of(adminRole)));
            userRepository.save(user);
        });
    }

    private void removeLegacyAdmin2() {
        userRepository.findByEmailIgnoreCase(LEGACY_ADMIN_2_EMAIL).ifPresent(user -> {
            if (employeeRepository.findByUserId(user.getId()).isPresent()) {
                return;
            }

            userRepository.delete(user);
        });
    }
}
