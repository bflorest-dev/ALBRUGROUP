package pe.albrugroup.auth_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.auth_service.entity.Response.EquipoResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioResponse;
import pe.albrugroup.auth_service.entity.Response.UsuarioRolResponse;
import pe.albrugroup.auth_service.entity.request.AsignarEquiposRequest;
import pe.albrugroup.auth_service.entity.request.EquipoActualizarRequest;
import pe.albrugroup.auth_service.entity.request.EquipoRequest;
import pe.albrugroup.auth_service.usecase.IEquipo;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Equipos", description = "Gestion de equipos y membresia de usuarios")
@RequestMapping("/equipos")
public class EquipoController {

    private final IEquipo equipoService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_EQUIPOS')")
    @Operation(summary = "Crear equipo", description = "Registra un nuevo equipo de trabajo.")
    public ResponseEntity<EquipoResponse> crear(@Valid @RequestBody EquipoRequest request) {
        log.info("Creando equipo: {}", request.getNombre());
        return ResponseEntity.status(HttpStatus.CREATED).body(equipoService.crear(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('READ_EQUIPOS')")
    @Operation(summary = "Listar equipos", description = "Retorna todos los equipos registrados.")
    public ResponseEntity<List<EquipoResponse>> listar() {
        return ResponseEntity.ok(equipoService.listar());
    }

    @GetMapping("/catalogo")
    @PreAuthorize("hasAuthority('READ_EQUIPOS')")
    @Operation(summary = "Catalogo de equipos", description = "Lista equipos (id y nombre) para selectores.")
    public ResponseEntity<List<EquipoResponse>> catalogo() {
        return ResponseEntity.ok(equipoService.listar());
    }

    @GetMapping("/mis-equipos")
    @PreAuthorize("hasAnyAuthority('READ_LEADS_GTR', 'ASSIGN_LEADS', 'READ_EQUIPOS')")
    @Operation(summary = "Mis equipos", description = "Lista los equipos activos visibles para el usuario autenticado.")
    public ResponseEntity<List<EquipoResponse>> misEquipos() {
        return ResponseEntity.ok(equipoService.listarMisEquipos());
    }

    @GetMapping("/{id}/asesores-preventa")
    @PreAuthorize("hasAnyAuthority('READ_LEADS_GTR', 'ASSIGN_LEADS', 'READ_EQUIPOS', 'CORREGIR_MERITO_PREVENTA')")
    @Operation(summary = "Asesores por equipo", description = "Lista asesores activos asignables para preventa en el equipo indicado.")
    public ResponseEntity<List<UsuarioRolResponse>> listarAsesoresPreventa(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(equipoService.listarAsesoresPreventa(id));
    }

    @GetMapping("/{id}/asesores-ventas-merito")
    @PreAuthorize("hasAuthority('CORREGIR_MERITO_PREVENTA')")
    @Operation(summary = "Asesores de venta por equipo", description = "Lista asesores de venta activos del equipo indicado para correccion de merito.")
    public ResponseEntity<List<UsuarioRolResponse>> listarAsesoresVentasMerito(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(equipoService.listarAsesoresVentasMerito(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_EQUIPOS')")
    @Operation(summary = "Actualizar equipo", description = "Actualiza nombre, descripcion o estado de un equipo.")
    public ResponseEntity<EquipoResponse> actualizar(
            @PathVariable @Positive Long id,
            @Valid @RequestBody EquipoActualizarRequest request
    ) {
        log.info("Actualizando equipo: {}", id);
        return ResponseEntity.ok(equipoService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_EQUIPOS')")
    @Operation(summary = "Eliminar equipo", description = "Elimina el equipo y desvincula a sus miembros.")
    public ResponseEntity<Void> eliminar(@PathVariable @Positive Long id) {
        equipoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/usuarios/{empleadoId}")
    @PreAuthorize("hasAuthority('ASSIGN_EQUIPOS')")
    @Operation(summary = "Asignar equipos a usuario", description = "Reemplaza los equipos del usuario. Roles operativos: exactamente uno.")
    public ResponseEntity<UsuarioResponse> asignarEquipos(
            @PathVariable @Positive Long empleadoId,
            @Valid @RequestBody AsignarEquiposRequest request
    ) {
        log.info("Asignando equipos {} al empleado {}", request.getEquipoIds(), empleadoId);
        return ResponseEntity.ok(equipoService.asignarEquipos(empleadoId, request.getEquipoIds()));
    }

    @GetMapping("/{id}/usuarios")
    @PreAuthorize("hasAuthority('READ_EQUIPOS')")
    @Operation(summary = "Listar miembros del equipo", description = "Retorna los usuarios activos asignados al equipo.")
    public ResponseEntity<List<UsuarioRolResponse>> listarMiembros(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(equipoService.listarMiembros(id));
    }
}
