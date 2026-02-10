package pe.albrugroup.rrhh_service.controller;

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

    @GetMapping
    public ResponseEntity<Page<EmpleadoResponse>> getEmpleados(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String dni,
            @RequestParam(required = false) String celular,
            @RequestParam(required = false) Distrito distrito,
            @RequestParam(required = false) Banco banco,
            @RequestParam(required = false) EstadoOperativo estado,
            Pageable pageable
    ) {
        return ResponseEntity.ok(empleadoService.getEmpleados(q, dni, celular, distrito, banco, estado, pageable));
    }
    @GetMapping("/{dato}/universal")
    public ResponseEntity<Page<EmpleadoResponse>> obtenerEmpleadoFiltroUniversal(@PathVariable String dato, Pageable pageable) {
        return ResponseEntity.ok(empleadoService.getEmpleadoUniversal(dato, pageable));
    }
    @GetMapping("/{documento}/numero-documento")
    public ResponseEntity<EmpleadoResponse> getEmpleadoNumeroDocumento(@PathVariable @Positive String documento) {
        return ResponseEntity.ok(empleadoService.getEmpleadoDocumento(documento));
    }

    @PostMapping
    public ResponseEntity<EmpleadoResponse> registrarEmpleado(@RequestBody RegistrarEmpleadoRequest request) {
        var empleado = empleadoService.registrarEmpleado(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(empleado);
    }

    @PatchMapping("/{id}/datos-personales")
    public ResponseEntity<EmpleadoResponse> actulizarDatosPersonales(@RequestBody DatosPersonalesRequest request,
                                                                     @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarDatosPersonales(id, request);
        return ResponseEntity.ok(empleado);
    }
    @PatchMapping("/{id}/datos-contacto-ubicacion")
    public ResponseEntity<EmpleadoResponse> actulizarDatosContactoUbicacion(@RequestBody DatosContactoUbicacionRequest request,
                                                                            @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarContactoUbicacion(id, request);
        return ResponseEntity.ok(empleado);
    }
    @PatchMapping("/{id}/datos-financieros")
    public ResponseEntity<EmpleadoResponse> actualizarDatosFinancieros(@RequestBody DatosFinancierosRequest request,
                                                                       @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarDatosFinancieros(id, request);
        return ResponseEntity.ok(empleado);
    }
    @PatchMapping("/{id}/datos-corporativos")
    public ResponseEntity<EmpleadoResponse> actualizarDatosCorporativos(@RequestBody DatosContactoCorporativoRequest request,
                                                                        @PathVariable @Positive Long id) {
        var empleado = empleadoService.actualizarContactoCorporativo(id, request);
        return ResponseEntity.ok(empleado);
    }
}
