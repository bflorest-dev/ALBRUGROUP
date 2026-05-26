package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.CampanaGastoRequest;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenDiarioResponse;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResumenMensualResponse;
import pe.albrugroup.lead_service.service.CampanaGastoService;

import java.time.LocalDate;
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

    @GetMapping("/{idCampana}/gastos")
    @PreAuthorize("hasAuthority('READ_CAMPANA')")
    public ResponseEntity<List<CampanaGastoResponse>> listarRegistrosDia(
            @PathVariable Long idCampana,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        var registros = campanaGastoService.listarRegistrosDia(idCampana, fecha);
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        var resumen = campanaGastoService.obtenerResumenDiarioGlobal(fecha);
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
            @RequestParam(required = false) Integer mes
    ) {
        var resumen = campanaGastoService.obtenerResumenMensualGlobal(anio, mes);
        return ResponseEntity.status(HttpStatus.OK).body(resumen);
    }
}
