package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaCumplimientoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.ExportReporteAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
import pe.albrugroup.schedule_service.service.ReporteAsistenciaExcelService;
import pe.albrugroup.schedule_service.usecase.IAsistencia;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/revision/asistencia")
public class RevisionController {

    private final IAsistencia asistenciaService;
    private final ReporteAsistenciaExcelService reporteExcelService;

    @PostMapping("/cumplimiento/resumen")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_CUMPLIMIENTO')")
    public ResponseEntity<CumplimientoResumenResponse> getCumplimientoResumen(@Valid @RequestBody ConsultaCumplimientoRequest request) {
        return ResponseEntity.ok(asistenciaService.getCumplimientoResumen(request));
    }

    @PostMapping("/cumplimiento/detalle")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_CUMPLIMIENTO')")
    public ResponseEntity<CumplimientoDetalleResponse> getCumplimientoDetalle(@Valid @RequestBody ConsultaCumplimientoRequest request) {
        return ResponseEntity.ok(asistenciaService.getCumplimientoDetalle(request));
    }

    @PostMapping("/cumplimiento/export-excel")
    @PreAuthorize("hasAuthority('EXPORT_REPORTE_ASISTENCIA')")
    public ResponseEntity<StreamingResponseBody> exportExcel(@Valid @RequestBody ExportReporteAsistenciaRequest request) {
        StreamingResponseBody body = reporteExcelService.generarExcel(request);
        String filename = "reporte-asistencias-" + request.getDesde() + "-" + request.getHasta() + ".xlsx";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }

    @PostMapping("/monitor/estados")
    @PreAuthorize("hasAuthority('READ_ASISTENCIAS_MONITOR')")
    public ResponseEntity<List<EstadoMonitorResponse>> getEstadosMonitor(@Valid @RequestBody ConsultaMonitoreoRequest request) {
        return ResponseEntity.ok(asistenciaService.getEstadosMonitor(request));
    }
}
