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
        return export(sheetName, List.of(), headers, rows);
    }

    public byte[] export(
            String sheetName,
            List<List<String>> kpis,
            List<String> headers,
            List<List<String>> rows
    ) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet(sheetName);
            int rowIndex = 0;

            if (!kpis.isEmpty()) {
                writeRow(sheet.createRow(rowIndex++), List.of("KPIs"));
                for (List<String> kpi : kpis) {
                    writeRow(sheet.createRow(rowIndex++), kpi);
                }
                rowIndex++;
            }

            writeRow(sheet.createRow(rowIndex++), headers);

            for (int index = 0; index < rows.size(); index++) {
                writeRow(sheet.createRow(rowIndex + index), rows.get(index));
            }

            int columnCount = Math.max(
                    headers.size(),
                    kpis.stream().mapToInt(List::size).max().orElse(0)
            );
            for (int column = 0; column < columnCount; column++) {
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
