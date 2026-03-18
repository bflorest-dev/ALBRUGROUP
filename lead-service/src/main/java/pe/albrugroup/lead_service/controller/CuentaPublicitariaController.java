package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.CuentaPublicitariaRequest;
import pe.albrugroup.lead_service.entity.response.CuentaPublicitariaResponse;
import pe.albrugroup.lead_service.service.CuentaPublicitariaService;

import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/cuentas-publicitarias")
public class CuentaPublicitariaController {

    private final CuentaPublicitariaService cuentaPublicitariaService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_CUENTA_PUBLICITARIA')")
    public ResponseEntity<CuentaPublicitariaResponse> registrarCuentaPublicitaria(@RequestBody CuentaPublicitariaRequest request)
    {
        var cuentaPublicitaria = cuentaPublicitariaService.registrarCuentaPublicitaria(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cuentaPublicitaria);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('READ_CUENTAS_PUBLICITARIAS')")
    public ResponseEntity<List<CuentaPublicitariaResponse>> listarCuentasPublicitarias(@RequestParam(required = false) Boolean activo)
    {
        var cuentasPublicitarias = cuentaPublicitariaService.listarCuentasPublicitarias(activo);
        return ResponseEntity.status(HttpStatus.OK).body(cuentasPublicitarias);
    }

    @GetMapping("/activas")
    @PreAuthorize("hasAuthority('READ_CUENTAS_PUBLICITARIAS')")
    public ResponseEntity<List<CuentaPublicitariaResponse>> listarCuentasPublicitariasActivas()
    {
        var cuentasPublicitarias = cuentaPublicitariaService.listarCuentasPublicitarias(Boolean.TRUE);
        return ResponseEntity.status(HttpStatus.OK).body(cuentasPublicitarias);
    }

    @DeleteMapping("/{idCuentaPublicitaria}")
    @PreAuthorize("hasAuthority('DELETE_CUENTA_PUBLICITARIA')")
    public ResponseEntity<CuentaPublicitariaResponse> desactivarCuentaPublicitaria(@PathVariable Long idCuentaPublicitaria)
    {
        var cuentaPublicitaria = cuentaPublicitariaService.desactivarCuentaPublicitaria(idCuentaPublicitaria);
        return ResponseEntity.status(HttpStatus.OK).body(cuentaPublicitaria);
    }
}
