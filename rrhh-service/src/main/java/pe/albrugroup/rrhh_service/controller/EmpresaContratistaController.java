package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.RegistrarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpresaContratistaResponse;
import pe.albrugroup.rrhh_service.usecase.IEmpresaContratista;

import java.util.List;

@RestController @Validated @RequiredArgsConstructor
@Tag(name = "Empresas Contratistas", description = "Gestion de empresas contratistas")
@RequestMapping("/empresas-contratistas")
public class EmpresaContratistaController {

    private final IEmpresaContratista empresaContratistaService;

    @Operation(summary = "Registrar empresa contratista",
            description = "Registra una nueva empresa contratista con estado activo por defecto.")
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_CONTRATISTA')")
    public ResponseEntity<EmpresaContratistaResponse> registrarEmpresaContratista(
            @Valid @RequestBody RegistrarEmpresaContratistaRequest request) {
        var empresaContratista = empresaContratistaService.registrarEmpresaContratista(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(empresaContratista);
    }

    @Operation(summary = "Listar empresas contratistas",
            description = "Lista empresas contratistas filtrando opcionalmente por estado activo. Si no se envía, se consulta activo=true.")
    @GetMapping
    @PreAuthorize("hasAuthority('READ_CONTRATISTAS')")
    public ResponseEntity<List<EmpresaContratistaResponse>> listarEmpresasContratistas(
            @Parameter(description = "Estado activo de la empresa contratista", example = "true")
            @RequestParam(required = false) Boolean activo) {
        return ResponseEntity.ok(empresaContratistaService.listarEmpresasContratistas(activo));
    }

    @Operation(summary = "Desactivar empresa contratista",
            description = "Realiza una desactivacion logica de la empresa contratista.")
    @PatchMapping("/{id}/desactivar")
    @PreAuthorize("hasAuthority('DELETE_CONTRATISTA')")
    public ResponseEntity<EmpresaContratistaResponse> desactivarEmpresaContratista(
            @Parameter(description = "ID de la empresa contratista", example = "1")
            @PathVariable @Positive Long id) {
        return ResponseEntity.ok(empresaContratistaService.desactivarEmpresaContratista(id));
    }
}
