package pe.albrugroup.schedule_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarAjusteRequest;
import pe.albrugroup.schedule_service.entity.response.horario.AjusteJornadaResponse;
import pe.albrugroup.schedule_service.service.AjusteJornadaService;

/**
 * Ajustes de jornada v2 (con RAZON): ampliacion operativa / corrimiento por tardanza. Convive con el
 * flujo viejo (AmpliacionHorarioController, AjusteJornadaController) hasta el cutover. El permiso grueso
 * es EXTEND_HORARIO; la autorizacion fina (rol + razon + limite) vive en la capa service.
 */
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia/v2/empleados/{idEmpleado}/ajustes")
public class AjusteV2Controller {

    private final AjusteJornadaService ajusteJornadaService;

    @PostMapping
    @PreAuthorize("hasAuthority('EXTEND_HORARIO')")
    public ResponseEntity<AjusteJornadaResponse> registrar(
            @PathVariable @Positive Long idEmpleado,
            @Valid @RequestBody RegistrarAjusteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ajusteJornadaService.registrarV2(idEmpleado, request));
    }
}
