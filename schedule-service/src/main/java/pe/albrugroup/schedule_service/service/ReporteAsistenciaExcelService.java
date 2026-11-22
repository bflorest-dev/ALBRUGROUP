package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaCumplimientoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.EmpleadoExportInfo;
import pe.albrugroup.schedule_service.entity.request.asistencia.ExportReporteAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleDiaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleEmpleadoResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenEmpleadoResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenResponse;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteAsistenciaExcelService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final String[] RESUMEN_HEADERS = {
            "Nombre", "DNI", "Categoría", "Rol",
            "Tardanzas", "Faltas",
            "Días laborables", "Días con registro", "Días sin registro",
            "Min. objetivo", "Min. trabajados", "Min. balance"
    };

    private static final String[] DETALLE_HEADERS = {
            "Nombre", "DNI", "Fecha", "Laborable", "Tipo día no laborable",
            "Entrada programada", "Entrada real", "Salida programada", "Salida real",
            "Min. objetivo", "Min. trabajados", "Min. balance", "Tardanza"
    };

    private final IAsistencia asistenciaService;

    public StreamingResponseBody generarExcel(ExportReporteAsistenciaRequest request) {
        List<Long> empleadoIds = request.getEmpleados().stream()
                .map(EmpleadoExportInfo::getId)
                .toList();

        ConsultaCumplimientoRequest consulta = ConsultaCumplimientoRequest.builder()
                .empleadoIds(empleadoIds)
                .desde(request.getDesde())
                .hasta(request.getHasta())
                .build();

        CumplimientoResumenResponse resumen = asistenciaService.getCumplimientoResumen(consulta);
        CumplimientoDetalleResponse detalle = asistenciaService.getCumplimientoDetalle(consulta);

        Map<Long, EmpleadoExportInfo> infoMap = request.getEmpleados().stream()
                .collect(Collectors.toMap(EmpleadoExportInfo::getId, Function.identity()));

        return outputStream -> {
            try (SXSSFWorkbook wb = new SXSSFWorkbook(100)) {
                CellStyle headerStyle = crearHeaderStyle(wb);

                escribirHojaResumen(wb, headerStyle, resumen.getEmpleados(), infoMap);
                escribirHojaDetalle(wb, headerStyle, detalle.getEmpleados(), infoMap);

                wb.write(outputStream);
                outputStream.flush();
            }
        };
    }

    private void escribirHojaResumen(SXSSFWorkbook wb, CellStyle headerStyle,
                                     List<CumplimientoResumenEmpleadoResponse> empleados,
                                     Map<Long, EmpleadoExportInfo> infoMap) {
        Sheet sheet = wb.createSheet("Resumen");
        int rowIdx = 0;

        Row header = sheet.createRow(rowIdx++);
        for (int i = 0; i < RESUMEN_HEADERS.length; i++) {
            var cell = header.createCell(i);
            cell.setCellValue(RESUMEN_HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        for (CumplimientoResumenEmpleadoResponse emp : empleados) {
            EmpleadoExportInfo info = infoMap.get(emp.getIdEmpleado());
            Row row = sheet.createRow(rowIdx++);
            int col = 0;
            row.createCell(col++).setCellValue(info != null ? info.getNombre() : String.valueOf(emp.getIdEmpleado()));
            row.createCell(col++).setCellValue(info != null ? safe(info.getDni()) : "");
            row.createCell(col++).setCellValue(info != null ? safe(info.getCategoria()) : "");
            row.createCell(col++).setCellValue(info != null ? safe(info.getRol()) : "");
            row.createCell(col++).setCellValue(safeInt(emp.getCantidadTardanzas()));
            row.createCell(col++).setCellValue(safeInt(emp.getCantidadFaltas()));
            row.createCell(col++).setCellValue(safeInt(emp.getDiasLaborables()));
            row.createCell(col++).setCellValue(safeInt(emp.getDiasConRegistro()));
            row.createCell(col++).setCellValue(safeInt(emp.getDiasSinRegistro()));
            row.createCell(col++).setCellValue(safeInt(emp.getMinutosObjetivo()));
            row.createCell(col++).setCellValue(safeInt(emp.getMinutosTrabajados()));
            row.createCell(col).setCellValue(safeInt(emp.getMinutosBalance()));
        }
    }

    private void escribirHojaDetalle(SXSSFWorkbook wb, CellStyle headerStyle,
                                     List<CumplimientoDetalleEmpleadoResponse> empleados,
                                     Map<Long, EmpleadoExportInfo> infoMap) {
        Sheet sheet = wb.createSheet("Detalle");
        int rowIdx = 0;

        Row header = sheet.createRow(rowIdx++);
        for (int i = 0; i < DETALLE_HEADERS.length; i++) {
            var cell = header.createCell(i);
            cell.setCellValue(DETALLE_HEADERS[i]);
            cell.setCellStyle(headerStyle);
        }

        for (CumplimientoDetalleEmpleadoResponse emp : empleados) {
            EmpleadoExportInfo info = infoMap.get(emp.getIdEmpleado());
            String nombre = info != null ? info.getNombre() : String.valueOf(emp.getIdEmpleado());
            String dni = info != null ? safe(info.getDni()) : "";

            for (CumplimientoDetalleDiaResponse dia : emp.getDias()) {
                Row row = sheet.createRow(rowIdx++);
                int col = 0;
                row.createCell(col++).setCellValue(nombre);
                row.createCell(col++).setCellValue(dni);
                row.createCell(col++).setCellValue(dia.getFecha() != null ? dia.getFecha().format(DATE_FMT) : "");
                row.createCell(col++).setCellValue(Boolean.TRUE.equals(dia.getLaborable()) ? "Sí" : "No");
                row.createCell(col++).setCellValue(safe(dia.getTipoDiaNoLaborable()));
                row.createCell(col++).setCellValue(fmtTime(dia.getHoraEntradaEstablecida()));
                row.createCell(col++).setCellValue(fmtTime(dia.getHoraEntradaAsistencia()));
                row.createCell(col++).setCellValue(fmtTime(dia.getHoraSalidaEstablecida()));
                row.createCell(col++).setCellValue(fmtTime(dia.getHoraSalidaAsistencia()));
                row.createCell(col++).setCellValue(safeInt(dia.getMinutosObjetivoDia()));
                row.createCell(col++).setCellValue(safeInt(dia.getMinutosTrabajados()));
                row.createCell(col++).setCellValue(safeInt(dia.getMinutosBalance()));
                row.createCell(col).setCellValue(Boolean.TRUE.equals(dia.getTardanza()) ? "Sí" : "No");
            }
        }
    }

    private CellStyle crearHeaderStyle(SXSSFWorkbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private String fmtTime(LocalTime time) {
        return time != null ? time.format(TIME_FMT) : "";
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}
