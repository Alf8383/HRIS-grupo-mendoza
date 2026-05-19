package com.grupomendoza.rrhh.report;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class ExcelExportService {
    public byte[] export(String sheetName, List<String> headers, List<List<String>> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet(sheetName);
            writeRow(sheet.createRow(0), headers);

            for (int index = 0; index < rows.size(); index++) {
                writeRow(sheet.createRow(index + 1), rows.get(index));
            }

            for (int column = 0; column < headers.size(); column++) {
                sheet.autoSizeColumn(column);
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("The Excel export could not be generated.");
        }
    }

    private void writeRow(Row row, List<String> values) {
        for (int column = 0; column < values.size(); column++) {
            Cell cell = row.createCell(column);
            cell.setCellValue(values.get(column) != null ? values.get(column) : "");
        }
    }
}
