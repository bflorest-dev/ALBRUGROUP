package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.request.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.usecase.IEmpleado;

@RestController @Validated
@RequiredArgsConstructor
@Tag(name = "Empleados", description = "Gestion y registro de Postulantes/Empleados")
@RequestMapping("/empleados")
public class EmpleadoController {

    private final IEmpleado empleadoService;

    @Operation(summary = "Listado de Empleados",
            description = "Obtiene empleados con filtros opcionales por texto libre, documento, celular, distrito, banco, " +
                    "estado operativo y paginación.")
    @GetMapping
    public ResponseEntity<Page<EmpleadoResponse>> getEmpleados(
    @Parameter(description = "Texto libre para búsqueda en múltiples campos", example = "Perez")
            @RequestParam(required = false) String q,
    @Parameter(description = "Número de documento (DNI u otro)", example = "12345678")
            @RequestParam(required = false) String dni,
    @Parameter(description = "Celular personal", example = "999888777")
            @RequestParam(required = false) String celular,
    @Parameter(description = "Distrito del empleado", schema = @Schema(implementation = Distrito.class))
            @RequestParam(required = false) Distrito distrito,
    @Parameter(description = "Banco para el pago", schema = @Schema(implementation = Banco.class))
            @RequestParam(required = false) Banco banco,
    @Parameter(description = "Estado operativo del empleado", schema = @Schema(implementation = EstadoOperativo.class))
            @RequestParam(required = false) EstadoOperativo estado,
    @Parameter(description = "Parámetros de paginación: `page`, `size`, `sort` (ejemplo: sort=apellidos,asc)")
            Pageable pageable
    ) {
        return ResponseEntity.ok(empleadoService.getEmpleados(q, dni, celular, distrito, banco, estado, pageable));
    }
    @Operation(
            summary = "Búsqueda universal de empleados",
            description = "Busca empleados por un dato único (documento, nombres, apellidos, celular o correo) con paginación."
    )
    @GetMapping("/{dato}/universal")
    public ResponseEntity<Page<EmpleadoResponse>> obtenerEmpleadoFiltroUniversal(
    @Parameter(description = "Dato universal para búsqueda (documento, nombres, apellidos, celular o correo)", example = "Juan")
            @PathVariable String dato,
    @Parameter(description = "Parámetros de paginación: `page`, `size`, `sort` (ejemplo: sort=nombres,asc)")
            Pageable pageable) {
        return ResponseEntity.ok(empleadoService.getEmpleadoUniversal(dato, pageable));
    }
    @Operation(
            summary = "Obtener empleado por número de documento",
            description = "Devuelve la información del empleado asociado al número de documento."
    )
    @GetMapping("/{documento}/numero-documento")
    public ResponseEntity<EmpleadoResponse> getEmpleadoNumeroDocumento(
    @Parameter(description = "Número de documento del empleado", example = "12345678")
            @PathVariable @Positive String documento) {
        return ResponseEntity.ok(empleadoService.getEmpleadoDocumento(documento));
    }

    @Operation(summary = "Registrar empleado",
            description = "Registra un nuevo empleado a partir de datos personales, de contacto, financieros y corporativos.")
    @PostMapping
    public ResponseEntity<EmpleadoResponse> registrarEmpleado(@RequestBody RegistrarEmpleadoRequest request) {
        var empleado = empleadoService.registrarEmpleado(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(empleado);
    }

    @Operation(summary = "Actualizar datos personales",
            description = "Actualiza nombres, apellidos, documento, estado civil, fecha de nacimiento y datos personales del empleado.")
    @PatchMapping("/{id}/datos-personales")
    public ResponseEntity<EmpleadoResponse> actulizarDatosPersonales(@RequestBody DatosPersonalesRequest request,
                                                                     @Parameter(description = "ID del empleado", example = "10")
                                                                     @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarDatosPersonales(id, request);
        return ResponseEntity.ok(empleado);
    }
    @Operation(summary = "Actualizar datos de contacto y ubicación",
            description = "Actualiza celular, correo, dirección y distrito del empleado.")
    @PatchMapping("/{id}/datos-contacto-ubicacion")
    public ResponseEntity<EmpleadoResponse> actulizarDatosContactoUbicacion(@RequestBody DatosContactoUbicacionRequest request,
                                                                            @Parameter(description = "ID del empleado", example = "10")
                                                                            @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarContactoUbicacion(id, request);
        return ResponseEntity.ok(empleado);
    }
    @Operation(summary = "Actualizar datos financieros",
            description = "Actualiza banco, cuenta bancaria, CCI y datos financieros del empleado.")
    @PatchMapping("/{id}/datos-financieros")
    public ResponseEntity<EmpleadoResponse> actualizarDatosFinancieros(@RequestBody DatosFinancierosRequest request,
                                                                       @Parameter(description = "ID del empleado", example = "10")
                                                                       @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarDatosFinancieros(id, request);
        return ResponseEntity.ok(empleado);
    }
    @Operation(summary = "Actualizar datos corporativos",
            description = "Actualiza el correo y celular corporativo, y demás datos de contacto corporativo del empleado.")
    @PatchMapping("/{id}/datos-corporativos")
    public ResponseEntity<EmpleadoResponse> actualizarDatosCorporativos(@RequestBody DatosContactoCorporativoRequest request,
                                                                        @Parameter(description = "ID del empleado", example = "10")
                                                                        @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarContactoCorporativo(id, request);
        return ResponseEntity.ok(empleado);
    }
}
