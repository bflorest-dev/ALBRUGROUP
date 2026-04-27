package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.DatosContactoCorporativoRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.DatosContactoUbicacionRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.DatosFinancierosRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.DatosPersonalesRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.RegistrarEmpleadoRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoRolResponse;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.security.UserSession;
import pe.albrugroup.rrhh_service.usecase.IEmpleado;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@Tag(name = "Empleados", description = "Gestion y registro de empleados")
@RequestMapping("/empleados")
public class EmpleadoController {

    private final IEmpleado empleadoService;

    @PatchMapping("/{id}/lista-negra")
    @PreAuthorize("hasAuthority('BLACKLIST_EMPLEADO')")
    public ResponseEntity<EmpleadoResponse> marcarListaNegra(@PathVariable @Positive Long id,
                                                             @AuthenticationPrincipal UserSession user) {
        var emplado = empleadoService.listaNegraEmpleado(id, user.empleadoId());
        return ResponseEntity.ok(emplado);
    }

    @Operation(summary = "Listado de Empleados",
            description = "Obtiene empleados con filtros opcionales por texto libre, documento, celular, distrito, banco, empresa contratista, " +
                    "estado operativo y paginacion.")
    @GetMapping
    @PreAuthorize("hasAuthority('READ_EMPLEADOS')")
    public ResponseEntity<PageResponse<EmpleadoResponse>> getEmpleados(
            @Parameter(description = "Texto libre para busqueda en multiples campos", example = "Perez")
            @RequestParam(required = false) String q,
            @Parameter(description = "Numero de documento (DNI u otro)", example = "12345678")
            @RequestParam(required = false) String dni,
            @Parameter(description = "Celular personal", example = "999888777")
            @RequestParam(required = false) String celular,
            @Parameter(description = "Distrito del empleado", schema = @Schema(implementation = Distrito.class))
            @RequestParam(required = false) Distrito distrito,
            @Parameter(description = "Banco para el pago", schema = @Schema(implementation = Banco.class))
            @RequestParam(required = false) Banco banco,
            @Parameter(description = "ID de la empresa contratista", example = "1")
            @RequestParam(required = false) @Positive Long idEmpresaContratista,
            @Parameter(description = "Origen del empleado", schema = @Schema(implementation = Origen.class))
            @RequestParam(required = false) Origen origen,
            @Parameter(description = "Estado operativo del empleado", schema = @Schema(implementation = EstadoOperativo.class))
            @RequestParam(required = false) EstadoOperativo estado,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(
                empleadoService.getEmpleados(q, dni, celular, distrito, banco, idEmpresaContratista, origen, estado, pageRequest)
        );
    }

    @Operation(
            summary = "Busqueda universal de empleados",
            description = "Busca empleados por un dato unico (documento, nombres, apellidos, celular o correo) con paginacion."
    )
    @GetMapping("/{dato}/universal")
    @PreAuthorize("hasAuthority('READ_EMPLEADOS')")
    public ResponseEntity<PageResponse<EmpleadoResponse>> obtenerEmpleadoFiltroUniversal(
            @Parameter(description = "Dato universal para busqueda (documento, nombres, apellidos, celular o correo)", example = "Juan")
            @PathVariable String dato,
            @Valid @ModelAttribute PageRequest pageRequest) {
        return ResponseEntity.ok(
                empleadoService.getEmpleadoUniversal(dato, pageRequest)
        );
    }

    @Operation(
            summary = "Listar empleados vigentes de forma ligera",
            description = "Devuelve empleados activos con contrato vigente a la fecha actual. Permite filtrar opcionalmente por uno o varios puestos de trabajo."
    )
    @GetMapping("/light")
    @PreAuthorize("hasAuthority('READ_EMPLEADOS')")
    public ResponseEntity<List<EmpleadoRolResponse>> listarEmpleadosLight(
            @RequestParam(required = false) List<PuestoTrabajo> puestosTrabajo
    ) {
        return ResponseEntity.ok(empleadoService.listarEmpleadosLight(puestosTrabajo));
    }

