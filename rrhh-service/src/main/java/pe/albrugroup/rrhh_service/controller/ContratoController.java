package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

    @Operation(summary = "Histórico de contratos por empleado",
            description = "Obtiene el listado completo de contratos registrados para un empleado.")
    @GetMapping("/{id}/historico")
    public ResponseEntity<List<ContratoResponse>> listarContratosEmpleado(
    @Parameter(description = "ID del empleado", example = "10")
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(contratoService.listarContratosEmpleado(id));
    }
    @Operation(summary = "Contrato vigente por empleado",
            description = "Devuelve el contrato vigente del empleado según la fecha actual.")
    @GetMapping("/{id}/vigente")
    public ResponseEntity<ContratoResponse> getContratoVigenteEmpleado(
            @Parameter(description = "ID del empleado", example = "10")
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(contratoService.getContratoVigente(id));
    }
    @Operation(summary = "Registrar contrato",
            description = "Registra un nuevo contrato para el empleado. Si existe un contrato vigente, se ajusta su fecha fin " +
                    "para evitar solapamientos.")
    @PostMapping("/{id}/registrar")
    public ResponseEntity<ContratoResponse> registrarContrato(@RequestBody RegistrarContratoRequest request,
                                              @Parameter(description = "ID del empleado", example = "10")
                                                              @PathVariable @Positive Long id) {
        var contrato = contratoService.registrarContrato(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(contrato);
    }
    @Operation(summary = "Finalizar contrato",
            description = "Cierra el contrato vigente del empleado con la fecha de fin indicada.")
    @PatchMapping("/{id}/cesar-contrato")
    public ResponseEntity<ContratoResponse> finalizarContrato(@RequestBody CerrarContratoRequest request,
                                                           @Parameter(description = "ID del empleado", example = "10")
                                                           @PathVariable @Positive Long id) {
        var contrato = contratoService.finalizarContrato(id, request);
        return ResponseEntity.ok(contrato);
    }
}
