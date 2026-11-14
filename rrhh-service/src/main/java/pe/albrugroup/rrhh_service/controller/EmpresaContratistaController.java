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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.AsignarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.RegistrarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpresaContratistaResponse;
import pe.albrugroup.rrhh_service.security.UserSession;
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

    @Operation(summary = "Mis empresas contratistas",
            description = "Devuelve las empresas contratistas asignadas al usuario actual (para el selector del sidebar).")
    @GetMapping("/mis-empresas-contratistas")
    @PreAuthorize("hasAuthority('READ_CONTRATISTAS')")
    public ResponseEntity<List<EmpresaContratistaResponse>> misEmpresasContratistas(
            @AuthenticationPrincipal UserSession user) {
        List<String> roles = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .toList();
        return ResponseEntity.ok(empresaContratistaService.misEmpresasContratistas(user.empleadoId(), roles));
    }

    @Operation(summary = "Asignar empresas contratistas a un empleado",
            description = "Asigna una o mas empresas contratistas a un empleado para el scope de RRHH.")
    @PostMapping("/asignaciones")
    @PreAuthorize("hasAuthority('MANAGE_CONTRATISTA_ASSIGNMENTS')")
    public ResponseEntity<Void> asignarEmpresasContratistas(
            @Valid @RequestBody AsignarEmpresaContratistaRequest request) {
        empresaContratistaService.asignarEmpresasContratistas(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "Desasignar empresa contratista de un empleado",
            description = "Elimina la asignacion de una empresa contratista a un empleado.")
    @DeleteMapping("/asignaciones")
    @PreAuthorize("hasAuthority('MANAGE_CONTRATISTA_ASSIGNMENTS')")
    public ResponseEntity<Void> desasignarEmpresaContratista(
            @RequestParam @Positive Long idEmpleado,
            @RequestParam @Positive Long idEmpresaContratista) {
        empresaContratistaService.desasignarEmpresaContratista(idEmpleado, idEmpresaContratista);
        return ResponseEntity.noContent().build();
    }
}
