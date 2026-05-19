package com.grupomendoza.rrhh.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
    void adminCannotUseOwnLeaveEndpointsWithoutEmployeeProfile() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");

        mockMvc.perform(get("/api/v1/leave-requests/my")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));

        mockMvc.perform(post("/api/v1/leave-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestType": "PERSONAL_PERMISSION",
                                  "startAt": "2026-05-05T09:00:00",
                                  "endAt": "2026-05-05T12:00:00",
                                  "reason": "Intento no permitido"
                                }
                                """))
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

    @Test
    void managerApprovesVacationAndBalanceIsUpdated() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area vacaciones %d",
                          "description": "Area vacaciones"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede vacaciones %d",
                          "description": "Sede vacaciones"
                        }
                        """.formatted(suffix)
        );

        Long managerPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Jefatura vacaciones %d",
                          "description": "Jefatura vacaciones",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        Long employeePositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Analista vacaciones %d",
                          "description": "Analista vacaciones",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String managerEmail = "vacmanager" + suffix + "@grupomendoza.com";
        String employeeEmail = "vacemployee" + suffix + "@grupomendoza.com";

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(78000000 + (suffix % 1000000), "Manager Vacaciones " + suffix, managerEmail, managerPositionId, siteId, "MANAGER")
        );

        Long employeeId = createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(79000000 + (suffix % 1000000), "Empleado Vacaciones " + suffix, employeeEmail, employeePositionId, siteId, "EMPLOYEE")
        );

        mockMvc.perform(put("/api/v1/vacations/balance/{employeeId}", employeeId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "availableDays": 15,
                                  "usedDays": 0,
                                  "pendingDays": 0,
                                  "notes": "Saldo inicial"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableDays").value(15));

        String employeeToken = loginAndGetToken(employeeEmail, "ClaveTemporal123!");
        String managerToken = loginAndGetToken(managerEmail, "ClaveTemporal123!");

        String vacationBody = mockMvc.perform(post("/api/v1/vacations/requests")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "startDate": "2026-06-01",
                                  "endDate": "2026-06-03",
                                  "observation": "Vacaciones familiares"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.requestedDays").value(3))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long vacationRequestId = objectMapper.readTree(vacationBody).path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/vacations/requests/{id}/approve", vacationRequestId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reviewComment": "Aprobado por jefatura"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        mockMvc.perform(get("/api/v1/vacations/balance/{employeeId}", employeeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.availableDays").value(15))
                .andExpect(jsonPath("$.data.usedDays").value(3))
                .andExpect(jsonPath("$.data.pendingDays").value(0));
    }

    @Test
    void vacationRequestCannotExceedAvailableBalance() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area saldo %d",
                          "description": "Area saldo"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede saldo %d",
                          "description": "Sede saldo"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Cargo saldo %d",
                          "description": "Cargo saldo",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String employeeEmail = "saldo" + suffix + "@grupomendoza.com";
        Long employeeId = createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(80000000 + (suffix % 1000000), "Empleado Saldo " + suffix, employeeEmail, positionId, siteId, "EMPLOYEE")
        );

        mockMvc.perform(put("/api/v1/vacations/balance/{employeeId}", employeeId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "availableDays": 2,
                                  "usedDays": 0,
                                  "pendingDays": 0,
                                  "notes": null
                                }
                                """))
                .andExpect(status().isOk());

        String employeeToken = loginAndGetToken(employeeEmail, "ClaveTemporal123!");

        mockMvc.perform(post("/api/v1/vacations/requests")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "startDate": "2026-06-10",
                                  "endDate": "2026-06-13",
                                  "observation": "Exceso de saldo"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void hrCanCreateRenewAndListExpiringContracts() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        String hrToken = loginAndGetToken("hr@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area contratos %d",
                          "description": "Area contratos"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede contratos %d",
                          "description": "Sede contratos"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Cargo contratos %d",
                          "description": "Cargo contratos",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String employeeEmail = "contract" + suffix + "@grupomendoza.com";
        Long employeeId = createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(81000000 + (suffix % 1000000), "Empleado Contrato " + suffix, employeeEmail, positionId, siteId, "EMPLOYEE")
        );

        LocalDate expiringDate = LocalDate.now().plusDays(15);
        String contractBody = mockMvc.perform(post("/api/v1/contracts")
                        .header("Authorization", "Bearer " + hrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "employeeId": %d,
                                  "contractType": "FIXED_TERM",
                                  "startDate": "2026-01-01",
                                  "endDate": "%s",
                                  "status": "ACTIVE",
                                  "notes": "Contrato inicial"
                                }
                                """.formatted(employeeId, expiringDate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contractType").value("FIXED_TERM"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long contractId = objectMapper.readTree(contractBody).path("data").path("id").asLong();

        mockMvc.perform(post("/api/v1/contracts/{id}/renew", contractId)
                        .header("Authorization", "Bearer " + hrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contractType": "INDEFINITE",
                                  "startDate": "2026-12-01",
                                  "endDate": null,
                                  "status": "ACTIVE",
                                  "notes": "Renovación indefinida"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.previousContractId").value(contractId))
                .andExpect(jsonPath("$.data.contractType").value("INDEFINITE"));

        mockMvc.perform(get("/api/v1/contracts/employee/{employeeId}", employeeId)
                        .header("Authorization", "Bearer " + hrToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));

        mockMvc.perform(get("/api/v1/contracts/expiring")
                        .header("Authorization", "Bearer " + hrToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.employeeId == %d)]".formatted(employeeId)).isNotEmpty());
    }

    @Test
    void adminCanQueryAuditLogsAndEmployeeReports() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area reporte %d",
                          "description": "Area reporte"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede reporte %d",
                          "description": "Sede reporte"
                        }
                        """.formatted(suffix)
        );

        Long positionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Cargo reporte %d",
                          "description": "Cargo reporte",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaId)
        );

        String employeeEmail = "report" + suffix + "@grupomendoza.com";
        String employeeName = "Empleado Reporte " + suffix;

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(82000000 + (suffix % 1000000), employeeName, employeeEmail, positionId, siteId, "EMPLOYEE")
        );

        mockMvc.perform(get("/api/v1/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("module", "EMPLOYEE")
                        .param("action", "CREATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].module").value("EMPLOYEE"))
                .andExpect(jsonPath("$.data[0].action").value("CREATE"));

        mockMvc.perform(get("/api/v1/reports/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", employeeName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].fullName").value(employeeName))
                .andExpect(jsonPath("$.data[0].siteName").value("Sede reporte " + suffix));

        mockMvc.perform(get("/api/v1/reports/employees/export")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", employeeName))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"reporte-empleados.xlsx\""))
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    void managerCanViewScopedRequestReportAndHrCanExportExpiringContracts() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        String hrToken = loginAndGetToken("hr@grupomendoza.com", "Admin12345!");
        long suffix = System.nanoTime();

        Long areaOneId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area reportes manager %d",
                          "description": "Area reportes manager"
                        }
                        """.formatted(suffix)
        );

        Long areaTwoId = createResourceAndExtractId(
                "/api/v1/areas",
                adminToken,
                """
                        {
                          "name": "Area reportes externa %d",
                          "description": "Area reportes externa"
                        }
                        """.formatted(suffix)
        );

        Long siteId = createResourceAndExtractId(
                "/api/v1/sites",
                adminToken,
                """
                        {
                          "name": "Sede reportes %d",
                          "description": "Sede reportes"
                        }
                        """.formatted(suffix)
        );

        Long managerPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Jefatura reportes %d",
                          "description": "Jefatura reportes",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaOneId)
        );

        Long teamPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Analista reportes %d",
                          "description": "Analista reportes",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaOneId)
        );

        Long externalPositionId = createResourceAndExtractId(
                "/api/v1/positions",
                adminToken,
                """
                        {
                          "name": "Analista reportes externo %d",
                          "description": "Analista reportes externo",
                          "areaId": %d
                        }
                        """.formatted(suffix, areaTwoId)
        );

        String managerEmail = "managerreport" + suffix + "@grupomendoza.com";
        String teamEmployeeEmail = "teamreport" + suffix + "@grupomendoza.com";
        String externalEmployeeEmail = "externalreport" + suffix + "@grupomendoza.com";

        createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(83000000 + (suffix % 1000000), "Manager Reportes " + suffix, managerEmail, managerPositionId, siteId, "MANAGER")
        );

        Long teamEmployeeId = createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(84000000 + (suffix % 1000000), "Team Reportes " + suffix, teamEmployeeEmail, teamPositionId, siteId, "EMPLOYEE")
        );

        Long externalEmployeeId = createResourceAndExtractId(
                "/api/v1/employees",
                adminToken,
                employeePayload(85000000 + (suffix % 1000000), "External Reportes " + suffix, externalEmployeeEmail, externalPositionId, siteId, "EMPLOYEE")
        );

        mockMvc.perform(put("/api/v1/vacations/balance/{employeeId}", teamEmployeeId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "availableDays": 10,
                                  "usedDays": 0,
                                  "pendingDays": 0,
                                  "notes": "Saldo de pruebas"
                                }
                                """))
                .andExpect(status().isOk());

        String managerToken = loginAndGetToken(managerEmail, "ClaveTemporal123!");
        String teamEmployeeToken = loginAndGetToken(teamEmployeeEmail, "ClaveTemporal123!");
        String externalEmployeeToken = loginAndGetToken(externalEmployeeEmail, "ClaveTemporal123!");

        createLeaveRequestAndExtractId(teamEmployeeToken, "Permiso visible para manager");

        mockMvc.perform(post("/api/v1/vacations/requests")
                        .header("Authorization", "Bearer " + teamEmployeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "startDate": "2026-07-01",
                                  "endDate": "2026-07-02",
                                  "observation": "Vacaciones visibles para manager"
                                }
                                """))
                .andExpect(status().isOk());

        createLeaveRequestAndExtractId(externalEmployeeToken, "Permiso externo no visible");

        mockMvc.perform(get("/api/v1/reports/requests")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("startDate", "2026-05-01")
                        .param("endDate", "2026-07-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.employeeEmail == '%s')]".formatted(teamEmployeeEmail)).isNotEmpty())
                .andExpect(jsonPath("$.data[?(@.employeeEmail == '%s' && @.sourceGroup == 'VACATION')]".formatted(teamEmployeeEmail)).isNotEmpty())
                .andExpect(jsonPath("$.data[?(@.employeeEmail == '%s')]".formatted(externalEmployeeEmail)).isEmpty());

        LocalDate expiringDate = LocalDate.now().plusDays(10);
        mockMvc.perform(post("/api/v1/contracts")
                        .header("Authorization", "Bearer " + hrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "employeeId": %d,
                                  "contractType": "FIXED_TERM",
                                  "startDate": "2026-01-01",
                                  "endDate": "%s",
                                  "status": "ACTIVE",
                                  "notes": "Contrato para exportación"
                                }
                                """.formatted(teamEmployeeId, expiringDate)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/reports/contracts/expiring/export")
                        .header("Authorization", "Bearer " + hrToken)
                        .param("thresholdDays", "30"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"reporte-contratos-por-vencer.xlsx\""))
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
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
