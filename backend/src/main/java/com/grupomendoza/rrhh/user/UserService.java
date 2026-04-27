package com.grupomendoza.rrhh.user;

import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.common.roles.RoleLabelMapper;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.role.Role;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.role.RoleRepository;
import com.grupomendoza.rrhh.user.dto.CreateUserRequest;
import com.grupomendoza.rrhh.user.dto.UpdateUserRequest;
import com.grupomendoza.rrhh.user.dto.UserDetailResponse;
import com.grupomendoza.rrhh.user.dto.UserEmployeeSummaryResponse;
import com.grupomendoza.rrhh.user.dto.UserListItemResponse;
import jakarta.persistence.EntityNotFoundException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserListItemResponse> list(String search, String status, String role) {
        UserStatus parsedStatus = SearchQuery.parseEnum(status, UserStatus.class);
        RoleName parsedRole = SearchQuery.parseEnum(role, RoleName.class);
        return userRepository.search(SearchQuery.normalize(search), parsedStatus, parsedRole).stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse get(Long id) {
        return toDetail(findUser(id));
    }

    @Transactional
    public UserDetailResponse create(CreateUserRequest request) {
        validateUniqueEmail(request.email(), null);

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(singleRoleSet(parseRoleName(request.role())));

        return toDetail(userRepository.save(user));
    }

    @Transactional
    public UserDetailResponse update(Long id, UpdateUserRequest request) {
        User user = findUser(id);
        validateUniqueEmail(request.email(), id);

        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setRoles(singleRoleSet(parseRoleName(request.role())));

        return toDetail(userRepository.save(user));
    }

    @Transactional
    public UserDetailResponse updateStatus(Long id, String status) {
        User user = findUser(id);
        user.setStatus(SearchQuery.parseEnum(status, UserStatus.class));

        if (user.getEmployee() != null) {
            user.getEmployee().setStatus(user.getStatus() == UserStatus.ACTIVE
                    ? EmployeeStatus.ACTIVE
                    : EmployeeStatus.INACTIVE);
        }

        return toDetail(userRepository.save(user));
    }

    public User findUser(Long id) {
        return userRepository.findDetailedById(id)
                .orElseGet(() -> userRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("User not found.")));
    }

    public void validateUniqueEmail(String email, Long currentUserId) {
        String normalizedEmail = email.trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(user -> currentUserId == null || !user.getId().equals(currentUserId))
                .ifPresent(user -> {
                    throw new IllegalStateException("A user with this email already exists.");
                });
    }

    public Set<Role> singleRoleSet(RoleName roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new EntityNotFoundException("Role not found."));

        LinkedHashSet<Role> roles = new LinkedHashSet<>();
        roles.add(role);
        return roles;
    }

    public RoleName parseRoleName(String role) {
        return SearchQuery.parseEnum(role, RoleName.class);
    }

    private UserListItemResponse toListItem(User user) {
        RoleName role = extractPrimaryRole(user);
        return new UserListItemResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                role.name(),
                RoleLabelMapper.toLabel(role),
                user.getStatus().name(),
                user.getEmployee() != null
        );
    }

    private UserDetailResponse toDetail(User user) {
        RoleName role = extractPrimaryRole(user);
        Employee employee = user.getEmployee();
        UserEmployeeSummaryResponse employeeSummary = null;

        if (employee != null) {
            employeeSummary = new UserEmployeeSummaryResponse(
                    employee.getId(),
                    employee.getDni(),
                    employee.getPosition().getName(),
                    employee.getPosition().getArea().getName(),
                    employee.getSite().getName(),
                    employee.getStatus().name()
            );
        }

        return new UserDetailResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                role.name(),
                RoleLabelMapper.toLabel(role),
                user.getStatus().name(),
                employeeSummary
        );
    }

    private RoleName extractPrimaryRole(User user) {
        return user.getRoles().stream()
                .findFirst()
                .map(Role::getName)
                .orElseThrow(() -> new IllegalStateException("User has no assigned role."));
    }
}
