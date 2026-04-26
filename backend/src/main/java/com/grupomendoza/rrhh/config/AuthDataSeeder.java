package com.grupomendoza.rrhh.config;

import com.grupomendoza.rrhh.role.Role;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.role.RoleRepository;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import com.grupomendoza.rrhh.user.UserStatus;
import java.util.Arrays;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuthDataSeeder implements ApplicationRunner {
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties adminSeedProperties;

    public AuthDataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AdminSeedProperties adminSeedProperties
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminSeedProperties = adminSeedProperties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Arrays.stream(RoleName.values()).forEach(this::ensureRole);
        ensureAdminUser();
    }

    private void ensureRole(RoleName roleName) {
        roleRepository.findByName(roleName).orElseGet(() -> {
            Role role = new Role();
            role.setName(roleName);
            role.setDescription("Seeded role for Sprint 0.");
            return roleRepository.save(role);
        });
    }

    private void ensureAdminUser() {
        userRepository.findByEmailIgnoreCase(adminSeedProperties.getEmail()).orElseGet(() -> {
            Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                    .orElseThrow(() -> new IllegalStateException("ADMIN role must exist before seeding user."));

            User user = new User();
            user.setFullName(adminSeedProperties.getFullName());
            user.setEmail(adminSeedProperties.getEmail().toLowerCase());
            user.setPasswordHash(passwordEncoder.encode(adminSeedProperties.getPassword()));
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(Set.of(adminRole));
            return userRepository.save(user);
        });
    }
}
