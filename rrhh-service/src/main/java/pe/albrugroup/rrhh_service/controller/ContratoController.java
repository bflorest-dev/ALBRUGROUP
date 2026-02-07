package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;
import pe.albrugroup.rrhh_service.usecase.IContrato;

import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@Tag(name = "Contratos", description = "Gestion y registro de Contratos/Puestos de Trabajo")
@RequestMapping("/contratos")
public class ContratoController {

    private final IContrato contratoService;

    @GetMapping("/vigentes")
    public ResponseEntity<List<ContratoResponse>> listarContratosVigentes() {
        return ResponseEntity.ok(contratoService.listarContratosVigentes());
    }
    @GetMapping("/{id}/vigentes")
    public ResponseEntity<List<ContratoResponse>> listarContratosEmpleado(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(contratoService.listarContratosEmpleado(id));
    }
    @GetMapping("/{id}/vigente")
    public ResponseEntity<ContratoResponse> getContratoVigenteEmpleado(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(contratoService.getContratoVigente(id));
    }
    @PostMapping("/{id}/registrar")
    public ResponseEntity<ContratoResponse> registrarContrato(@RequestBody RegistrarContratoRequest request,
                                                              @PathVariable @Positive Long id) {
        var contrato = contratoService.registrarContrato(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(contrato);
    }
    @PatchMapping("/{id}/cesar-contrato")
    public ResponseEntity<ContratoResponse> cerrarContrato(@RequestBody CerrarContratoRequest request,
                                                           @PathVariable @Positive Long id) {
        var contrato = contratoService.cerrarContrato(id, request);
        return ResponseEntity.ok(contrato);
    }
}
