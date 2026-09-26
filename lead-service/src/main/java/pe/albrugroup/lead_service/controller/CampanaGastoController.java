package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.CampanaGastoRequest;
import pe.albrugroup.lead_service.entity.request.ActualizarGastoCampanaRequest;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoRegistroEstadoResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenDiarioResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenMensualResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenPeriodoResponse;
import pe.albrugroup.lead_service.service.CampanaGastoService;

import java.time.LocalDate;
import java.util.Map;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/campanas")
public class CampanaGastoController {

    private final CampanaGastoService campanaGastoService;

    @PostMapping("/{idCampana}/gastos")
    @PreAuthorize("hasAuthority('UPDATE_CAMPANA')")
    public ResponseEntity<CampanaGastoResponse> registrarGasto(
            @PathVariable Long idCampana,
            @Valid @RequestBody CampanaGastoRequest request
    ) {
        var registro = campanaGastoService.registrarGasto(idCampana, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(registro);
    }

    @PutMapping("/{idCampana}/gastos/{idGasto}")
    @PreAuthorize("hasAuthority('UPDATE_CAMPANA')")
    public ResponseEntity<CampanaGastoResponse> actualizarGasto(
            @PathVariable Long idCampana,
            @PathVariable Long idGasto,
            @Valid @RequestBody ActualizarGastoCampanaRequest request
    ) {
        return ResponseEntity.ok(campanaGastoService.actualizarGasto(idCampana, idGasto, request));
    }

    @GetMapping("/{idCampana}/gastos/estado-registro")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<CampanaGastoRegistroEstadoResponse> obtenerEstadoRegistro(
            @PathVariable Long idCampana,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return ResponseEntity.ok(campanaGastoService.obtenerEstadoRegistro(idCampana, fecha));
    }

    @GetMapping("/{idCampana}/gastos")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<List<CampanaGastoResponse>> listarRegistrosDia(
            @PathVariable Long idCampana,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        var registros = campanaGastoService.listarRegistrosDia(idCampana, fecha);
        return ResponseEntity.status(HttpStatus.OK).body(registros);
    }

    @GetMapping("/{idCampana}/gastos/periodo")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<List<CampanaGastoResponse>> listarCierresDiariosPeriodo(
            @PathVariable Long idCampana,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        var registros = campanaGastoService.listarCierresDiariosPeriodo(idCampana, fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(registros);
    }

    @GetMapping("/{idCampana}/gastos/resumen-diario")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<CampanaGastoResumenDiarioResponse> obtenerResumenDiarioCampana(
            @PathVariable Long idCampana,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        var resumen = campanaGastoService.obtenerResumenDiarioCampana(idCampana, fecha);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }

    @GetMapping("/gastos/resumen-diario")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<CampanaGastoResumenDiarioResponse> obtenerResumenDiarioGlobal(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) Long idProveedor
    ) {
        var resumen = campanaGastoService.obtenerResumenDiarioGlobal(fecha, idProveedor);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }

    @GetMapping("/{idCampana}/gastos/resumen-mensual")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<CampanaGastoResumenMensualResponse> obtenerResumenMensualCampana(
            @PathVariable Long idCampana,
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes
    ) {
        var resumen = campanaGastoService.obtenerResumenMensualCampana(idCampana, anio, mes);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }

    @GetMapping("/gastos/resumen-mensual")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<CampanaGastoResumenMensualResponse> obtenerResumenMensualGlobal(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Long idProveedor
    ) {
        var resumen = campanaGastoService.obtenerResumenMensualGlobal(anio, mes, idProveedor);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }

    @GetMapping("/gastos/resumen-periodo")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<CampanaGastoResumenPeriodoResponse> obtenerResumenPeriodoGlobal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) Long idProveedor
    ) {
        var resumen = campanaGastoService.obtenerResumenPeriodoGlobal(fechaDesde, fechaHasta, idProveedor);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }

    @PostMapping("/gastos/mantenimiento/recalcular-historicos")
    @PreAuthorize("hasAuthority('RUN_LEAD_ETAPA_BACKFILL')")
    public ResponseEntity<Map<String, Integer>> recalcularHistoricos() {
        int recalculados = campanaGastoService.recalcularUltimosRegistrosHistoricos();
        return ResponseEntity.ok(Map.of("registrosDiariosRecalculados", recalculados));
    }
}
