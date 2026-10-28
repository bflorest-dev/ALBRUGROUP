package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.GastoRequest;
import pe.albrugroup.lead_service.entity.request.GrupoGastoRequest;
import pe.albrugroup.lead_service.entity.request.TipoGastoRequest;
import pe.albrugroup.lead_service.entity.response.GastoResponse;
import pe.albrugroup.lead_service.entity.response.GrupoGastoResponse;
import pe.albrugroup.lead_service.entity.response.ResumenGastosMensualResponse;
import pe.albrugroup.lead_service.entity.response.TipoGastoResponse;
import pe.albrugroup.lead_service.service.GastosGeneralesService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequestMapping("/gastos-generales")
@RequiredArgsConstructor
public class GastosGeneralesController {

    private final GastosGeneralesService service;

    // ── Grupos ──

    @GetMapping("/grupos")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FINANCIERO')")
    public ResponseEntity<List<GrupoGastoResponse>> listarGrupos() {
        return ResponseEntity.ok(service.listarGrupos());
    }

    @PostMapping("/grupos")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<GrupoGastoResponse> crearGrupo(@RequestBody @Valid GrupoGastoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearGrupo(req));
    }

    @PutMapping("/grupos/{id}")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<GrupoGastoResponse> editarGrupo(@PathVariable Long id,
                                                           @RequestBody @Valid GrupoGastoRequest req) {
        return ResponseEntity.ok(service.editarGrupo(id, req));
    }

    @DeleteMapping("/grupos/{id}")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<Void> eliminarGrupo(@PathVariable Long id) {
        service.eliminarGrupo(id);
        return ResponseEntity.noContent().build();
    }

    // ── Tipos de gasto ──

    @GetMapping("/tipos")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FINANCIERO')")
    public ResponseEntity<List<TipoGastoResponse>> listarTipos(
            @RequestParam(defaultValue = "false") boolean soloActivos) {
        return ResponseEntity.ok(soloActivos ? service.listarTiposActivos() : service.listarTipos());
    }

    @PostMapping("/tipos")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<TipoGastoResponse> crearTipo(@RequestBody @Valid TipoGastoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearTipo(req));
    }

    @PutMapping("/tipos/{id}")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<TipoGastoResponse> editarTipo(@PathVariable Long id,
                                                         @RequestBody @Valid TipoGastoRequest req) {
        return ResponseEntity.ok(service.editarTipo(id, req));
    }

    @PatchMapping("/tipos/{id}/desactivar")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<TipoGastoResponse> desactivarTipo(@PathVariable Long id) {
        return ResponseEntity.ok(service.desactivarTipo(id));
    }

    // ── Gastos ──

    @GetMapping("/gastos")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FINANCIERO')")
    public ResponseEntity<List<GastoResponse>> listarGastos(
            @RequestParam(required = false) Long idTipoGasto,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(service.listarGastos(idTipoGasto, desde, hasta));
    }

    @PostMapping("/gastos")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<GastoResponse> crearGasto(@RequestBody @Valid GastoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearGasto(req));
    }

    @PutMapping("/gastos/{id}")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<GastoResponse> editarGasto(@PathVariable Long id,
                                                      @RequestBody @Valid GastoRequest req) {
        return ResponseEntity.ok(service.editarGasto(id, req));
    }

    @DeleteMapping("/gastos/{id}")
    @PreAuthorize("hasAuthority('WRITE_DASHBOARD_FINANCIERO')")
    public ResponseEntity<Void> eliminarGasto(@PathVariable Long id) {
        service.eliminarGasto(id);
        return ResponseEntity.noContent().build();
    }

    // ── Resumen mensual ──

    @GetMapping("/resumen-mensual")
    @PreAuthorize("hasAuthority('READ_DASHBOARD_FINANCIERO')")
    public ResponseEntity<ResumenGastosMensualResponse> resumenMensual(
            @RequestParam int anio, @RequestParam int mes) {
        return ResponseEntity.ok(service.resumenMensual(anio, mes));
    }
}
