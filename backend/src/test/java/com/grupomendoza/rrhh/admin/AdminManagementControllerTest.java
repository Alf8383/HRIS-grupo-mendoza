package com.grupomendoza.rrhh.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.role.RoleRepository;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import com.grupomendoza.rrhh.user.UserStatus;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminManagementControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void ensureHrUser() {
        if (userRepository.findByEmailIgnoreCase("hr@grupomendoza.com").isPresent()) {
            return;
        }

        User hrUser = new User();
        hrUser.setFullName("Recursos Humanos");
        hrUser.setEmail("hr@grupomendoza.com");
        hrUser.setPasswordHash(passwordEncoder.encode("Admin12345!"));
        hrUser.setStatus(UserStatus.ACTIVE);
        hrUser.setRoles(Set.of(roleRepository.findByName(RoleName.HR).orElseThrow()));
        userRepository.save(hrUser);
    }

    @Test
    void hrCannotAccessUsersEndpoint() throws Exception {
        String hrToken = loginAndGetToken("hr@grupomendoza.com", "Admin12345!");

        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + hrToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void adminCanCreateCatalogsAndEmployeeLifecycle() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Operaciones %d",
                          "description": "Area para pruebas"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede %d",
                          "description": "Sede para pruebas"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Analista %d",
                          "description": "Cargo para pruebas",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String employeeEmail = "empleado" + suffix + "@grupomendoza.com";
        Long employeeId = createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                """
                        {
                          "dni": "%d",
                          "fullName": "Empleado %d",
                          "email": "%s",
                          "phone": "999111222",
                          "hireDate": "2026-04-01",
                          "positionId": %d,
                          "siteId": %d,
                          "role": "EMPLOYEE",
                          "password": "ClaveTemporal123!"
                        }
                        """.formatted(70000000 + (suffix % 1000000), suffix, employeeEmail, positionId, siteId)
        );

        String employeeToken = loginAndGetToken(employeeEmail, "ClaveTemporal123!");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(employeeEmail));

        mockMvc.perform(patch("/api/v1/employees/{id}/status", employeeId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "INACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeStatus").value("INACTIVE"))
                .andExpect(jsonPath("$.data.userStatus").value("INACTIVE"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "ClaveTemporal123!"
                                }
                                """.formatted(employeeEmail)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTHENTICATION_FAILED"));
    }

    @Test
    void duplicateEmailIsRejectedForUsers() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Usuario duplicado",
                                  "email": "admin@grupomendoza.com",
                                  "password": "OtraClave123!",
                                  "role": "ADMIN"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void inactivePositionCannotBeAssignedToNewEmployee() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area Inactiva %d",
                          "description": "Area auxiliar"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede Inactiva %d",
                          "description": "Sede auxiliar"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Cargo Inactivo %d",
                          "description": "Cargo auxiliar",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        mockMvc.perform(patch("/api/v1/positions/{id}/status", positionId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "INACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        mockMvc.perform(post("/api/v1/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dni": "%d",
                                  "fullName": "Empleado rechazado",
                                  "email": "rechazado%d@grupomendoza.com",
                                  "phone": "999111333",
                                  "hireDate": "2026-04-02",
                                  "positionId": %d,
                                  "siteId": %d,
                                  "role": "EMPLOYEE",
                                  "password": "Temporal123!"
                                }
                                """.formatted(71000000 + (suffix % 1000000), suffix, positionId, siteId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void employeeAttendanceFlowSupportsCloseDayAndJustification() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        String hrToken = loginAndGetToken("hr@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Asistencia %d",
                          "description": "Area asistencia"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede asistencia %d",
                          "description": "Sede asistencia"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Asistente %d",
                          "description": "Cargo asistencia",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String employeeOneEmail = "attendance" + suffix + "@grupomendoza.com";
        String employeeTwoEmail = "absence" + suffix + "@grupomendoza.com";

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(72000000 + (suffix % 1000000), "Empleado Asistencia " + suffix, employeeOneEmail, positionId, siteId, "EMPLOYEE")
        );

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(73000000 + (suffix % 1000000), "Empleado Ausente " + suffix, employeeTwoEmail, positionId, siteId, "EMPLOYEE")
        );

        String employeeOneToken = loginAndGetToken(employeeOneEmail, "ClaveTemporal123!");
        LocalDate today = LocalDate.now();

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + employeeOneToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "notes": "Inicio de jornada"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.source").value("MANUAL"));

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + employeeOneToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "notes": "Fin de jornada"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.checkOutAt").exists());

        String closeDayBody = mockMvc.perform(post("/api/v1/attendance/close-day")
                        .header("Authorization", "Bearer " + hrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "attendanceDate": "%s"
                                }
                                """.formatted(today)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode closeDayRoot = objectMapper.readTree(closeDayBody);
        long absentRecordId = -1;
        for (JsonNode item : closeDayRoot.path("data")) {
            if (employeeTwoEmail.equals(item.path("employeeEmail").asText())) {
                absentRecordId = item.path("id").asLong();
            }
        }

        if (absentRecordId < 0) {
            throw new IllegalStateException("Absent record was not generated for the second employee.");
        }

        mockMvc.perform(patch("/api/v1/attendance/{id}/justify", absentRecordId)
                        .header("Authorization", "Bearer " + hrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "justificationNote": "Permiso validado por RRHH"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("JUSTIFIED_ABSENT"));

        mockMvc.perform(get("/api/v1/attendance/me/history")
                        .header("Authorization", "Bearer " + employeeOneToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].checkInAt").exists());
    }

    @Test
    void managerCanApproveOnlyOwnAreaLeaveRequests() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaOneId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area manager %d",
                          "description": "Area manager"
                        }
                        """.formatted(suffix)
        );

        Long areaTwoId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area externa %d",
                          "description": "Area externa"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede permisos %d",
                          "description": "Sede permisos"
                        }
                        """.formatted(suffix)
        );

        Long managerPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Jefatura %d",
                          "description": "Jefatura",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaOneId)
        );

        Long teamPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Analista team %d",
                          "description": "Team",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaOneId)
        );

        Long externalPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Analista externo %d",
                          "description": "Externo",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaTwoId)
        );

        String managerEmail = "manager" + suffix + "@grupomendoza.com";
        String teamEmployeeEmail = "team" + suffix + "@grupomendoza.com";
        String externalEmployeeEmail = "external" + suffix + "@grupomendoza.com";

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(74000000 + (suffix % 1000000), "Manager " + suffix, managerEmail, managerPositionId, siteId, "MANAGER")
        );

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(75000000 + (suffix % 1000000), "Team Employee " + suffix, teamEmployeeEmail, teamPositionId, siteId, "EMPLOYEE")
        );

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(76000000 + (suffix % 1000000), "External Employee " + suffix, externalEmployeeEmail, externalPositionId, siteId, "EMPLOYEE")
        );

        String managerToken = loginAndGetToken(managerEmail, "ClaveTemporal123!");
        String teamEmployeeToken = loginAndGetToken(teamEmployeeEmail, "ClaveTemporal123!");
        String externalEmployeeToken = loginAndGetToken(externalEmployeeEmail, "ClaveTemporal123!");

        Long ownAreaLeaveId = createLeaveRequestAndExtractId(teamEmployeeToken, "Permiso de salud");
        Long externalAreaLeaveId = createLeaveRequestAndExtractId(externalEmployeeToken, "Permiso externo");

        mockMvc.perform(post("/api/v1/leave-requests/{id}/approve", ownAreaLeaveId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reviewComment": "Aprobado por jefatura"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/leave-requests/{id}/approve", externalAreaLeaveId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reviewComment": "No corresponde"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void employeeCannotApproveOwnLeaveRequest() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area propia %d",
                          "description": "Area propia"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede propia %d",
                          "description": "Sede propia"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Cargo propio %d",
                          "description": "Cargo propio",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String employeeEmail = "selfleave" + suffix + "@grupomendoza.com";
        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(77000000 + (suffix % 1000000), "Empleado Solicita " + suffix, employeeEmail, positionId, siteId, "EMPLOYEE")
        );

        String employeeToken = loginAndGetToken(employeeEmail, "ClaveTemporal123!");
        Long leaveId = createLeaveRequestAndExtractId(employeeToken, "Permiso propio");

        mockMvc.perform(post("/api/v1/leave-requests/{id}/approve", leaveId)
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reviewComment": "Autoaprobación"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private Long createResourceAndExtractId(String path, String token, String content) throws Exception {
        String body = mockMvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(body);
        return root.path("data").path("id").asLong();
    }

    private Long createLeaveRequestAndExtractId(String token, String reason) throws Exception {
        String body = mockMvc.perform(post("/api/v1/leave-requests")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestType": "PERSONAL_PERMISSION",
                                  "startAt": "2026-05-05T09:00:00",
                                  "endAt": "2026-05-05T12:00:00",
                                  "reason": "%s"
                                }
                                """.formatted(reason)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(body);
        return root.path("data").path("id").asLong();
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(body);
        return root.path("data").path("accessToken").asText();
    }

    private String employeePayload(
            long dni,
            String fullName,
            String email,
            Long positionId,
            Long siteId,
            String role
    ) {
        return """
                {
                  "dni": "%d",
                  "fullName": "%s",
                  "email": "%s",
                  "phone": "999111444",
                  "hireDate": "2026-04-15",
                  "positionId": %d,
                  "siteId": %d,
                  "role": "%s",
                  "password": "ClaveTemporal123!"
                }
                """.formatted(dni, fullName, email, positionId, siteId, role);
    }
}
