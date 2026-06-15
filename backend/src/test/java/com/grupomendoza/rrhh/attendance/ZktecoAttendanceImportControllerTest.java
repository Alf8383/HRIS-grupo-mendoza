package com.grupomendoza.rrhh.attendance;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ZktecoAttendanceImportControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Test
    void adminCanImportZktecoFileCreateEmployeesAndUpdateExistingRecords() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        MockMultipartFile file = zktecoFile("""
                00000014|Salvador Díaz Ortiz|16/07/2012|08:00|17:00|07:59|17:23|||||09:00||||09:24
                00000024|Camilo González Buel|16/07/2012|08:00|17:00|08:54|17:10|00:54||||09:00||||08:16
                00000030|Lidia Romero Arce|16/07/2012|08:00|17:00|07:48||||X||||||
                """);

        mockMvc.perform(multipart("/api/v1/attendance/imports/zkteco")
                        .file(file)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rowsRead").value(3))
                .andExpect(jsonPath("$.data.employeesCreated").value(3))
                .andExpect(jsonPath("$.data.attendanceCreated").value(3))
                .andExpect(jsonPath("$.data.attendanceUpdated").value(0))
                .andExpect(jsonPath("$.data.rowsSkipped").value(0));

        var salvador = employeeRepository.findByBiometricCode("00000014").orElseThrow();
        var camilo = employeeRepository.findByBiometricCode("00000024").orElseThrow();
        var lidia = employeeRepository.findByBiometricCode("00000030").orElseThrow();

        var salvadorRecord = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(salvador.getId(), LocalDate.of(2012, 7, 16))
                .orElseThrow();
        var camiloRecord = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(camilo.getId(), LocalDate.of(2012, 7, 16))
                .orElseThrow();
        var lidiaRecord = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(lidia.getId(), LocalDate.of(2012, 7, 16))
                .orElseThrow();

        org.assertj.core.api.Assertions.assertThat(salvadorRecord.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        org.assertj.core.api.Assertions.assertThat(camiloRecord.getStatus()).isEqualTo(AttendanceStatus.LATE);
        org.assertj.core.api.Assertions.assertThat(camiloRecord.getLateMinutes()).isEqualTo(54);
        org.assertj.core.api.Assertions.assertThat(lidiaRecord.getStatus()).isEqualTo(AttendanceStatus.ABSENT);
        var detailedLidia = employeeRepository.findDetailedById(lidia.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(detailedLidia.getPosition().getArea().getName()).isEqualTo("ZKTECO");

        MockMultipartFile updatedFile = zktecoFile("""
                00000014|Salvador Díaz Ortiz|16/07/2012|08:00|17:00|08:30|17:23|00:30||||09:00||||08:53
                00000024|Camilo González Buel|16/07/2012|08:00|17:00|07:59|17:10|||||09:00||||09:11
                00000030|Lidia Romero Arce|16/07/2012|08:00|17:00|07:48||||X||||||
                """);

        mockMvc.perform(multipart("/api/v1/attendance/imports/zkteco")
                        .file(updatedFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeesCreated").value(0))
                .andExpect(jsonPath("$.data.attendanceCreated").value(0))
                .andExpect(jsonPath("$.data.attendanceUpdated").value(3));

        var updatedSalvadorRecord = attendanceRecordRepository
                .findByEmployeeIdAndAttendanceDate(salvador.getId(), LocalDate.of(2012, 7, 16))
                .orElseThrow();
        org.assertj.core.api.Assertions.assertThat(updatedSalvadorRecord.getStatus()).isEqualTo(AttendanceStatus.LATE);
        org.assertj.core.api.Assertions.assertThat(updatedSalvadorRecord.getLateMinutes()).isEqualTo(30);
    }

    @Test
    void zktecoImportRejectsMissingRequiredHeaders() throws Exception {
        String adminToken = loginAndGetToken("admin@grupomendoza.com", "Admin12345!");
        MockMultipartFile file = invalidZktecoFile();

        mockMvc.perform(multipart("/api/v1/attendance/imports/zkteco")
                        .file(file)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
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

    private MockMultipartFile zktecoFile(String rowsCsv) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Reporte de Asistencia");
            sheet.createRow(0).createCell(0).setCellValue("REPORTE DETALLADO DE ASISTENCIA - ZKTECO");
            sheet.createRow(1);
            var header = sheet.createRow(2);
            String[] headers = {
                    "Empleado", "Nombre", "Fecha", "Entrada (T)", "Salida (T)", "Entró", "Salió",
                    "Tarde", "Temprano", "Falta", "TieExt", "Jornada", "Excepción", "FinDeSemana",
                    "Feriado", "TieTrabajado"
            };
            for (int index = 0; index < headers.length; index++) {
                header.createCell(index).setCellValue(headers[index]);
            }

            String[] lines = rowsCsv.strip().split("\\R");
            for (int rowIndex = 0; rowIndex < lines.length; rowIndex++) {
                var row = sheet.createRow(3 + rowIndex);
                String[] values = lines[rowIndex].split("\\|", -1);
                for (int column = 0; column < values.length; column++) {
                    row.createCell(column).setCellValue(values[column]);
                }
            }

            workbook.write(outputStream);
            return new MockMultipartFile(
                    "file",
                    "Asistencia_ZKTECO_Detallado.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    outputStream.toByteArray()
            );
        }
    }

    private MockMultipartFile invalidZktecoFile() throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Reporte de Asistencia");
            var header = sheet.createRow(2);
            header.createCell(0).setCellValue("Empleado");
            workbook.write(outputStream);
            return new MockMultipartFile(
                    "file",
                    "zkteco-invalido.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    outputStream.toByteArray()
            );
        }
    }
}
