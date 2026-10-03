package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.RecargaCuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.RecargaCuentaPublicitariaResponse;
import pe.albrugroup.lead_service.service.RecargaCuentaPublicitariaService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/cuentas-publicitarias")
public class RecargaCuentaPublicitariaController {

    private final RecargaCuentaPublicitariaService recargaService;

    @PostMapping("/recargas")
    @PreAuthorize("hasAuthority('REGISTRAR_RECARGA_CUENTA')")
    public ResponseEntity<RecargaCuentaPublicitariaResponse> registrar(
            @Valid @RequestBody RecargaCuentaPublicitariaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recargaService.registrar(request));
    }

    @PutMapping("/recargas/{id}")
    @PreAuthorize("hasAuthority('REGISTRAR_RECARGA_CUENTA')")
    public ResponseEntity<RecargaCuentaPublicitariaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody RecargaCuentaPublicitariaRequest request) {
        return ResponseEntity.ok(recargaService.actualizar(id, request));
    }

    @GetMapping("/{idCuenta}/recargas")
    @PreAuthorize("hasAuthority('READ_RECARGAS_CUENTA')")
    public ResponseEntity<List<RecargaCuentaPublicitariaResponse>> listarPorCuenta(
            @PathVariable Long idCuenta,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(recargaService.listarPorCuenta(idCuenta, desde, hasta));
    }

    @GetMapping("/recargas")
    @PreAuthorize("hasAuthority('READ_RECARGAS_CUENTA')")
    public ResponseEntity<List<RecargaCuentaPublicitariaResponse>> listarRecargas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long idProveedor) {
        return ResponseEntity.ok(recargaService.listarPorRango(desde, hasta, idProveedor));
    }
}