    @Operation(
            summary = "Listar personal activo para recruitment",
            description = "Devuelve empleados activos con contrato vigente cuyo puesto de trabajo es CAPACITADOR, RECLUTADOR o RRHH."
    )
    @GetMapping("/personal-recruitment")
    @PreAuthorize("hasAuthority('READ_PERSONAL_RECRUITMENT')")
    public ResponseEntity<List<EmpleadoRolResponse>> listarPersonalRecruitment() {
        return ResponseEntity.ok(empleadoService.listarPersonalRecruitment());
    }

    @Operation(
            summary = "Obtener empleado por numero de documento",
            description = "Devuelve la informacion del empleado asociado al numero de documento."
    )
    @GetMapping("/{documento}/numero-documento")
    @PreAuthorize("hasAuthority('READ_EMPLEADOS')")
    public ResponseEntity<EmpleadoResponse> getEmpleadoNumeroDocumento(
            @Parameter(description = "Numero de documento del empleado", example = "12345678")
            @PathVariable @Positive String documento) {
        return ResponseEntity.ok(empleadoService.getEmpleadoDocumento(documento));
    }

    @Operation(summary = "Registrar empleado",
            description = "Registra un nuevo empleado a partir de datos personales, de contacto, financieros y corporativos.")
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_EMPLEADOS')")
    public ResponseEntity<EmpleadoResponse> registrarEmpleado(@RequestBody RegistrarEmpleadoRequest request,
                                                              @AuthenticationPrincipal UserSession user) {
        var empleado = empleadoService.registrarEmpleado(request, user.empleadoId());
        return ResponseEntity.status(HttpStatus.CREATED).body(empleado);
    }

    @Operation(summary = "Actualizar datos personales",
            description = "Actualiza nombres, apellidos, documento, estado civil, fecha de nacimiento y datos personales del empleado.")
    @PatchMapping("/{id}/datos-personales")
    @PreAuthorize("hasAuthority('UPDATE_EMPLEADOS')")
    public ResponseEntity<EmpleadoResponse> actulizarDatosPersonales(@RequestBody DatosPersonalesRequest request,
                                                                     @Parameter(description = "ID del empleado", example = "10")
                                                                     @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarDatosPersonales(id, request);
        return ResponseEntity.ok(empleado);
    }

    @Operation(summary = "Actualizar datos de contacto y ubicacion",
            description = "Actualiza celular, correo, direccion y distrito del empleado.")
    @PatchMapping("/{id}/datos-contacto-ubicacion")
    @PreAuthorize("hasAuthority('UPDATE_EMPLEADOS')")
    public ResponseEntity<EmpleadoResponse> actulizarDatosContactoUbicacion(@RequestBody DatosContactoUbicacionRequest request,
                                                                            @Parameter(description = "ID del empleado", example = "10")
                                                                            @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarContactoUbicacion(id, request);
        return ResponseEntity.ok(empleado);
    }

    @Operation(summary = "Actualizar datos financieros",
            description = "Actualiza banco, cuenta bancaria, CCI y datos financieros del empleado.")
    @PatchMapping("/{id}/datos-financieros")
    @PreAuthorize("hasAuthority('UPDATE_EMPLEADOS')")
    public ResponseEntity<EmpleadoResponse> actualizarDatosFinancieros(@RequestBody DatosFinancierosRequest request,
                                                                       @Parameter(description = "ID del empleado", example = "10")
                                                                       @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarDatosFinancieros(id, request);
        return ResponseEntity.ok(empleado);
    }

    @Operation(summary = "Actualizar datos corporativos",
            description = "Actualiza el correo y celular corporativo, y demas datos de contacto corporativo del empleado.")
    @PatchMapping("/{id}/datos-corporativos")
    @PreAuthorize("hasAuthority('UPDATE_EMPLEADOS')")
    public ResponseEntity<EmpleadoResponse> actualizarDatosCorporativos(@RequestBody DatosContactoCorporativoRequest request,
                                                                        @Parameter(description = "ID del empleado", example = "10")
                                                                        @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarContactoCorporativo(id, request);
        return ResponseEntity.ok(empleado);
    }
}
